'use client';

import { Search, X } from 'lucide-react';

export function SearchInput({
  id = 'user-search',
  value,
  onChange,
  onClear,
  placeholder = 'Search people...',
  label = 'Search users',
  className = '',
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pr-9 pl-10 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:bg-white focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-[#94A3B8] hover:text-[#0F172A]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
