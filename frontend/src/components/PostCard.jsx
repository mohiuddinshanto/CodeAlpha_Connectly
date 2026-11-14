'use client';

import {
  Check,
  Heart,
  ImageOff,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime } from '../utils/formatters';
import { Avatar } from './Avatar';
import { CommentSection } from './CommentSection';
import { ConfirmDialog } from './ConfirmDialog';

export function PostCard({
  post,
  onToggleLike,
  onUpdatePost,
  onDeletePost,
  onCommentsCountChange,
  defaultCommentsOpen = false,
}) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const isOwner = Boolean(user && user.id === post.author.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [post.image]);

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    onToggleLike(post.id);
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed && !post.image) {
      toast.error('Post content cannot be empty.');
      return;
    }
    setIsSavingEdit(true);
    const ok = await onUpdatePost(post.id, {
      content: trimmed,
      image: post.image,
    });
    setIsSavingEdit(false);
    if (ok) {
      setIsEditing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDeletePost(post.id);
    setIsDeleting(false);
    setConfirmDeleteOpen(false);
  };

  return (
    <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 transition-colors hover:border-[#CBD5E1]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/profile/${post.author.id}`}
            aria-label={`View ${post.author.name}'s profile`}
            className="shrink-0 rounded-full"
          >
            <Avatar
              src={post.author.profilePicture}
              name={post.author.name}
              size="md"
            />
          </Link>
          <div className="min-w-0">
            <Link
              href={`/profile/${post.author.id}`}
              className="block truncate text-left text-sm font-semibold text-[#0F172A] hover:underline"
            >
              {post.author.name}
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <span className="truncate">@{post.author.username}</span>
              <span aria-hidden="true">·</span>
              <Link
                href={`/post/${post.id}`}
                className="shrink-0 tabular-nums hover:text-[#0F172A] hover:underline"
              >
                <time dateTime={post.createdAt}>
                  {formatRelativeTime(post.createdAt)}
                </time>
              </Link>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={`More options for post by ${post.author.name}`}
              aria-expanded={menuOpen}
              className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-md"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setEditContent(post.content);
                    setIsEditing(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  <Pencil className="h-3.5 w-3.5 text-[#64748B]" />
                  <span>Edit Post</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDeleteOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#EF4444] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-3">
          <label htmlFor={`edit-post-${post.id}`} className="sr-only">
            Edit post content
          </label>
          <textarea
            id={`edit-post-${post.id}`}
            rows={3}
            maxLength={1000}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-sm text-[#0F172A] focus:border-[#6366F1] focus:bg-white focus:outline-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              disabled={isSavingEdit}
              onClick={handleSaveEdit}
              className="inline-flex items-center gap-1 rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSavingEdit ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      ) : (
        post.content && (
          <p className="mt-3.5 whitespace-pre-wrap text-[15px] leading-relaxed text-[#0F172A] break-words">
            {post.content}
          </p>
        )
      )}

      {post.image && (
        <div className="mt-3.5 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
          {imageError ? (
            <div className="flex h-44 items-center justify-center gap-2 text-xs text-[#64748B]">
              <ImageOff className="h-4 w-4" />
              <span>Image unavailable</span>
            </div>
          ) : (
            <img
              src={post.image}
              alt={`Attachment by ${post.author.name}`}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="max-h-[420px] w-full object-cover"
            />
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-[#F1F5F9] pt-3">
        <button
          type="button"
          onClick={handleLikeClick}
          aria-pressed={post.isLiked}
          aria-label={
            post.isLiked
              ? `Unlike post by ${post.author.name} (${post.likesCount} ${post.likesCount === 1 ? 'like' : 'likes'})`
              : `Like post by ${post.author.name} (${post.likesCount} ${post.likesCount === 1 ? 'like' : 'likes'})`
          }
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            post.isLiked
              ? 'bg-[#EEF2FF] text-[#6366F1]'
              : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
          }`}
        >
          <Heart
            className={`h-4 w-4 ${post.isLiked ? 'fill-[#6366F1]' : ''}`}
          />
          <span className="tabular-nums">{post.likesCount}</span>
          <span>{post.likesCount === 1 ? 'Like' : 'Likes'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          aria-label={`Toggle comments for post by ${post.author.name} (${post.commentsCount} ${post.commentsCount === 1 ? 'comment' : 'comments'})`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            commentsOpen
              ? 'bg-[#F8FAFC] text-[#0F172A]'
              : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{post.commentsCount}</span>
          <span>{post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
        </button>

        <Link
          href={`/post/${post.id}`}
          className="ml-auto text-xs font-medium text-[#64748B] transition-colors hover:text-[#6366F1]"
        >
          View thread
        </Link>
      </div>

      {commentsOpen && (
        <CommentSection
          postId={post.id}
          onCountChange={(count) => onCommentsCountChange(post.id, count)}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this post?"
        description="This action permanently removes your post and its comments from Connectly."
        confirmLabel="Delete Post"
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </article>
  );
}
