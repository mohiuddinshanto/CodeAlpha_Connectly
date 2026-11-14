export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4" aria-label="Loading posts" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-[#E2E8F0] bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-[#E2E8F0]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-36 animate-pulse rounded bg-[#E2E8F0]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[#F1F5F9]" />
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="h-3.5 w-full animate-pulse rounded bg-[#F1F5F9]" />
            <div className="h-3.5 w-5/6 animate-pulse rounded bg-[#F1F5F9]" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#F1F5F9]" />
          </div>
          <div className="mt-4 flex items-center gap-6 border-t border-[#F1F5F9] pt-3">
            <div className="h-4 w-14 animate-pulse rounded bg-[#F1F5F9]" />
            <div className="h-4 w-16 animate-pulse rounded bg-[#F1F5F9]" />
          </div>
        </div>
      ))}
    </div>
  );
}
