'use client';

import { Check, Loader2, MessageSquare, UserPlus, UserX } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, friendsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export function FriendRequestButton({ targetUserId }) {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    openAuthModal,
  } = useAuthStore();
  const [relationship, setRelationship] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadStatus = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const result = await friendsApi.getStatus(targetUserId);
      setRelationship(result);
    } catch (err) {
      setLoadError(true);
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Unable to load friend status.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (isAuthLoading) return () => {
      cancelled = true;
    };
    if (!isAuthenticated) {
      setRelationship({ status: 'not_friends' });
      setIsLoading(false);
      setLoadError(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setLoadError(false);
    friendsApi
      .getStatus(targetUserId)
      .then((result) => {
        if (!cancelled) setRelationship(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(true);
          toast.error(
            err instanceof ApiError
              ? err.message
              : 'Unable to load friend status.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAuthLoading, targetUserId]);

  const runAction = async (action) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isBusy || !relationship) return;

    setIsBusy(true);
    try {
      if (action === 'send') {
        setRelationship(await friendsApi.sendRequest(targetUserId));
        toast.success('Friend request sent');
      } else if (action === 'accept') {
        const result = await friendsApi.acceptRequest(relationship.requestId);
        setRelationship(result);
        toast.success('Friend request accepted');
      } else if (action === 'remove') {
        await friendsApi.removeRequest(relationship.requestId);
        setRelationship({ status: 'not_friends' });
        toast.success('Friend request removed');
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to update friendship.'
      );
      await loadStatus();
    } finally {
      setIsBusy(false);
    }
  };

  if (isAuthLoading || isLoading || isBusy) {
    return (
      <button
        type="button"
        disabled
        className={`${buttonClass} border border-[#E2E8F0] bg-white text-[#64748B]`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{isBusy ? 'Updating...' : 'Loading...'}</span>
      </button>
    );
  }

  if (loadError) {
    return (
      <button
        type="button"
        onClick={loadStatus}
        className={`${buttonClass} border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]`}
      >
        Retry
      </button>
    );
  }

  if (relationship?.status === 'friends') {
    return (
      <Link
        href={`/messages/${relationship.conversationId}`}
        className={`${buttonClass} bg-[#6366F1] text-white hover:bg-[#4F46E5]`}
      >
        <MessageSquare className="h-4 w-4" />
        <span>Message</span>
      </Link>
    );
  }

  if (relationship?.status === 'pending_received') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => runAction('accept')}
          className={`${buttonClass} bg-[#6366F1] text-white hover:bg-[#4F46E5]`}
        >
          <Check className="h-4 w-4" />
          <span>Accept request</span>
        </button>
        <button
          type="button"
          onClick={() => runAction('remove')}
          className={`${buttonClass} border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#EF4444]`}
        >
          <UserX className="h-4 w-4" />
          <span>Decline</span>
        </button>
      </div>
    );
  }

  if (relationship?.status === 'pending_sent') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className={`${buttonClass} border border-[#E2E8F0] bg-white text-[#64748B]`}
        >
          Request sent
        </button>
        <button
          type="button"
          onClick={() => runAction('remove')}
          className={`${buttonClass} border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#EF4444]`}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => runAction('send')}
      className={`${buttonClass} bg-[#6366F1] text-white hover:bg-[#4F46E5]`}
    >
      <UserPlus className="h-4 w-4" />
      <span>Add friend</span>
    </button>
  );
}
