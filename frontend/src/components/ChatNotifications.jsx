'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { ApiError, chatsApi, friendsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const ChatNotificationsContext = createContext(null);

function getConversationId(pathname) {
  return pathname.match(/^\/messages\/([a-f\d]{24})$/i)?.[1] || null;
}

export function useChatNotifications() {
  const context = useContext(ChatNotificationsContext);
  if (!context) {
    throw new Error(
      'useChatNotifications must be used within ChatNotificationsProvider.'
    );
  }
  return context;
}

export function ChatNotificationsProvider({ children }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByConversation, setUnreadByConversation] = useState({});
  const pathnameRef = useRef(pathname);
  const socketRef = useRef(null);
  const conversationIdsRef = useRef([]);
  const subscriptionsRef = useRef(new Set());
  const pendingSubscriptionsRef = useRef(new Set());
  const seenMessagesRef = useRef(new Set());
  const readTimersRef = useRef(new Map());
  const lastErrorAtRef = useRef(0);

  const reportError = useCallback((err, fallback) => {
    if (Date.now() - lastErrorAtRef.current < 30000) return;
    lastErrorAtRef.current = Date.now();
    toast.error(err instanceof ApiError ? err.message : fallback);
  }, []);

  const refreshUnreadCounts = useCallback(async () => {
    const result = await chatsApi.getUnreadCount();
    const nextCounts = Object.fromEntries(
      (result.conversations || []).map(({ conversationId, unreadCount }) => [
        conversationId,
        unreadCount,
      ])
    );
    setUnreadByConversation(nextCounts);
    setUnreadCount(result.unreadCount || 0);
  }, []);

  const subscribeToConversations = useCallback(
    (conversationIds) => {
      const socket = socketRef.current;
      if (
        typeof WebSocket === 'undefined' ||
        !socket ||
        socket.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      for (const conversationId of conversationIds) {
        if (subscriptionsRef.current.has(conversationId)) continue;
        try {
          socket.send(JSON.stringify({ type: 'subscribe', conversationId }));
          subscriptionsRef.current.add(conversationId);
          pendingSubscriptionsRef.current.add(conversationId);
        } catch (err) {
          reportError(err, 'Unable to subscribe to message notifications.');
        }
      }

      if (pendingSubscriptionsRef.current.size === 0) {
        refreshUnreadCounts().catch((err) =>
          reportError(err, 'Unable to refresh unread messages.')
        );
      }
    },
    [refreshUnreadCounts, reportError]
  );

  const refreshConnections = useCallback(async () => {
    const result = await friendsApi.getAll();
    const friends = result.friends || [];
    conversationIdsRef.current = friends.map(
      (friendship) => friendship.conversationId
    );
    subscribeToConversations(conversationIdsRef.current);
    return friends;
  }, [subscribeToConversations]);

  const markConversationRead = useCallback(
    async (conversationId) => {
      await chatsApi.markRead(conversationId);
      await refreshUnreadCounts();
    },
    [refreshUnreadCounts]
  );

  const scheduleMarkRead = useCallback(
    (conversationId) => {
      const previousTimer = readTimersRef.current.get(conversationId);
      if (previousTimer) clearTimeout(previousTimer);

      const timer = setTimeout(() => {
        readTimersRef.current.delete(conversationId);
        markConversationRead(conversationId).catch((err) =>
          reportError(err, 'Unable to mark messages as read.')
        );
      }, 250);
      readTimersRef.current.set(conversationId, timer);
    },
    [markConversationRead, reportError]
  );

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (isAuthLoading) return undefined;
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0);
      setUnreadByConversation({});
      conversationIdsRef.current = [];
      seenMessagesRef.current.clear();
      return undefined;
    }

    let active = true;
    let stopReconnect = false;
    let retryDelay = 1000;
    let retryTimer;
    let socket;

    const scheduleReconnect = () => {
      if (!active || stopReconnect) return;
      retryTimer = setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30000);
    };

    const connect = async () => {
      try {
        await Promise.all([refreshConnections(), refreshUnreadCounts()]);
        if (!active) return;
        if (typeof WebSocket === 'undefined') {
          throw new Error('This browser does not support live messaging.');
        }

        const { ticket, socketUrl } = await chatsApi.getSocketTicket();
        if (!active) return;
        socket = new WebSocket(
          `${socketUrl}?ticket=${encodeURIComponent(ticket)}`
        );
        socketRef.current = socket;

        socket.onopen = () => {
          retryDelay = 1000;
        };
        socket.onmessage = (event) => {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            return;
          }

          if (data.type === 'ready') {
            subscriptionsRef.current.clear();
            pendingSubscriptionsRef.current.clear();
            subscribeToConversations(conversationIdsRef.current);
          } else if (data.type === 'subscribed') {
            pendingSubscriptionsRef.current.delete(data.conversationId);
            if (pendingSubscriptionsRef.current.size === 0) {
              refreshUnreadCounts().catch((err) =>
                reportError(err, 'Unable to refresh unread messages.')
              );
            }
          } else if (data.type === 'subscription_error') {
            if (data.conversationId) {
              subscriptionsRef.current.delete(data.conversationId);
              pendingSubscriptionsRef.current.delete(data.conversationId);
              conversationIdsRef.current =
                conversationIdsRef.current.filter(
                  (id) => id !== data.conversationId
                );
            }
            reportError(
              new Error(data.error),
              'Unable to subscribe to a conversation.'
            );
            if (pendingSubscriptionsRef.current.size === 0) {
              refreshUnreadCounts().catch((err) =>
                reportError(err, 'Unable to refresh unread messages.')
              );
            }
          } else if (data.type === 'new_message') {
            const message = data.message;
            if (
              !message?.id ||
              !message.conversationId ||
              message.sender?.id === user.id ||
              seenMessagesRef.current.has(message.id)
            ) {
              return;
            }
            seenMessagesRef.current.add(message.id);
            if (seenMessagesRef.current.size > 500) {
              const oldestId = seenMessagesRef.current.values().next().value;
              seenMessagesRef.current.delete(oldestId);
            }

            const activeConversationId = getConversationId(
              pathnameRef.current
            );
            if (activeConversationId === message.conversationId) {
              scheduleMarkRead(message.conversationId);
              return;
            }

            setUnreadCount((count) => count + 1);
            setUnreadByConversation((counts) => ({
              ...counts,
              [message.conversationId]:
                (counts[message.conversationId] || 0) + 1,
            }));

            if (
              document.visibilityState === 'hidden' &&
              'Notification' in window &&
              window.Notification.permission === 'granted'
            ) {
              try {
                new window.Notification(
                  `${message.sender?.name || 'A friend'} sent you a message`,
                  {
                    body: 'Open Connectly to read it.',
                    tag: `connectly-${message.conversationId}`,
                  }
                );
              } catch (err) {
                reportError(err, 'Unable to show a desktop notification.');
              }
            } else {
              toast.custom(
                (toastItem) => (
                  <Link
                    href={`/messages/${message.conversationId}`}
                    onClick={() => toast.dismiss(toastItem.id)}
                    className="block max-w-sm rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-lg"
                  >
                    <p className="text-sm font-semibold text-[#0F172A]">
                      New message from {message.sender?.name || 'a friend'}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#64748B]">
                      {message.content}
                    </p>
                  </Link>
                ),
                { duration: 5000 }
              );
            }
          }
        };
        socket.onerror = () => socket.close();
        socket.onclose = () => {
          if (socketRef.current === socket) socketRef.current = null;
          subscriptionsRef.current.clear();
          pendingSubscriptionsRef.current.clear();
          scheduleReconnect();
        };
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          stopReconnect = true;
          reportError(err, 'Your session expired. Please sign in again.');
          return;
        }
        reportError(err, 'Live message notifications are reconnecting.');
        scheduleReconnect();
      }
    };

    const refreshVisiblePage = () => {
      if (document.visibilityState !== 'visible') return;
      refreshConnections().catch((err) =>
        reportError(err, 'Unable to refresh conversations.')
      );
      refreshUnreadCounts()
        .then(() => {
          const conversationId = getConversationId(pathnameRef.current);
          if (conversationId) {
            return markConversationRead(conversationId);
          }
          return undefined;
        })
        .catch((err) =>
          reportError(err, 'Unable to refresh unread messages.')
        );
    };

    connect();
    const refreshTimer = setInterval(() => {
      refreshConnections().catch((err) =>
        reportError(err, 'Unable to refresh conversations.')
      );
      refreshUnreadCounts().catch((err) =>
        reportError(err, 'Unable to refresh unread messages.')
      );
    }, 30000);
    document.addEventListener('visibilitychange', refreshVisiblePage);

    return () => {
      active = false;
      clearTimeout(retryTimer);
      clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', refreshVisiblePage);
      for (const timer of readTimersRef.current.values()) {
        clearTimeout(timer);
      }
      readTimersRef.current.clear();
      socketRef.current = null;
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [
    isAuthenticated,
    isAuthLoading,
    markConversationRead,
    refreshConnections,
    refreshUnreadCounts,
    reportError,
    scheduleMarkRead,
    subscribeToConversations,
    user?.id,
  ]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    const conversationId = getConversationId(pathname);
    if (!conversationId) return;
    markConversationRead(conversationId).catch((err) =>
      reportError(err, 'Unable to mark messages as read.')
    );
  }, [
    isAuthenticated,
    isAuthLoading,
    markConversationRead,
    pathname,
    reportError,
  ]);

  const contextValue = useMemo(
    () => ({
      unreadCount,
      unreadByConversation,
      refreshConnections,
      refreshUnreadCounts,
    }),
    [
      refreshConnections,
      refreshUnreadCounts,
      unreadByConversation,
      unreadCount,
    ]
  );

  return (
    <ChatNotificationsContext.Provider value={contextValue}>
      {children}
    </ChatNotificationsContext.Provider>
  );
}
