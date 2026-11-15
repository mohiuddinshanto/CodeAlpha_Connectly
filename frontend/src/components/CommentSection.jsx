'use client';

import { Loader2, Send, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, postsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime } from '../utils/formatters';
import { Avatar } from './Avatar';

function CommentItem({
  comment,
  user,
  deletingId,
  isReply = false,
  onDelete,
  onReply,
}) {
  const isOwner = user?.id === comment.author.id;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 ${
        isReply ? 'bg-white' : 'bg-[#F8FAFC]'
      }`}
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
            <span className="text-[#64748B]">@{comment.author.username}</span>
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
              onClick={() => onDelete(comment.id)}
              aria-label={`Delete comment "${comment.content.slice(0, 24)}"`}
              className="rounded-md p-1 text-[#94A3B8] transition-colors hover:bg-white hover:text-[#EF4444]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 break-words text-sm leading-relaxed text-[#0F172A]">
          {comment.content}
        </p>
        {!isReply && (
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="mt-1.5 text-xs font-semibold text-[#6366F1] hover:text-[#4F46E5]"
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

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
  const [replyText, setReplyText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setComments([]);
    setLoadedCount(0);
    setLocallyAddedIds(new Set());
    locallyAddedIdsRef.current = new Set();
    setHasMore(false);
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
      .catch((err) => {
        if (!cancelled) {
          setIsLoading(false);
          toast.error(
            err instanceof ApiError ? err.message : 'Unable to load comments.'
          );
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

  const submitComment = async (e, value, parentCommentId = null) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error('Please enter a comment before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await postsApi.addComment(
        postId,
        trimmed,
        parentCommentId
      );
      setComments((prev) =>
        [...prev, res.comment].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )
      );
      const nextLocalIds = new Set(locallyAddedIdsRef.current).add(res.comment.id);
      locallyAddedIdsRef.current = nextLocalIds;
      setLocallyAddedIds(nextLocalIds);
      setHasMore(res.commentsCount > loadedCount + nextLocalIds.size);
      if (parentCommentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setText('');
      }
      onCountChange(res.commentsCount);
      toast.success(parentCommentId ? 'Reply added' : 'Comment added');
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : parentCommentId
            ? 'Unable to post reply.'
            : 'Unable to post comment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = (e) => submitComment(e, text);

  const handleAddReply = (e) => {
    if (!replyingToId) {
      e.preventDefault();
      return;
    }
    return submitComment(e, replyText, replyingToId);
  };

  const handleStartReply = (comment) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setReplyText('');
    setReplyingToId((current) =>
      current === comment.id ? null : comment.id
    );
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingId(commentId);
    try {
      const res = await postsApi.deleteComment(commentId);
      const currentLocalIds = locallyAddedIdsRef.current;
      const removedLoadedCount = comments.some(
        (comment) =>
          comment.id === commentId && !currentLocalIds.has(comment.id)
      )
        ? 1
        : 0;
      setComments((prev) =>
        prev
          .filter((comment) => comment.id !== commentId)
          .map((comment) =>
            comment.parentCommentId === commentId
              ? { ...comment, parentCommentId: null }
              : comment
          )
      );
      const nextLocalIds = new Set(currentLocalIds);
      nextLocalIds.delete(commentId);
      locallyAddedIdsRef.current = nextLocalIds;
      setLocallyAddedIds(nextLocalIds);
      const nextLoadedCount = Math.max(0, loadedCount - removedLoadedCount);
      setLoadedCount(nextLoadedCount);
      setHasMore(res.commentsCount > nextLoadedCount + nextLocalIds.size);
      if (replyingToId === commentId) {
        setReplyingToId(null);
        setReplyText('');
      }
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

  const commentsById = new Map(comments.map((comment) => [comment.id, comment]));
  const repliesByParentId = new Map();
  for (const comment of comments) {
    if (comment.parentCommentId && commentsById.has(comment.parentCommentId)) {
      const replies = repliesByParentId.get(comment.parentCommentId) || [];
      replies.push(comment);
      repliesByParentId.set(comment.parentCommentId, replies);
    }
  }
  const topLevelComments = comments.filter(
    (comment) =>
      !comment.parentCommentId || !commentsById.has(comment.parentCommentId)
  );

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
          <span className="hidden sm:inline">Comment</span>
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
          {topLevelComments.map((comment) => {
            const replies = repliesByParentId.get(comment.id) || [];
            return (
              <li key={comment.id} className="space-y-2.5">
                <CommentItem
                  comment={comment}
                  user={user}
                  deletingId={deletingId}
                  isReply={Boolean(comment.parentCommentId)}
                  onDelete={handleDeleteComment}
                  onReply={handleStartReply}
                />
                {replies.length > 0 && (
                  <div className="ml-4 space-y-2 border-l-2 border-[#E2E8F0] pl-3 sm:ml-8">
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        user={user}
                        deletingId={deletingId}
                        isReply
                        onDelete={handleDeleteComment}
                      />
                    ))}
                  </div>
                )}
                {replyingToId === comment.id && !comment.parentCommentId && (
                  <form
                    onSubmit={handleAddReply}
                    className="ml-4 flex items-center gap-2 border-l-2 border-[#C7D2FE] pl-3 sm:ml-8"
                  >
                    <Avatar
                      src={user?.profilePicture}
                      name={user?.name || 'Guest'}
                      size="xs"
                    />
                    <label
                      htmlFor={`reply-input-${comment.id}`}
                      className="sr-only"
                    >
                      Reply to {comment.author.name}
                    </label>
                    <input
                      id={`reply-input-${comment.id}`}
                      type="text"
                      maxLength={500}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.author.name}...`}
                      className="min-w-0 flex-1 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToId(null);
                        setReplyText('');
                      }}
                      aria-label="Cancel reply"
                      className="rounded-lg p-2 text-[#64748B] hover:bg-[#F8FAFC]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-label="Submit reply"
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#6366F1] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">Reply</span>
                    </button>
                  </form>
                )}
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
