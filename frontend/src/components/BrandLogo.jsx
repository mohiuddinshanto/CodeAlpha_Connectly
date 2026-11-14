import Link from 'next/link';

export function BrandLogo({ href = '/home', size = 'md' }) {
  const boxSize = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-xl';
  const iconSize = size === 'sm' ? 15 : 18;
  const textClass = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-left">
      <span
        className={`flex items-center justify-center bg-[#6366F1] text-white ${boxSize}`}
      >
        <svg
          width={iconSize}
          height={iconSize}
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
      <span
        className={`font-display font-bold tracking-tight text-[#0F172A] whitespace-nowrap ${textClass}`}
      >
        Connectly
      </span>
    </Link>
  );
}
