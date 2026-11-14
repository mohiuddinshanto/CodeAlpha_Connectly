import { Loader2, Send, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { ApiError, postsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { CommentItem } from '../types';
import { formatRelativeTime } from '../utils/formatters';
import { Avatar } from './Avatar';

interface CommentSectionProps {
  postId: string;
  onCountChange: (count: number) => void;
  onNavigateProfile: (userId: string) => void;
}

export function CommentSection({
  postId,
  onCountChange,
  onNavigateProfile,
}: CommentSectionProps) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    postsApi
      .getComments(postId)
      .then((res) => {
        if (!cancelled) {
          setComments(res.comments);
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

  const handleAddComment = async (e: FormEvent) => {
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
      setComments((prev) => [...prev, res.comment]);
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

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const res = await postsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
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
                <button
                  type="button"
                  onClick={() => onNavigateProfile(comment.author.id)}
                  aria-label={`View ${comment.author.name}'s profile`}
                  className="mt-0.5 rounded-full"
                >
                  <Avatar
                    src={comment.author.profilePicture}
                    name={comment.author.name}
                    size="xs"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => onNavigateProfile(comment.author.id)}
                        className="font-semibold text-[#0F172A] hover:underline"
                      >
                        {comment.author.name}
                      </button>
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
                        onClick={() => void handleDeleteComment(comment.id)}
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
    </div>
  );
}
