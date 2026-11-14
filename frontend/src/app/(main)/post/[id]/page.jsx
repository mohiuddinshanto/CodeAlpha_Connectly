'use client';

import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FeedSkeleton } from '../../../../components/FeedSkeleton';
import { PostCard } from '../../../../components/PostCard';
import { ApiError, postsApi } from '../../../../services/api';
import { useAuthStore } from '../../../../store/authStore';
import { usePostStore } from '../../../../store/postStore';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { isAuthenticated, openAuthModal, adjustCounts } = useAuthStore();
  const { fetchFeed } = usePostStore();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await postsApi.getById(postId);
      setPost(res.post);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not load this post.'
      );
      setPost(null);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleToggleLike = async (id) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!post) return;

    const nextLiked = !post.isLiked;
    const optimisticCount = Math.max(
      0,
      post.likesCount + (nextLiked ? 1 : -1)
    );
    setPost((prev) =>
      prev ? { ...prev, isLiked: nextLiked, likesCount: optimisticCount } : prev
    );

    try {
      const res = nextLiked
        ? await postsApi.like(id)
        : await postsApi.unlike(id);
      setPost((prev) =>
        prev
          ? { ...prev, isLiked: res.isLiked, likesCount: res.likesCount }
          : prev
      );
      fetchFeed();
    } catch (err) {
      setPost((prev) =>
        prev
          ? { ...prev, isLiked: post.isLiked, likesCount: post.likesCount }
          : prev
      );
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to update like.'
      );
    }
  };

  const handleUpdatePost = async (id, payload) => {
    try {
      const res = await postsApi.update(id, payload);
      setPost(res.post);
      fetchFeed();
      toast.success('Post updated');
      return true;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to update post.'
      );
      return false;
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await postsApi.remove(id);
      adjustCounts({ posts: -1 });
      fetchFeed();
      toast.success('Post deleted');
      router.push('/home');
      return true;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to delete post.'
      );
      return false;
    }
  };

  const handleCommentsCountChange = (_id, count) => {
    setPost((prev) => (prev ? { ...prev, commentsCount: count } : prev));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold text-[#0F172A]">
            Post Thread
          </h1>
          <p className="text-xs text-[#64748B]">
            Conversation and replies on Connectly
          </p>
        </div>
      </div>

      {isLoading ? (
        <FeedSkeleton count={1} />
      ) : error || !post ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
          <AlertCircle className="mx-auto h-7 w-7 text-[#EF4444]" />
          <p className="mt-2 text-sm font-semibold text-[#0F172A]">
            {error || 'Post not found.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={loadPost}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/home')}
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Back to Home
            </button>
          </div>
        </div>
      ) : (
        <PostCard
          post={post}
          onToggleLike={handleToggleLike}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
          onCommentsCountChange={handleCommentsCountChange}
          defaultCommentsOpen={true}
        />
      )}
    </div>
  );
}
