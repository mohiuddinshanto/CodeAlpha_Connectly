import toast from 'react-hot-toast';
import { create } from 'zustand';
import { ApiError, usersApi } from '../services/api';
import type { PostItem, UserProfile } from '../types';
import { useAuthStore } from './authStore';

interface UserState {
  suggestedUsers: UserProfile[];
  searchResults: UserProfile[];
  isSearching: boolean;
  activeProfile: UserProfile | null;
  profilePosts: PostItem[];
  followers: UserProfile[];
  following: UserProfile[];
  isLoadingProfile: boolean;
  profileError: string | null;
  fetchSuggestedUsers: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  fetchUserProfile: (userId: string) => Promise<void>;
  fetchFollowersAndFollowing: (userId: string) => Promise<void>;
  updateOwnProfile: (payload: {
    name?: string;
    bio?: string;
    profilePicture?: string;
  }) => Promise<UserProfile | null>;
  toggleFollow: (targetUserId: string) => Promise<boolean>;
  removeProfilePost: (postId: string) => void;
  updateProfilePost: (post: PostItem) => void;
  toggleProfilePostLike: (
    postId: string,
    isLiked: boolean,
    likesCount: number
  ) => void;
  setProfilePostCommentsCount: (postId: string, count: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  suggestedUsers: [],
  searchResults: [],
  isSearching: false,
  activeProfile: null,
  profilePosts: [],
  followers: [],
  following: [],
  isLoadingProfile: false,
  profileError: null,

  fetchSuggestedUsers: async () => {
    try {
      const res = await usersApi.listSuggested(6);
      set({ suggestedUsers: res.users });
    } catch {
      // Keep quiet on non-critical sidebar fetch failure
    }
  },

  searchUsers: async (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await usersApi.search(trimmed);
      set({ searchResults: res.users, isSearching: false });
    } catch {
      set({ isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [], isSearching: false }),

  fetchUserProfile: async (userId) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const [profileRes, postsRes, followersRes, followingRes] =
        await Promise.all([
          usersApi.getProfile(userId),
          usersApi.getUserPosts(userId, 30, 0),
          usersApi.getFollowers(userId),
          usersApi.getFollowing(userId),
        ]);

      set({
        activeProfile: profileRes.user,
        profilePosts: postsRes.posts,
        followers: followersRes.users,
        following: followingRes.users,
        isLoadingProfile: false,
      });
    } catch (err) {
      set({
        profileError:
          err instanceof ApiError ? err.message : 'Unable to load profile.',
        isLoadingProfile: false,
      });
    }
  },

  fetchFollowersAndFollowing: async (userId) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        usersApi.getFollowers(userId),
        usersApi.getFollowing(userId),
      ]);
      set({
        followers: followersRes.users,
        following: followingRes.users,
      });
    } catch {
      // ignore
    }
  },

  updateOwnProfile: async (payload) => {
    try {
      const res = await usersApi.updateProfile(payload);
      set((state) => ({
        activeProfile:
          state.activeProfile?.id === res.user.id
            ? res.user
            : state.activeProfile,
        profilePosts: state.profilePosts.map((p) =>
          p.author.id === res.user.id
            ? {
                ...p,
                author: {
                  ...p.author,
                  name: res.user.name,
                  profilePicture: res.user.profilePicture,
                },
              }
            : p
        ),
      }));
      toast.success('Profile updated');
      return res.user;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to update profile.'
      );
      return null;
    }
  },

  toggleFollow: async (targetUserId) => {
    const prevSuggested = get().suggestedUsers;
    const prevSearch = get().searchResults;
    const prevProfile = get().activeProfile;
    const prevFollowers = get().followers;
    const prevFollowing = get().following;

    const existing =
      prevSuggested.find((u) => u.id === targetUserId) ||
      prevSearch.find((u) => u.id === targetUserId) ||
      (prevProfile?.id === targetUserId ? prevProfile : null) ||
      prevFollowers.find((u) => u.id === targetUserId) ||
      prevFollowing.find((u) => u.id === targetUserId);

    const currentlyFollowing = existing ? existing.isFollowing : false;
    const nextFollowing = !currentlyFollowing;

    const patchList = (list: UserProfile[]) =>
      list.map((u) =>
        u.id === targetUserId
          ? {
              ...u,
              isFollowing: nextFollowing,
              followersCount: Math.max(
                0,
                u.followersCount + (nextFollowing ? 1 : -1)
              ),
            }
          : u
      );

    set({
      suggestedUsers: patchList(prevSuggested),
      searchResults: patchList(prevSearch),
      followers: patchList(prevFollowers),
      following: patchList(prevFollowing),
      activeProfile:
        prevProfile && prevProfile.id === targetUserId
          ? {
              ...prevProfile,
              isFollowing: nextFollowing,
              followersCount: Math.max(
                0,
                prevProfile.followersCount + (nextFollowing ? 1 : -1)
              ),
            }
          : prevProfile,
    });

    try {
      const res = nextFollowing
        ? await usersApi.follow(targetUserId)
        : await usersApi.unfollow(targetUserId);

      const syncCount = (list: UserProfile[]) =>
        list.map((u) =>
          u.id === targetUserId
            ? {
                ...u,
                isFollowing: res.following,
                followersCount: res.followersCount,
              }
            : u
        );

      set((state) => ({
        suggestedUsers: syncCount(state.suggestedUsers),
        searchResults: syncCount(state.searchResults),
        followers: syncCount(state.followers),
        following: syncCount(state.following),
        activeProfile:
          state.activeProfile?.id === targetUserId
            ? {
                ...state.activeProfile,
                isFollowing: res.following,
                followersCount: res.followersCount,
              }
            : state.activeProfile,
      }));
      useAuthStore
        .getState()
        .adjustCounts({ following: res.following ? 1 : -1 });
      return true;
    } catch (err) {
      set({
        suggestedUsers: prevSuggested,
        searchResults: prevSearch,
        activeProfile: prevProfile,
        followers: prevFollowers,
        following: prevFollowing,
      });
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Unable to update follow status.'
      );
      return false;
    }
  },

  removeProfilePost: (postId) => {
    set((state) => ({
      profilePosts: state.profilePosts.filter((p) => p.id !== postId),
      activeProfile: state.activeProfile
        ? {
            ...state.activeProfile,
            postsCount: Math.max(0, state.activeProfile.postsCount - 1),
          }
        : null,
    }));
  },

  updateProfilePost: (post) => {
    set((state) => ({
      profilePosts: state.profilePosts.map((p) =>
        p.id === post.id ? post : p
      ),
    }));
  },

  toggleProfilePostLike: (postId, isLiked, likesCount) => {
    set((state) => ({
      profilePosts: state.profilePosts.map((p) =>
        p.id === postId ? { ...p, isLiked, likesCount } : p
      ),
    }));
  },

  setProfilePostCommentsCount: (postId, count) => {
    set((state) => ({
      profilePosts: state.profilePosts.map((p) =>
        p.id === postId ? { ...p, commentsCount: count } : p
      ),
    }));
  },
}));
