import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 text-center">
      <div className="max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8">
        <p className="font-mono text-xs font-semibold tracking-wider text-[#6366F1] uppercase">
          404 · Not Found
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-[#0F172A]">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          The Connectly page you requested does not exist or may have moved.
        </p>
        <Link
          href="/home"
          className="mt-6 inline-block rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5]"
        >
          Back to Home Feed
        </Link>
      </div>
    </div>
  );
}
