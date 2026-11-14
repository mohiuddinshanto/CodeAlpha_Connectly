import { Hash, Loader2, Search, UserCheck, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { useUserStore } from '../store/userStore';
import { Avatar } from './Avatar';

interface RightSidebarProps {
  onNavigateProfile: (userId: string) => void;
  onSelectTopic: (topic: string) => void;
}

const TRENDING_TOPICS = [
  { tag: '#DesignSystems', category: 'Product Design' },
  { tag: '#MongoDB', category: 'Databases' },
  { tag: '#EngineeringLeadership', category: 'Teams' },
  { tag: '#TypeScript', category: 'Web Architecture' },
  { tag: '#WebPerf', category: 'Frontend Craft' },
];

export function RightSidebar({
  onNavigateProfile,
  onSelectTopic,
}: RightSidebarProps) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const { topicFilter } = usePostStore();
  const {
    suggestedUsers,
    searchResults,
    isSearching,
    searchUsers,
    clearSearch,
    toggleFollow,
  } = useUserStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      clearSearch();
      return;
    }
    const timer = setTimeout(() => {
      void searchUsers(trimmed);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, searchUsers, clearSearch]);

  const handleFollowAction = (targetUserId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    void toggleFollow(targetUserId);
  };

  return (
    <aside
      aria-label="Discovery sidebar"
      className="sticky top-0 hidden h-screen w-[312px] shrink-0 space-y-5 overflow-y-auto border-l border-[#E2E8F0] bg-white px-5 py-6 lg:block"
    >
      {/* Search Users */}
      <section aria-label="Search users">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <label htmlFor="user-search-input" className="sr-only">
            Search users by name or username
          </label>
          <input
            id="user-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pr-9 pl-10 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:bg-white focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {query.trim().length >= 2 && (
          <div className="mt-2 rounded-xl border border-[#E2E8F0] bg-white p-2">
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-[#64748B]">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#64748B]">
                No users matched &ldquo;{query.trim()}&rdquo;
              </p>
            ) : (
              <ul className="space-y-1">
                {searchResults.map((person) => {
                  const isSelf = user?.id === person.id;
                  return (
                    <li
                      key={person.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-[#F8FAFC]"
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

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleFollowAction(person.id)}
                          className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
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
            )}
          </div>
        )}
      </section>

      {/* Current User Mini Profile */}
      {isAuthenticated && user && (
        <section
          aria-label="Your profile summary"
          className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
        >
          <button
            type="button"
            onClick={() => onNavigateProfile(user.id)}
            className="flex w-full items-center gap-3 text-left"
          >
            <Avatar src={user.profilePicture} name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0F172A]">
                {user.name}
              </p>
              <p className="truncate text-xs text-[#64748B]">
                @{user.username}
              </p>
            </div>
          </button>

          <div className="mt-3.5 grid grid-cols-3 border-t border-[#E2E8F0] pt-3 text-center">
            <div>
              <p className="font-mono text-sm font-semibold text-[#0F172A] tabular-nums">
                {user.postsCount}
              </p>
              <p className="text-[11px] text-[#64748B]">Posts</p>
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-[#0F172A] tabular-nums">
                {user.followersCount}
              </p>
              <p className="text-[11px] text-[#64748B]">Followers</p>
            </div>
            <div>
              <p className="font-mono text-sm font-semibold text-[#0F172A] tabular-nums">
                {user.followingCount}
              </p>
              <p className="text-[11px] text-[#64748B]">Following</p>
            </div>
          </div>
        </section>
      )}

      {/* Suggested People */}
      <section
        aria-label="Suggested people"
        className="rounded-2xl border border-[#E2E8F0] bg-white p-4"
      >
        <h3 className="font-display text-sm font-semibold text-[#0F172A]">
          Suggested People
        </h3>
        {suggestedUsers.length === 0 ? (
          <p className="mt-3 text-xs text-[#64748B]">
            No suggestions available right now.
          </p>
        ) : (
          <ul className="mt-3.5 space-y-3">
            {suggestedUsers.slice(0, 4).map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between gap-2.5"
              >
                <button
                  type="button"
                  onClick={() => onNavigateProfile(person.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <Avatar
                    src={person.profilePicture}
                    name={person.name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#0F172A] hover:underline">
                      {person.name}
                    </p>
                    <p className="truncate text-[11px] text-[#64748B]">
                      @{person.username}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFollowAction(person.id)}
                  aria-label={
                    person.isFollowing
                      ? `Unfollow ${person.name}`
                      : `Follow ${person.name}`
                  }
                  className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    person.isFollowing
                      ? 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#EF4444] hover:text-[#EF4444]'
                      : 'bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#6366F1] hover:text-white'
                  }`}
                >
                  {person.isFollowing ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Trending Topics */}
      <section
        aria-label="Trending topics"
        className="rounded-2xl border border-[#E2E8F0] bg-white p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-[#0F172A]">
            Trending Topics
          </h3>
          {topicFilter && (
            <button
              type="button"
              onClick={() => onSelectTopic('')}
              className="text-xs font-medium text-[#6366F1] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <ul className="mt-3 divide-y divide-[#F1F5F9]">
          {TRENDING_TOPICS.map((topic) => {
            const active = topicFilter === topic.tag;
            return (
              <li key={topic.tag}>
                <button
                  type="button"
                  onClick={() => onSelectTopic(topic.tag)}
                  className={`flex w-full items-center justify-between py-2.5 text-left transition-colors ${
                    active ? 'text-[#6366F1]' : 'hover:text-[#6366F1]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <Hash className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
                    <span>{topic.tag.slice(1)}</span>
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {topic.category}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
