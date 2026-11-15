'use client';

import {
  ArrowLeft,
  Calendar,
  Camera,
  Loader2,
  Pencil,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError, postsApi, usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { useUserStore } from '../store/userStore';
import { formatJoinedDate } from '../utils/formatters';
import { validateImageUploadInput } from '../utils/validation';
import { Avatar } from './Avatar';
import { FeedSkeleton } from './FeedSkeleton';
import { FriendRequestButton } from './FriendRequestButton';
import { PostCard } from './PostCard';

export function ProfileView({ userId }) {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, setUser, openAuthModal } =
    useAuthStore();
  const { syncAuthorProfile, fetchFeed } = usePostStore();
  const {
    activeProfile,
    profilePosts,
    followers,
    following,
    followersHasMore,
    followingHasMore,
    isLoadingProfile,
    profileError,
    fetchUserProfile,
    updateOwnProfile,
    toggleFollow,
    removeProfilePost,
    updateProfilePost,
    toggleProfilePostLike,
    setProfilePostCommentsCount,
    loadMoreProfileUsers,
  } = useUserStore();

  const [tab, setTab] = useState('posts');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setTab('posts');
    if (userId) {
      fetchUserProfile(userId);
    }
  }, [userId, fetchUserProfile]);

  const isOwnProfile = Boolean(
    currentUser && activeProfile && currentUser.id === activeProfile.id
  );

  const openEditModal = () => {
    if (!activeProfile) return;
    setEditName(activeProfile.name);
    setEditBio(activeProfile.bio || '');
    setEditAvatar(activeProfile.profilePicture || '');
    setEditOpen(true);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationErr = validateImageUploadInput(file);
    if (validationErr) {
      toast.error(validationErr);
      e.target.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await usersApi.uploadAvatar(file);
      setEditAvatar(res.imageUrl);
      toast.success('Profile photo uploaded');
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to upload photo.'
      );
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (trimmedName.length < 2) {
      toast.error('Full name must be at least 2 characters.');
      return;
    }

    setIsSavingProfile(true);
    const updated = await updateOwnProfile({
      name: trimmedName,
      bio: editBio.trim(),
      profilePicture: editAvatar,
    });
    setIsSavingProfile(false);

    if (updated) {
      setUser(updated);
      syncAuthorProfile(updated.id, {
        name: updated.name,
        profilePicture: updated.profilePicture,
      });
      setEditOpen(false);
    }
  };

  const handleFollowToggle = async (targetId) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const ok = await toggleFollow(targetId);
    if (ok) {
      fetchUserProfile(userId);
    }
  };

  const handleProfilePostLike = async (postId) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const target = profilePosts.find((p) => p.id === postId);
    if (!target) return;
    const nextLiked = !target.isLiked;
    const optimisticCount = Math.max(
      0,
      target.likesCount + (nextLiked ? 1 : -1)
    );
    toggleProfilePostLike(postId, nextLiked, optimisticCount);

    try {
      const res = nextLiked
        ? await postsApi.like(postId)
        : await postsApi.unlike(postId);
      toggleProfilePostLike(postId, res.isLiked, res.likesCount);
      fetchFeed();
    } catch (err) {
      toggleProfilePostLike(postId, target.isLiked, target.likesCount);
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to update like.'
      );
    }
  };

  const handleProfilePostUpdate = async (postId, payload) => {
    try {
      const res = await postsApi.update(postId, payload);
      updateProfilePost(res.post);
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

  const handleProfilePostDelete = async (postId) => {
    try {
      await postsApi.remove(postId);
      removeProfilePost(postId);
      useAuthStore.getState().adjustCounts({ posts: -1 });
      fetchFeed();
      toast.success('Post deleted');
      return true;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Failed to delete post.'
      );
      return false;
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="space-y-4">
        <div className="h-52 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white p-6" />
        <FeedSkeleton count={2} />
      </div>
    );
  }

  if (profileError || !activeProfile) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <p className="text-sm font-medium text-[#0F172A]">
          {profileError || 'Profile not found.'}
        </p>
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </button>
      </div>
    );
  }

  const renderUserList = (users, emptyText) => {
    if (users.length === 0) {
      return (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#64748B]">
          {emptyText}
        </div>
      );
    }

    return (
      <ul className="divide-y divide-[#E2E8F0] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
        {users.map((person) => {
          const isSelf = currentUser?.id === person.id;
          return (
            <li
              key={person.id}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <Link
                href={`/profile/${person.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <Avatar
                  src={person.profilePicture}
                  name={person.name}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0F172A] hover:underline">
                    {person.name}
                  </p>
                  <p className="truncate text-xs text-[#64748B]">
                    @{person.username}
                  </p>
                  {person.bio && (
                    <p className="mt-0.5 truncate text-xs text-[#64748B]">
                      {person.bio}
                    </p>
                  )}
                </div>
              </Link>

              {!isSelf && (
                <button
                  type="button"
                  onClick={() => handleFollowToggle(person.id)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    person.isFollowing
                      ? 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#EF4444] hover:text-[#EF4444]'
                      : 'bg-[#6366F1] text-white hover:bg-[#4F46E5]'
                  }`}
                >
                  {person.isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/home')}
          aria-label="Back to feed"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold text-[#0F172A]">
            {activeProfile.name}
          </h1>
          <p className="text-xs text-[#64748B] tabular-nums">
            {activeProfile.postsCount}{' '}
            {activeProfile.postsCount === 1 ? 'post' : 'posts'}
          </p>
        </div>
      </div>

      {/* Profile Header Card */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <Avatar
              src={activeProfile.profilePicture}
              name={activeProfile.name}
              size="xl"
            />
            <div>
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                {activeProfile.name}
              </h2>
              <div className="mt-0.5 flex flex-col gap-0.5 text-sm text-[#64748B] sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                <span>@{activeProfile.username}</span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {formatJoinedDate(activeProfile.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {isOwnProfile ? (
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
              >
                <Pencil className="h-4 w-4 text-[#64748B]" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <FriendRequestButton targetUserId={activeProfile.id} />
                <button
                  type="button"
                  onClick={() => handleFollowToggle(activeProfile.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeProfile.isFollowing
                      ? 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#EF4444] hover:text-[#EF4444]'
                      : 'bg-[#6366F1] text-white hover:bg-[#4F46E5]'
                  }`}
                >
                  {activeProfile.isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#0F172A]">
          {activeProfile.bio || (
            <span className="text-[#64748B]">No bio added yet.</span>
          )}
        </p>

        <div className="mt-5 flex items-center gap-6 border-t border-[#F1F5F9] pt-4 text-sm">
          <button
            type="button"
            onClick={() => setTab('posts')}
            className="hover:underline"
          >
            <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
              {activeProfile.postsCount}
            </span>{' '}
            <span className="text-[#64748B]">Posts</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('followers')}
            className="hover:underline"
          >
            <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
              {activeProfile.followersCount}
            </span>{' '}
            <span className="text-[#64748B]">Followers</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('following')}
            className="hover:underline"
          >
            <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
              {activeProfile.followingCount}
            </span>{' '}
            <span className="text-[#64748B]">Following</span>
          </button>
        </div>
      </section>

      {/* Profile Tabs */}
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white p-1"
      >
        {[
          { key: 'posts', label: 'Posts' },
          { key: 'followers', label: 'Followers' },
          { key: 'following', label: 'Following' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              tab === item.key
                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'posts' && (
        <div className="space-y-4">
          {profilePosts.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center">
              <p className="text-sm font-medium text-[#0F172A]">
                No posts published yet
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                When {activeProfile.name} shares updates, they will appear here.
              </p>
            </div>
          ) : (
            profilePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onToggleLike={handleProfilePostLike}
                onUpdatePost={handleProfilePostUpdate}
                onDeletePost={handleProfilePostDelete}
                onCommentsCountChange={(pid, count) =>
                  setProfilePostCommentsCount(pid, count)
                }
              />
            ))
          )}
        </div>
      )}

      {tab === 'followers' && (
        <>
          {renderUserList(followers, 'No followers yet.')}
          {followersHasMore && <button type="button" onClick={() => loadMoreProfileUsers('followers', userId)} className="w-full rounded-lg py-2 text-xs font-semibold text-[#4F46E5] hover:bg-[#EEF2FF]">Load more</button>}
        </>
      )}

      {tab === 'following' && (
        <>
          {renderUserList(following, 'Not following anyone yet.')}
          {followingHasMore && <button type="button" onClick={() => loadMoreProfileUsers('following', userId)} className="w-full rounded-lg py-2 text-xs font-semibold text-[#4F46E5] hover:bg-[#EEF2FF]">Load more</button>}
        </>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2
                id="edit-profile-title"
                className="font-display text-lg font-bold text-[#0F172A]"
              >
                Edit Profile
              </h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                aria-label="Close edit profile modal"
                className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={editAvatar} name={editName || 'User'} size="lg" />
                <div>
                  <label
                    htmlFor="edit-profile-avatar"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-[#64748B]" />
                    )}
                    <span>
                      {isUploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                    </span>
                  </label>
                  <input
                    id="edit-profile-avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    className="sr-only"
                  />
                  {editAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditAvatar('')}
                      className="ml-3 text-xs font-medium text-[#EF4444] hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-profile-name"
                  className="block text-xs font-medium text-[#0F172A]"
                >
                  Full Name
                </label>
                <input
                  id="edit-profile-name"
                  type="text"
                  maxLength={60}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#6366F1] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-profile-bio"
                  className="block text-xs font-medium text-[#0F172A]"
                >
                  Bio
                </label>
                <textarea
                  id="edit-profile-bio"
                  rows={3}
                  maxLength={240}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell people what you work on..."
                  className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#6366F1] focus:outline-none"
                />
                <p className="mt-1 text-right font-mono text-[11px] text-[#94A3B8] tabular-nums">
                  {editBio.length}/240
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile || isUploadingAvatar}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-60"
                >
                  {isSavingProfile && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
