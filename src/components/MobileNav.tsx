import {
  Compass,
  Home,
  LogIn,
  PlusSquare,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { AppView } from '../types';
import { Avatar } from './Avatar';

interface MobileNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onFocusComposer: () => void;
}

export function MobileHeader({
  onNavigate,
}: Pick<MobileNavProps, 'onNavigate'>) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur-sm md:hidden">
      <button
        type="button"
        onClick={() => onNavigate({ type: 'feed', tab: 'home' })}
        className="flex items-center gap-2"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366F1] text-white">
          <svg
            width="15"
            height="15"
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
        <span className="font-display text-base font-bold tracking-tight text-[#0F172A]">
          Connectly
        </span>
      </button>

      {isAuthenticated && user ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'settings' })}
            aria-label="Open settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ type: 'profile', userId: user.id })}
            aria-label="Open my profile"
            className="rounded-full"
          >
            <Avatar src={user.profilePicture} name={user.name} size="xs" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4F46E5]"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </button>
      )}
    </header>
  );
}

export function MobileBottomNav({
  currentView,
  onNavigate,
  onFocusComposer,
}: MobileNavProps) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  const items = [
    {
      key: 'home',
      label: 'Home',
      icon: Home,
      active: currentView.type === 'feed' && currentView.tab === 'home',
      onClick: () => onNavigate({ type: 'feed', tab: 'home' }),
    },
    {
      key: 'explore',
      label: 'Explore',
      icon: Compass,
      active: currentView.type === 'feed' && currentView.tab === 'explore',
      onClick: () => onNavigate({ type: 'feed', tab: 'explore' }),
    },
    {
      key: 'compose',
      label: 'Create',
      icon: PlusSquare,
      active: false,
      onClick: () => {
        if (!isAuthenticated) {
          openAuthModal('login');
          return;
        }
        onFocusComposer();
      },
    },
    {
      key: 'following',
      label: 'Following',
      icon: Users,
      active: currentView.type === 'feed' && currentView.tab === 'following',
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
      label: 'Profile',
      icon: User,
      active:
        currentView.type === 'profile' &&
        Boolean(user && currentView.userId === user.id),
      onClick: () => {
        if (!isAuthenticated || !user) {
          openAuthModal('login');
          return;
        }
        onNavigate({ type: 'profile', userId: user.id });
      },
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed right-0 bottom-0 left-0 z-30 flex h-14 items-center justify-around border-t border-[#E2E8F0] bg-white/95 px-2 backdrop-blur-sm md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            aria-label={item.label}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[11px] font-medium transition-colors ${
              item.active ? 'text-[#6366F1]' : 'text-[#64748B]'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
