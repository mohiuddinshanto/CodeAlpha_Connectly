'use client';

import { Loader2, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, postsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime } from '../utils/formatters';
import { Avatar } from './Avatar';

export function CommentSection({ postId, onCountChange }) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [locallyAddedIds, setLocallyAddedIds] = useState(() => new Set());
  const locallyAddedIdsRef = useRef(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    postsApi
      .getComments(postId, 50, 0)
      .then((res) => {
        if (!cancelled) {
          setComments((prev) => {
            const merged = new Map(prev.map((comment) => [comment.id, comment]));
            for (const comment of res.comments) merged.set(comment.id, comment);
            return [...merged.values()].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          });
          setLoadedCount(res.comments.length);
          const remainingLocalIds = new Set(locallyAddedIdsRef.current);
          for (const comment of res.comments) remainingLocalIds.delete(comment.id);
          locallyAddedIdsRef.current = remainingLocalIds;
          setLocallyAddedIds(remainingLocalIds);
          setHasMore(res.total > res.comments.length + remainingLocalIds.size);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const res = await postsApi.getComments(postId, 50, loadedCount);
      setComments((prev) => {
        const merged = new Map(prev.map((comment) => [comment.id, comment]));
        for (const comment of res.comments) merged.set(comment.id, comment);
        return [...merged.values()].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
      const nextLoadedCount = loadedCount + res.comments.length;
      setLoadedCount(nextLoadedCount);
      const nextLocalIds = new Set(locallyAddedIdsRef.current);
      for (const comment of res.comments) nextLocalIds.delete(comment.id);
      locallyAddedIdsRef.current = nextLocalIds;
      setLocallyAddedIds(nextLocalIds);
      setHasMore(res.total > nextLoadedCount + nextLocalIds.size);
    } catch {
      toast.error('Unable to load more comments.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error('Please enter a comment before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await postsApi.addComment(postId, trimmed);
      setComments((prev) =>
        [...prev, res.comment].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )
      );
      const nextLocalIds = new Set(locallyAddedIdsRef.current).add(res.comment.id);
      locallyAddedIdsRef.current = nextLocalIds;
      setLocallyAddedIds(nextLocalIds);
      setHasMore(res.commentsCount > loadedCount + nextLocalIds.size);
      setText('');
      onCountChange(res.commentsCount);
      toast.success('Comment added');
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to post comment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingId(commentId);
    try {
      const res = await postsApi.deleteComment(commentId);
      const wasLocallyAdded = locallyAddedIdsRef.current.has(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      const nextLocalIds = new Set(locallyAddedIdsRef.current);
      nextLocalIds.delete(commentId);
      locallyAddedIdsRef.current = nextLocalIds;
      setLocallyAddedIds(nextLocalIds);
      if (!wasLocallyAdded) setLoadedCount((prev) => Math.max(0, prev - 1));
      const nextLoadedCount = Math.max(
        0,
        loadedCount - (wasLocallyAdded ? 0 : 1)
      );
      setHasMore(res.commentsCount > nextLoadedCount + nextLocalIds.size);
      onCountChange(res.commentsCount);
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to delete comment.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-4 border-t border-[#E2E8F0] pt-4">
      <form onSubmit={handleAddComment} className="flex items-center gap-2.5">
        <Avatar
          src={user?.profilePicture}
          name={user?.name || 'Guest'}
          size="xs"
        />
        <label htmlFor={`comment-input-${postId}`} className="sr-only">
          Write a comment
        </label>
        <input
          id={`comment-input-${postId}`}
          type="text"
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isAuthenticated
              ? 'Write a thoughtful comment...'
              : 'Sign in to join the conversation...'
          }
          className="min-w-0 flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Submit comment"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#6366F1] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Reply</span>
        </button>
      </form>

      {isLoading ? (
        <div className="mt-4 space-y-2.5">
          <div className="h-10 animate-pulse rounded-xl bg-[#F8FAFC]" />
          <div className="h-10 animate-pulse rounded-xl bg-[#F8FAFC]" />
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-center text-xs text-[#64748B]">
          No comments yet. Start the discussion above.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {comments.map((comment) => {
            const isOwner = user?.id === comment.author.id;
            return (
              <li
                key={comment.id}
                className="flex items-start gap-2.5 rounded-xl bg-[#F8FAFC] px-3.5 py-2.5"
              >
                <Link
                  href={`/profile/${comment.author.id}`}
                  aria-label={`View ${comment.author.name}'s profile`}
                  className="mt-0.5 rounded-full"
                >
                  <Avatar
                    src={comment.author.profilePicture}
                    name={comment.author.name}
                    size="xs"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <Link
                        href={`/profile/${comment.author.id}`}
                        className="font-semibold text-[#0F172A] hover:underline"
                      >
                        {comment.author.name}
                      </Link>
                      <span className="text-[#64748B]">
                        @{comment.author.username}
                      </span>
                      <span aria-hidden="true" className="text-[#94A3B8]">
                        ·
                      </span>
                      <span className="text-[#64748B] tabular-nums">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    {isOwner && (
                      <button
                        type="button"
                        disabled={deletingId === comment.id}
                        onClick={() => handleDeleteComment(comment.id)}
                        aria-label={`Delete comment "${comment.content.slice(0, 24)}"`}
                        className="rounded-md p-1 text-[#94A3B8] transition-colors hover:bg-white hover:text-[#EF4444]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#0F172A] break-words">
                    {comment.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {hasMore && !isLoading && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="mt-3 w-full rounded-lg py-2 text-xs font-semibold text-[#4F46E5] hover:bg-[#EEF2FF] disabled:opacity-60"
        >
          {isLoadingMore ? 'Loading...' : 'Load more comments'}
        </button>
      )}
    </div>
  );
}
