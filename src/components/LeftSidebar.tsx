import {
  Compass,
  Home,
  LogIn,
  LogOut,
  PlusSquare,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { AppView } from '../types';
import { Avatar } from './Avatar';

interface LeftSidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onFocusComposer: () => void;
}

export function LeftSidebar({
  currentView,
  onNavigate,
  onFocusComposer,
}: LeftSidebarProps) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();

  const isNavActive = (key: string) => {
    if (key === 'home') {
      return currentView.type === 'feed' && currentView.tab === 'home';
    }
    if (key === 'explore') {
      return currentView.type === 'feed' && currentView.tab === 'explore';
    }
    if (key === 'following') {
      return currentView.type === 'feed' && currentView.tab === 'following';
    }
    if (key === 'profile') {
      return (
        currentView.type === 'profile' &&
        Boolean(user && currentView.userId === user.id)
      );
    }
    if (key === 'settings') {
      return currentView.type === 'settings';
    }
    return false;
  };

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      onClick: () => onNavigate({ type: 'feed', tab: 'home' }),
    },
    {
      key: 'explore',
      label: 'Explore',
      icon: Compass,
      onClick: () => onNavigate({ type: 'feed', tab: 'explore' }),
    },
    {
      key: 'following',
      label: 'Following',
      icon: Users,
      onClick: () => {
        if (!isAuthenticated) {
          openAuthModal('login');
          return;
        }
        onNavigate({ type: 'feed', tab: 'following' });
      },
    },
    {
      key: 'profile',
      label: 'My Profile',
      icon: User,
      onClick: () => {
        if (!isAuthenticated || !user) {
          openAuthModal('login');
          return;
        }
        onNavigate({ type: 'profile', userId: user.id });
      },
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        if (!isAuthenticated) {
          openAuthModal('login');
          return;
        }
        onNavigate({ type: 'settings' });
      },
    },
  ];

  return (
    <aside
      aria-label="Primary navigation"
      className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col justify-between border-r border-[#E2E8F0] bg-white px-4 py-6 md:flex"
    >
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => onNavigate({ type: 'feed', tab: 'home' })}
          className="flex items-center gap-2.5 px-2 text-left"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6366F1] text-white">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 8.5C7 6.567 8.567 5 10.5 5H17C18.105 5 19 5.895 19 7V13.5C19 15.433 17.433 17 15.5 17H9C7.895 17 7 16.105 7 15V8.5Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="9.5" cy="14.5" r="2.5" fill="currentColor" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
            Connectly
          </span>
        </button>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#EEF2FF] text-[#4F46E5]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal('login');
              return;
            }
            onFocusComposer();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] whitespace-nowrap"
        >
          <PlusSquare className="h-4 w-4 shrink-0" />
          <span>Create Post</span>
        </button>
      </div>

      <div className="border-t border-[#E2E8F0] pt-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'profile', userId: user.id })}
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
            </button>

            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#FEF2F2] hover:text-[#EF4444]"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="w-full rounded-xl bg-[#0F172A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E293B]"
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
