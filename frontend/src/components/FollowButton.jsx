'use client';

import { UserCheck, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function FollowButton({
  userId,
  userName,
  isFollowing,
  onToggle,
  size = 'sm',
  showIcon = true,
}) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  if (user?.id === userId) return null;

  const handleClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    onToggle(userId);
  };

  const sizeClasses =
    size === 'xs'
      ? 'px-2.5 py-1 text-[11px] rounded-lg'
      : size === 'md'
        ? 'px-4 py-2 text-sm rounded-xl'
        : 'px-2.5 py-1.5 text-xs rounded-lg';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isFollowing
          ? `Unfollow ${userName || 'user'}`
          : `Follow ${userName || 'user'}`
      }
      className={`inline-flex shrink-0 items-center gap-1.5 font-semibold transition-colors whitespace-nowrap ${sizeClasses} ${
        isFollowing
          ? 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#EF4444] hover:text-[#EF4444]'
          : 'bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#6366F1] hover:text-white'
      }`}
    >
      {showIcon &&
        (isFollowing ? (
          <UserCheck className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        ) : (
          <UserPlus className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
        ))}
      <span>{isFollowing ? 'Following' : 'Follow'}</span>
    </button>
  );
}
