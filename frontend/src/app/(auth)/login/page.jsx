'use client';

import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandLogo } from '../../../components/BrandLogo';
import { useAuthStore } from '../../../store/authStore';
import { validateLoginForm } from '../../../utils/validation';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateLoginForm({ email, password });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    const ok = await login(email.trim().toLowerCase(), password);
    setIsSubmitting(false);

    if (ok) {
      router.replace('/home');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <BrandLogo href="/home" />
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] transition-colors hover:text-[#0F172A]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Feed</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Sign in to share updates, follow creators, and join discussions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-[#0F172A]"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#EF4444]">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-[#0F172A]"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pr-10 pl-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-[#64748B] transition-colors hover:text-[#0F172A]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[#EF4444]">{errors.password}</p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-[#64748B]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#6366F1] focus:ring-[#6366F1]"
              />
              <span>Remember me on this device</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSubmitting ? 'Signing In...' : 'Login'}</span>
            </button>
          </form>

          <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-center text-sm text-[#64748B]">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#6366F1] hover:text-[#4F46E5]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
