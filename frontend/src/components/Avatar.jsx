'use client';

import { useEffect, useState } from 'react';
import { getInitials } from '../utils/formatters';

const SIZE_CLASSES = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export function Avatar({ src, name, size = 'md', className = '' }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const showImage = Boolean(src && src.trim().length > 0 && !hasError);
  const initials = getInitials(name);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E2E8F0] bg-[#EEF2FF] font-display font-semibold text-[#4F46E5] select-none ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || 'User avatar'}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
