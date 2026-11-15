'use client';

import {
  ArrowLeft,
  Loader2,
  Send,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, chatsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';

function mergeMessages(current, incoming) {
  if (!incoming?.id || current.some((message) => message.id === incoming.id)) {
    return current;
  }
  return [...current, incoming].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() -
      new Date(second.createdAt).getTime()
  );
}

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ChatView({ conversationId }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const [isSending, setIsSending] = useState(false);
  const socketRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pendingMessagesRef = useRef(new Map());
  const draftMessageIdRef = useRef(null);
  const draftMessageContentRef = useRef('');
  const shouldScrollRef = useRef(true);

  const appendMessage = useCallback((message) => {
    setMessages((current) => mergeMessages(current, message));
  }, []);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return undefined;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(false);
    setConversation(null);
    setMessages([]);
    setLoadedCount(0);
    setHasMore(false);
    setSocketStatus('connecting');

    Promise.all([
      chatsApi.getConversation(conversationId),
      chatsApi.getMessages(conversationId, 50, 0),
    ])
      .then(([conversationResult, messagesResult]) => {
        if (cancelled) return;
        setConversation(conversationResult.conversation);
        setMessages(messagesResult.messages || []);
        setLoadedCount(messagesResult.messages?.length || 0);
        setHasMore(Boolean(messagesResult.hasMore));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(true);
        toast.error(
          err instanceof ApiError ? err.message : 'Unable to load conversation.'
        );
        if (err instanceof ApiError && err.status === 404) {
          router.replace('/messages');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return undefined;
    let active = true;
    let stopReconnect = false;
    let socket;
    let retryTimer;
    let retryDelay = 1000;

    const scheduleReconnect = () => {
      if (!active || stopReconnect) return;
      setSocketStatus('reconnecting');
      retryTimer = setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30000);
    };

    const connect = async () => {
      setSocketStatus('connecting');
      try {
        const { ticket, socketUrl } = await chatsApi.getSocketTicket();
        if (!active) return;
        const url = `${socketUrl}?ticket=${encodeURIComponent(ticket)}`;
        socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          retryDelay = 1000;
          setSocketStatus('connecting');
          socket.send(
            JSON.stringify({ type: 'subscribe', conversationId })
          );
        };
        socket.onmessage = (event) => {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            return;
          }
          if (data.type === 'new_message' || data.type === 'message_sent') {
            appendMessage(data.message);
            if (data.clientMessageId) {
              pendingMessagesRef.current.delete(data.clientMessageId);
              if (draftMessageIdRef.current === data.clientMessageId) {
                draftMessageIdRef.current = null;
                draftMessageContentRef.current = '';
              }
              setIsSending(pendingMessagesRef.current.size > 0);
            }
          } else if (data.type === 'error') {
            const pendingText = data.clientMessageId
              ? pendingMessagesRef.current.get(data.clientMessageId)
              : null;
            if (data.clientMessageId) {
              pendingMessagesRef.current.delete(data.clientMessageId);
            }
            if (pendingText) setDraft((current) => current || pendingText);
            setIsSending(pendingMessagesRef.current.size > 0);
            toast.error(data.error || 'Chat action failed.');
          } else if (data.type === 'subscribed') {
            setSocketStatus('connected');
          } else if (data.type === 'subscription_error') {
            stopReconnect = true;
            setSocketStatus('offline');
            toast.error(data.error || 'Unable to open this conversation.');
            socket.close();
          }
        };
        socket.onerror = () => socket.close();
        socket.onclose = () => {
          if (socketRef.current === socket) socketRef.current = null;
          const pendingText = [...pendingMessagesRef.current.values()].pop();
          pendingMessagesRef.current.clear();
          setIsSending(false);
          if (pendingText) setDraft((current) => current || pendingText);
          if (stopReconnect) {
            setSocketStatus('offline');
          } else {
            scheduleReconnect();
          }
        };
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          setSocketStatus('offline');
          toast.error('Your session expired. Please sign in again.');
          return;
        }
        scheduleReconnect();
      }
    };

    connect();
    return () => {
      active = false;
      clearTimeout(retryTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [appendMessage, conversationId, isAuthenticated, isAuthLoading]);

  useEffect(() => {
    if (!shouldScrollRef.current) {
      shouldScrollRef.current = true;
      return;
    }
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  const loadOlderMessages = async () => {
    if (isLoadingOlder || !hasMore) return;
    shouldScrollRef.current = false;
    setIsLoadingOlder(true);
    try {
      const result = await chatsApi.getMessages(
        conversationId,
        50,
        loadedCount
      );
      setMessages((current) => {
        const existingIds = new Set(current.map((message) => message.id));
        return [
          ...(result.messages || []).filter(
            (message) => !existingIds.has(message.id)
          ),
          ...current,
        ];
      });
      setLoadedCount((count) => count + (result.messages?.length || 0));
      setHasMore(Boolean(result.hasMore));
    } catch (err) {
      shouldScrollRef.current = true;
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to load older messages.'
      );
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    const socket = socketRef.current;
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      socketStatus !== 'connected'
    ) {
      toast.error('Reconnecting to chat. Please try again in a moment.');
      return;
    }

    const clientMessageId =
      draftMessageIdRef.current ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    draftMessageIdRef.current = clientMessageId;
    draftMessageContentRef.current = content;
    pendingMessagesRef.current.set(clientMessageId, content);
    setIsSending(true);
    try {
      socket.send(
        JSON.stringify({
          type: 'send_message',
          conversationId,
          content,
          clientMessageId,
        })
      );
      setDraft('');
    } catch {
      pendingMessagesRef.current.delete(clientMessageId);
      setIsSending(false);
      toast.error('Unable to send message. Please try again.');
    }
  };

  if (isAuthLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <p className="text-sm text-[#64748B]">
          Sign in to continue to this conversation.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (loadError && !conversation) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <p className="text-sm text-[#64748B]">Conversation is unavailable.</p>
        <Link
          href="/messages"
          className="mt-4 inline-flex text-sm font-semibold text-[#4F46E5] hover:underline"
        >
          Back to messages
        </Link>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
      <header className="flex items-center gap-3 border-b border-[#E2E8F0] px-4 py-3 sm:px-5">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {conversation && (
          <Link
            href={`/profile/${conversation.friend.id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <Avatar
              src={conversation.friend.profilePicture}
              name={conversation.friend.name}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0F172A]">
                {conversation.friend.name}
              </p>
              <p className="truncate text-xs text-[#64748B]">
                @{conversation.friend.username}
              </p>
            </div>
          </Link>
        )}
        <div
          className="flex items-center gap-1.5 text-xs text-[#64748B]"
          aria-live="polite"
        >
          {socketStatus === 'connected' ? (
            <Wifi className="h-3.5 w-3.5 text-[#16A34A]" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          <span>
            {socketStatus === 'connected'
              ? 'Online'
              : socketStatus === 'offline'
                ? 'Offline'
                : 'Reconnecting'}
          </span>
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        className="h-[55vh] min-h-72 space-y-3 overflow-y-auto bg-[#F8FAFC] px-4 py-4 sm:px-5"
      >
        {hasMore && (
          <div className="text-center">
            <button
              type="button"
              onClick={loadOlderMessages}
              disabled={isLoadingOlder}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#64748B] disabled:opacity-60"
            >
              {isLoadingOlder && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Load older messages
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-[#0F172A]">
              This is the beginning of your conversation.
            </p>
            <p className="mt-1 text-xs text-[#64748B]">
              Send a message to say hello.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender?.id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[75%] ${
                    isOwnMessage
                      ? 'rounded-br-md bg-[#6366F1] text-white'
                      : 'rounded-bl-md border border-[#E2E8F0] bg-white text-[#0F172A]'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-right text-[10px] ${
                      isOwnMessage ? 'text-white/75' : 'text-[#94A3B8]'
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-[#E2E8F0] p-3 sm:p-4"
      >
        <textarea
          value={draft}
          onChange={(event) => {
            const nextDraft = event.target.value;
            if (
              draftMessageIdRef.current &&
              nextDraft !== draftMessageContentRef.current
            ) {
              draftMessageIdRef.current = null;
              draftMessageContentRef.current = '';
            }
            setDraft(nextDraft);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={2000}
          rows={1}
          aria-label="Write a message"
          placeholder="Write a message..."
          className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#A5B4FC] focus:ring-2 focus:ring-[#EEF2FF]"
        />
        <button
          type="submit"
          disabled={
            !draft.trim() || socketStatus !== 'connected' || isSending
          }
          aria-label="Send message"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6366F1] text-white transition-colors hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="px-4 pb-3 text-right text-[10px] text-[#94A3B8]">
        {draft.length}/2,000
      </p>
    </section>
  );
}
