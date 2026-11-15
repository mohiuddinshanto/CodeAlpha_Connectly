'use client';

import { Check, Loader2, MessageSquare, UserPlus, UserX } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, friendsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';
import { useChatNotifications } from './ChatNotifications';

function PersonLink({ user }) {
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex min-w-0 flex-1 items-center gap-3"
    >
      <Avatar src={user.profilePicture} name={user.name} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#0F172A] hover:underline">
          {user.name}
        </p>
        <p className="truncate text-xs text-[#64748B]">@{user.username}</p>
      </div>
    </Link>
  );
}

export function FriendsView() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { refreshConnections } = useChatNotifications();
  const [tab, setTab] = useState('incoming');
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [requestsResult, friendsResult] = await Promise.all([
        friendsApi.getRequests(),
        friendsApi.getAll(),
      ]);
      setIncoming(requestsResult.incoming || []);
      setOutgoing(requestsResult.outgoing || []);
      setFriends(friendsResult.friends || []);
    } catch (err) {
      setLoadError(true);
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to load friends.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) loadData();
  }, [isAuthenticated, isAuthLoading, loadData]);

  const updateRequest = async (action, requestId) => {
    setIsBusy(true);
    try {
      if (action === 'accept') {
        await friendsApi.acceptRequest(requestId);
        refreshConnections().catch((err) =>
          toast.error(
            err instanceof ApiError
              ? err.message
              : 'Unable to refresh message notifications.'
          )
        );
        toast.success('Friend request accepted');
      } else {
        await friendsApi.removeRequest(requestId);
        toast.success(action === 'decline' ? 'Request declined' : 'Request canceled');
      }
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to update request.'
      );
    } finally {
      setIsBusy(false);
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
          Sign in to manage friends
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Friend requests and conversations are available to Connectly members.
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

  const rows =
    tab === 'incoming'
      ? incoming.map((request) => ({ ...request, kind: 'incoming' }))
      : tab === 'sent'
        ? outgoing.map((request) => ({ ...request, kind: 'sent' }))
        : friends.map((friendship) => ({
            id: friendship.conversationId,
            conversationId: friendship.conversationId,
            user: friendship.user,
            kind: 'friend',
          }));

  return (
    <section className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
          Friends
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Accept a request to start a private conversation.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Friend lists"
        className="flex rounded-xl border border-[#E2E8F0] bg-white p-1"
      >
        {[
          { key: 'incoming', label: `Requests${incoming.length ? ` (${incoming.length})` : ''}` },
          { key: 'sent', label: 'Sent' },
          { key: 'friends', label: `Friends${friends.length ? ` (${friends.length})` : ''}` },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              tab === item.key
                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
          <p className="text-sm text-[#64748B]">Friends could not be loaded.</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-3 text-sm font-semibold text-[#4F46E5] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
          <UserPlus className="mx-auto h-7 w-7 text-[#94A3B8]" />
          <p className="mt-3 text-sm font-medium text-[#0F172A]">
            {tab === 'incoming'
              ? 'No friend requests yet.'
              : tab === 'sent'
                ? 'You have no outgoing requests.'
                : 'You have no friends yet.'}
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            Visit a profile and send a friend request to connect.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-flex text-sm font-semibold text-[#4F46E5] hover:underline"
          >
            Explore people
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[#E2E8F0] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
            >
              <PersonLink user={row.user} />
              {row.kind === 'incoming' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => updateRequest('accept', row.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => updateRequest('decline', row.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#64748B] hover:text-[#EF4444] disabled:opacity-60"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Decline
                  </button>
                </div>
              )}
              {row.kind === 'sent' && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => updateRequest('cancel', row.id)}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#64748B] hover:text-[#EF4444] disabled:opacity-60"
                >
                  Cancel request
                </button>
              )}
              {row.kind === 'friend' && (
                <Link
                  href={`/messages/${row.conversationId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
