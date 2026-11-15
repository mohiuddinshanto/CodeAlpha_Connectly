'use client';

import {
  Compass,
  Home,
  LogIn,
  MessageSquare,
  PlusSquare,
  Settings,
  User,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';
import { BrandLogo } from './BrandLogo';
import { useChatNotifications } from './ChatNotifications';
import { UnreadCountBadge } from './UnreadCountBadge';

export function MobileHeader() {
  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount } = useChatNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur-sm md:hidden">
      <BrandLogo href="/home" size="sm" />

      {isAuthenticated && user ? (
        <div className="flex items-center gap-2">
          <Link
            href="/friends"
            aria-label="Open friends"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <UserPlus className="h-4 w-4" />
          </Link>
          <Link
            href="/messages"
            aria-label={
              unreadCount
                ? `Open messages, ${unreadCount} unread`
                : 'Open messages'
            }
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <MessageSquare className="h-4 w-4" />
            <UnreadCountBadge
              count={unreadCount}
              className="absolute -top-1 -right-1"
            />
          </Link>
          <Link
            href="/settings"
            aria-label="Open settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <Link
            href={`/profile/${user.id}`}
            aria-label="Open my profile"
            className="rounded-full"
          >
            <Avatar src={user.profilePicture} name={user.name} size="xs" />
          </Link>
        </div>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4F46E5]"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </Link>
      )}
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount } = useChatNotifications();

  const handleCompose = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (pathname !== '/home') {
      router.push('/home');
    }
    setTimeout(() => {
      const el = document.getElementById('post-composer-input');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed right-0 bottom-0 left-0 z-30 flex h-14 items-center justify-around border-t border-[#E2E8F0] bg-white/95 px-2 backdrop-blur-sm md:hidden"
    >
      <Link
        href="/home"
        aria-label="Home"
        className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium transition-colors ${
          pathname === '/home' ? 'text-[#6366F1]' : 'text-[#64748B]'
        }`}
      >
        <Home className="h-5 w-5" />
        <span>Home</span>
      </Link>

      <Link
        href="/explore"
        aria-label="Explore"
        className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium transition-colors ${
          pathname === '/explore' ? 'text-[#6366F1]' : 'text-[#64748B]'
        }`}
      >
        <Compass className="h-5 w-5" />
        <span>Explore</span>
      </Link>

      <button
        type="button"
        onClick={handleCompose}
        aria-label="Create"
        className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium text-[#64748B] transition-colors hover:text-[#6366F1]"
      >
        <PlusSquare className="h-5 w-5" />
        <span>Create</span>
      </button>

      <Link
        href={isAuthenticated ? '/messages' : '/login'}
        aria-label={
          unreadCount ? `Messages, ${unreadCount} unread` : 'Messages'
        }
        className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium transition-colors ${
          pathname === '/messages' || pathname.startsWith('/messages/')
            ? 'text-[#6366F1]'
            : 'text-[#64748B]'
        }`}
      >
        <span className="relative">
          <MessageSquare className="h-5 w-5" />
          <UnreadCountBadge
            count={unreadCount}
            className="absolute -top-2 -right-2"
          />
        </span>
        <span>Messages</span>
      </Link>

      <Link
        href={isAuthenticated && user ? `/profile/${user.id}` : '/login'}
        aria-label="Profile"
        className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium transition-colors ${
          Boolean(user && pathname === `/profile/${user.id}`)
            ? 'text-[#6366F1]'
            : 'text-[#64748B]'
        }`}
      >
        <User className="h-5 w-5" />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
