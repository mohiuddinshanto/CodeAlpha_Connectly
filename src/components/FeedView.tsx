import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState, type RefObject } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { useUserStore } from '../store/userStore';
import type { FeedTab } from '../types';
import { Avatar } from './Avatar';
import { FeedSkeleton } from './FeedSkeleton';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';

interface FeedViewProps {
  activeTab: FeedTab;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  onSwitchTab: (tab: FeedTab) => void;
  onNavigateProfile: (userId: string) => void;
}

export function FeedView({
  activeTab,
  composerRef,
  onSwitchTab,
  onNavigateProfile,
}: FeedViewProps) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const {
    posts,
    topicFilter,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchFeed,
    loadMore,
    updatePost,
    deletePost,
    toggleLike,
    setCommentsCount,
    setTopicFilter,
  } = usePostStore();

  const {
    searchResults,
    isSearching,
    searchUsers,
    clearSearch,
    toggleFollow,
  } = useUserStore();

  const [mobileQuery, setMobileQuery] = useState('');

  useEffect(() => {
    const trimmed = mobileQuery.trim();
    if (trimmed.length < 2) {
      clearSearch();
      return;
    }
    const t = setTimeout(() => {
      void searchUsers(trimmed);
    }, 220);
    return () => clearTimeout(t);
  }, [mobileQuery, searchUsers, clearSearch]);

  const handleTabClick = (tab: FeedTab) => {
    if (tab === 'following' && !isAuthenticated) {
      openAuthModal('login');
      return;
    }
    onSwitchTab(tab);
  };

  return (
    <div className="space-y-4">
      {/* Compact Header & Segmented Feed Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-[#0F172A]">
            {activeTab === 'following'
              ? 'Following Feed'
              : activeTab === 'explore'
                ? 'Explore Community'
                : 'Home Feed'}
          </h1>
          <p className="text-xs text-[#64748B]">
            {activeTab === 'following'
              ? 'Latest updates from people you follow'
              : 'Recent conversations across Connectly'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Feed view"
          className="inline-flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-white p-1"
        >
          {(
            [
              { key: 'home', label: 'Home' },
              { key: 'explore', label: 'Explore' },
              { key: 'following', label: 'Following' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={activeTab === item.key}
              onClick={() => handleTabClick(item.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === item.key
                  ? 'bg-[#6366F1] text-white'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tablet / Mobile User Search (visible when RightSidebar is hidden) */}
      <div className="lg:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <label htmlFor="mobile-user-search" className="sr-only">
            Search people
          </label>
          <input
            id="mobile-user-search"
            type="search"
            value={mobileQuery}
            onChange={(e) => setMobileQuery(e.target.value)}
            placeholder="Search people by name or username..."
            className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pr-9 pl-10 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
          />
          {mobileQuery && (
            <button
              type="button"
              onClick={() => setMobileQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {mobileQuery.trim().length >= 2 && (
          <div className="mt-2 rounded-xl border border-[#E2E8F0] bg-white p-2">
            {isSearching ? (
              <p className="py-3 text-center text-xs text-[#64748B]">
                Searching...
              </p>
            ) : searchResults.length === 0 ? (
              <p className="py-3 text-center text-xs text-[#64748B]">
                No matching users found.
              </p>
            ) : (
              <ul className="space-y-1">
                {searchResults.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => onNavigateProfile(person.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <Avatar
                        src={person.profilePicture}
                        name={person.name}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#0F172A]">
                          {person.name}
                        </p>
                        <p className="truncate text-[11px] text-[#64748B]">
                          @{person.username}
                        </p>
                      </div>
                    </button>
                    {user?.id !== person.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            openAuthModal('login');
                            return;
                          }
                          void toggleFollow(person.id);
                        }}
                        className="rounded-lg bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]"
                      >
                        {person.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Topic Filter Notice */}
      {topicFilter && (
        <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs">
          <span className="text-[#64748B]">
            Filtering posts matching{' '}
            <strong className="font-semibold text-[#0F172A]">
              {topicFilter}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => void setTopicFilter('')}
            className="font-semibold text-[#6366F1] hover:underline"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Post Composer */}
      {activeTab !== 'following' && <PostComposer textareaRef={composerRef} />}

      {/* Feed Body */}
      {isLoading ? (
        <FeedSkeleton count={3} />
      ) : error ? (
        <div className="rounded-2xl border border-[#FECACA] bg-white p-8 text-center">
          <AlertCircle className="mx-auto h-7 w-7 text-[#EF4444]" />
          <p className="mt-2 text-sm font-semibold text-[#0F172A]">
            Could not load posts
          </p>
          <p className="mt-1 text-xs text-[#64748B]">{error}</p>
          <button
            type="button"
            onClick={() => void fetchFeed(activeTab, topicFilter)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6366F1]">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="mt-3 font-display text-base font-semibold text-[#0F172A]">
            {activeTab === 'following'
              ? 'Your Following feed is quiet'
              : 'No posts matched right now'}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            {activeTab === 'following'
              ? 'Follow creators in Explore or Suggested People to see their posts here.'
              : topicFilter
                ? 'Try clearing the topic filter or publish the first post on this subject.'
                : 'Be the first to share an update with the community.'}
          </p>
          {activeTab === 'following' && (
            <button
              type="button"
              onClick={() => onSwitchTab('explore')}
              className="mt-4 rounded-xl bg-[#6366F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5]"
            >
              Browse Explore
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onNavigateProfile={onNavigateProfile}
              onToggleLike={toggleLike}
              onUpdatePost={updatePost}
              onDeletePost={deletePost}
              onCommentsCountChange={setCommentsCount}
            />
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={() => void loadMore()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60"
              >
                {isLoadingMore && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#6366F1]" />
                )}
                <span>{isLoadingMore ? 'Loading...' : 'Load More Posts'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
