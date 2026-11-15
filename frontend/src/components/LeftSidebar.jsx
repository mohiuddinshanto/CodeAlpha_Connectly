'use client';

import {
  Compass,
  Home,
  LogIn,
  LogOut,
  MessageSquare,
  PlusSquare,
  Settings,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';
import { BrandLogo } from './BrandLogo';

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const profileHref = user ? `/profile/${user.id}` : '/login';

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      href: '/home',
      icon: Home,
      active: pathname === '/home',
    },
    {
      key: 'explore',
      label: 'Explore',
      href: '/explore',
      icon: Compass,
      active: pathname === '/explore',
    },
    {
      key: 'following',
      label: 'Following',
      href: isAuthenticated ? '/following' : '/login',
      icon: Users,
      active: pathname === '/following',
    },
    {
      key: 'friends',
      label: 'Friends',
      href: isAuthenticated ? '/friends' : '/login',
      icon: UserPlus,
      active: pathname === '/friends',
    },
    {
      key: 'messages',
      label: 'Messages',
      href: isAuthenticated ? '/messages' : '/login',
      icon: MessageSquare,
      active: pathname === '/messages' || pathname.startsWith('/messages/'),
    },
    {
      key: 'profile',
      label: 'My Profile',
      href: profileHref,
      icon: User,
      active: Boolean(user && pathname === `/profile/${user.id}`),
    },
    {
      key: 'settings',
      label: 'Settings',
      href: isAuthenticated ? '/settings' : '/login',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  const handleCreatePost = () => {
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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      aria-label="Primary navigation"
      className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col justify-between border-r border-[#E2E8F0] bg-white px-4 py-6 md:flex"
    >
      <div className="space-y-6">
        <div className="px-2">
          <BrandLogo href="/home" />
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  item.active
                    ? 'bg-[#EEF2FF] text-[#4F46E5]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleCreatePost}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] whitespace-nowrap"
        >
          <PlusSquare className="h-4 w-4 shrink-0" />
          <span>Create Post</span>
        </button>
      </div>

      <div className="border-t border-[#E2E8F0] pt-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <Link
              href={`/profile/${user.id}`}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-[#F8FAFC]"
            >
              <Avatar src={user.profilePicture} name={user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0F172A]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[#64748B]">
                  @{user.username}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#FEF2F2] hover:text-[#EF4444]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              className="block w-full rounded-xl bg-[#0F172A] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#1E293B]"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
