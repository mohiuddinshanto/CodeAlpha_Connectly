'use client';

export function UnreadCountBadge({ count, className = '' }) {
  const unreadCount = Number(count);
  if (!Number.isFinite(unreadCount) || unreadCount <= 0) return null;

  return (
    <span
      aria-label={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1.5 py-0.5 text-[10px] leading-none font-bold text-white ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
