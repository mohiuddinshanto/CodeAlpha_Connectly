'use client';

import { Hash, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { useUserStore } from '../store/userStore';
import { Avatar } from './Avatar';
import { FollowButton } from './FollowButton';
import { SearchInput } from './SearchInput';

const TRENDING_TOPICS = [
  { tag: '#DesignSystems', category: 'Product Design' },
  { tag: '#MongoDB', category: 'Databases' },
  { tag: '#EngineeringLeadership', category: 'Teams' },
  { tag: '#JavaScript', category: 'Web Architecture' },
  { tag: '#WebPerf', category: 'Frontend Craft' },
];

export function RightSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { topicFilter, setTopicFilter } = usePostStore();
  const {
    suggestedUsers,
    searchResults,
    isSearching,
    fetchSuggestedUsers,
    searchUsers,
    clearSearch,
    toggleFollow,
  } = useUserStore();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (suggestedUsers.length === 0) {
      fetchSuggestedUsers();
    }
  }, [fetchSuggestedUsers, suggestedUsers.length]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      clearSearch();
      return;
    }
    const timer = setTimeout(() => {
      searchUsers(trimmed);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, searchUsers, clearSearch]);

  const handleSelectTopic = (tag) => {
    setTopicFilter(tag);
    if (pathname !== '/explore') {
      router.push('/explore');
    }
  };

  return (
    <aside
      aria-label="Discovery sidebar"
      className="sticky top-0 hidden h-screen w-[312px] shrink-0 space-y-5 overflow-y-auto border-l border-[#E2E8F0] bg-white px-5 py-6 lg:block"
    >
      <section aria-label="Search users">
        <SearchInput
          id="user-search-input"
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          placeholder="Search people..."
          label="Search users by name or username"
        />

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
                {searchResults.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-[#F8FAFC]"
                  >
                    <Link
                      href={`/profile/${person.id}`}
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
                    </Link>

                    <FollowButton
                      userId={person.id}
                      userName={person.name}
                      isFollowing={person.isFollowing}
                      onToggle={toggleFollow}
                      size="xs"
                      showIcon={false}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {isAuthenticated && user && (
        <section
          aria-label="Your profile summary"
          className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
        >
          <Link
            href={`/profile/${user.id}`}
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
          </Link>

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
                <Link
                  href={`/profile/${person.id}`}
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
                </Link>

                <FollowButton
                  userId={person.id}
                  userName={person.name}
                  isFollowing={person.isFollowing}
                  onToggle={toggleFollow}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

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
              onClick={() => handleSelectTopic('')}
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
                  onClick={() => handleSelectTopic(topic.tag)}
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
