'use client';

import { Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, postsApi } from '../services/api';
import { Avatar } from './Avatar';

export function LikeListModal({ postId, onClose }) {
  const [likers, setLikers] = useState([]);
  const [total, setTotal] = useState(0);
  const [nextSkip, setNextSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLikers([]);
    setTotal(0);
    setNextSkip(0);
    setHasMore(false);
    setIsLoading(true);
    setLoadError('');
    postsApi
      .getLikes(postId, 50, 0)
      .then((res) => {
        if (cancelled) return;
        setLikers(res.likers);
        setTotal(res.total);
        setNextSkip(res.nextSkip);
        setHasMore(res.hasMore);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.message : 'Unable to load likes.';
        setLoadError(message);
        setIsLoading(false);
        toast.error(message);
      });

    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const res = await postsApi.getLikes(postId, 50, nextSkip);
      setLikers((prev) => {
        const merged = new Map(prev.map((liker) => [liker.id, liker]));
        for (const liker of res.likers) merged.set(liker.id, liker);
        return [...merged.values()];
      });
      setTotal(res.total);
      setNextSkip(res.nextSkip);
      setHasMore(res.hasMore);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to load more likes.'
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`likes-dialog-title-${postId}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[min(80vh,36rem)] w-full max-w-sm flex-col rounded-2xl border border-[#E2E8F0] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <h2
            id={`likes-dialog-title-${postId}`}
            className="font-display text-base font-semibold text-[#0F172A]"
          >
            Likes{!isLoading && ` (${total})`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close likes"
            className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-24 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#6366F1]" />
            </div>
          ) : loadError ? (
            <p className="py-6 text-center text-sm text-[#64748B]">
              {loadError}
            </p>
          ) : likers.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#64748B]">
              No likes yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {likers.map((liker) => (
                <li key={liker.id}>
                  <Link
                    href={`/profile/${liker.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-[#F8FAFC]"
                  >
                    <Avatar
                      src={liker.profilePicture}
                      name={liker.name}
                      size="sm"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#0F172A]">
                        {liker.name}
                      </span>
                      <span className="block truncate text-xs text-[#64748B]">
                        @{liker.username}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasMore && !loadError && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="border-t border-[#E2E8F0] px-4 py-3 text-xs font-semibold text-[#4F46E5] hover:bg-[#F8FAFC] disabled:opacity-60"
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
