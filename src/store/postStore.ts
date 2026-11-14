import toast from 'react-hot-toast';
import { create } from 'zustand';
import { ApiError, postsApi } from '../services/api';
import type { FeedTab, PostItem } from '../types';
import { useAuthStore } from './authStore';

const PAGE_SIZE = 5;

interface PostState {
  posts: PostItem[];
  activeFeedTab: FeedTab;
  topicFilter: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  total: number;
  error: string | null;
  fetchFeed: (tab?: FeedTab, topic?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (payload: {
    content: string;
    image?: string;
  }) => Promise<PostItem | null>;
  updatePost: (
    postId: string,
    payload: { content: string; image?: string }
  ) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  toggleLike: (postId: string) => Promise<void>;
  setCommentsCount: (postId: string, count: number) => void;
  setTopicFilter: (topic: string) => Promise<void>;
  syncAuthorProfile: (
    userId: string,
    updates: { name: string; profilePicture: string }
  ) => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  activeFeedTab: 'home',
  topicFilter: '',
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  total: 0,
  error: null,

  fetchFeed: async (tab, topic) => {
    const nextTab = tab ?? get().activeFeedTab;
    const nextTopic = topic !== undefined ? topic : get().topicFilter;

    set({
      activeFeedTab: nextTab,
      topicFilter: nextTopic,
      isLoading: true,
      error: null,
    });

    try {
      const res =
        nextTab === 'following'
          ? await postsApi.listFollowing(PAGE_SIZE, 0)
          : await postsApi.listAll(PAGE_SIZE, 0, nextTopic);

      set({
        posts: res.posts,
        total: res.total,
        hasMore: res.hasMore,
        isLoading: false,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to load feed. Please try again.';
      set({ error: message, isLoading: false, posts: [] });
    }
  },

  loadMore: async () => {
    const { isLoadingMore, hasMore, posts, activeFeedTab, topicFilter } = get();
    if (isLoadingMore || !hasMore) return;

    set({ isLoadingMore: true });
    try {
      const skip = posts.length;
      const res =
        activeFeedTab === 'following'
          ? await postsApi.listFollowing(PAGE_SIZE, skip)
          : await postsApi.listAll(PAGE_SIZE, skip, topicFilter);

      set({
        posts: [...posts, ...res.posts],
        total: res.total,
        hasMore: res.hasMore,
        isLoadingMore: false,
      });
    } catch (err) {
      set({ isLoadingMore: false });
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to load more posts.'
      );
    }
  },

  createPost: async (payload) => {
    try {
      const res = await postsApi.create(payload);
      set((state) => ({
        posts: [res.post, ...state.posts],
        total: state.total + 1,
      }));
      useAuthStore.getState().adjustCounts({ posts: 1 });
      toast.success('Post published');
      return res.post;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to publish post.'
      );
      return null;
    }
  },

  updatePost: async (postId, payload) => {
    try {
      const res = await postsApi.update(postId, payload);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? res.post : p)),
      }));
      toast.success('Post updated');
      return true;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to update post.'
      );
      return false;
    }
  },

  deletePost: async (postId) => {
    const prevPosts = get().posts;
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
      total: Math.max(0, state.total - 1),
    }));
    try {
      await postsApi.remove(postId);
      useAuthStore.getState().adjustCounts({ posts: -1 });
      toast.success('Post deleted');
      return true;
    } catch (err) {
      set({ posts: prevPosts });
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to delete post.'
      );
      return false;
    }
  },

  toggleLike: async (postId) => {
    const prevPosts = get().posts;
    const target = prevPosts.find((p) => p.id === postId);
    if (!target) return;

    const nextLiked = !target.isLiked;
    const nextCount = Math.max(0, target.likesCount + (nextLiked ? 1 : -1));

    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: nextLiked, likesCount: nextCount }
          : p
      ),
    }));

    try {
      const res = nextLiked
        ? await postsApi.like(postId)
        : await postsApi.unlike(postId);

      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: res.isLiked, likesCount: res.likesCount }
            : p
        ),
      }));
    } catch (err) {
      set({ posts: prevPosts });
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to update like.'
      );
    }
  },

  setCommentsCount: (postId, count) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, commentsCount: count } : p
      ),
    }));
  },

  setTopicFilter: async (topic) => {
    const current = get().topicFilter;
    const nextTopic = current === topic ? '' : topic;
    await get().fetchFeed('explore', nextTopic);
  },

  syncAuthorProfile: (userId, updates) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.author.id === userId
          ? {
              ...p,
              author: {
                ...p.author,
                name: updates.name,
                profilePicture: updates.profilePicture,
              },
            }
          : p
      ),
    }));
  },
}));
