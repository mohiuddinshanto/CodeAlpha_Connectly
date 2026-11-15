'use client';

import { BellRing, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, friendsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';
import { useChatNotifications } from './ChatNotifications';
import { UnreadCountBadge } from './UnreadCountBadge';

export function MessagesView() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { unreadByConversation } = useChatNotifications();
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(null);

  const loadFriends = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const result = await friendsApi.getAll();
      setFriends(result.friends || []);
    } catch (err) {
      setLoadError(true);
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to load conversations.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) loadFriends();
  }, [isAuthenticated, isAuthLoading, loadFriends]);

  useEffect(() => {
    setNotificationPermission(
      'Notification' in window ? window.Notification.permission : 'unsupported'
    );
  }, []);

  const enableDesktopNotifications = async () => {
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Desktop message alerts enabled.');
      } else {
        toast.error('Desktop notifications were not enabled.');
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Unable to enable desktop notifications.'
      );
    }
  };

  if (isAuthLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="font-display text-xl font-bold text-[#0F172A]">
          Sign in to view messages
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          You can chat privately with people after they accept your friend
          request.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F46E5]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">
            Messages
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Private conversations with your friends.
          </p>
        </div>
        {notificationPermission === 'default' && (
          <button
            type="button"
            onClick={enableDesktopNotifications}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
          >
            <BellRing className="h-3.5 w-3.5" />
            Enable desktop alerts
          </button>
        )}
        {notificationPermission === 'granted' && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-2 text-xs font-semibold text-[#15803D]">
            <BellRing className="h-3.5 w-3.5" />
            Desktop alerts on
          </span>
        )}
        {notificationPermission === 'denied' && (
          <span className="text-xs text-[#64748B]">
            Desktop alerts are blocked in browser settings.
          </span>
        )}
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
          <p className="text-sm text-[#64748B]">
            Your conversations could not be loaded.
          </p>
          <button
            type="button"
            onClick={loadFriends}
            className="mt-3 text-sm font-semibold text-[#4F46E5] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : friends.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
          <MessageSquare className="mx-auto h-7 w-7 text-[#94A3B8]" />
          <p className="mt-3 text-sm font-medium text-[#0F172A]">
            No conversations yet.
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            Send a friend request and start chatting after it is accepted.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-flex text-sm font-semibold text-[#4F46E5] hover:underline"
          >
            Find people
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[#E2E8F0] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
          {friends.map((friendship) => {
            const unreadCount =
              unreadByConversation[friendship.conversationId] ??
              friendship.unreadCount ??
              0;

            return (
              <li key={friendship.conversationId}>
                <Link
                  href={`/messages/${friendship.conversationId}`}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[#F8FAFC]"
                >
                  <Avatar
                    src={friendship.user.profilePicture}
                    name={friendship.user.name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {friendship.user.name}
                    </p>
                    <p className="truncate text-xs text-[#64748B]">
                      @{friendship.user.username}
                    </p>
                  </div>
                  {unreadCount > 0 ? (
                    <UnreadCountBadge
                      count={unreadCount}
                      className="ml-auto min-w-6 px-2 py-1 text-xs"
                    />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-[#6366F1]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
