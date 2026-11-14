'use client';

import { ArrowLeft, Camera, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Avatar } from '../../../components/Avatar';
import { BrandLogo } from '../../../components/BrandLogo';
import { usersApi } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import {
  validateImageUploadInput,
  validateRegisterForm,
} from '../../../utils/validation';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, register, setUser } = useAuthStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    return () => {
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationErr = validateImageUploadInput(file);
    if (validationErr) {
      toast.error(validationErr);
      e.target.value = '';
      return;
    }

    if (avatarUrl && avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl);
    }
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateRegisterForm({
      name,
      username,
      email,
      password,
    });
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    const ok = await register({
      name: name.trim(),
      username: username.trim().toLowerCase().replace(/^@+/, ''),
      email: email.trim().toLowerCase(),
      password,
      profilePicture: '',
    });
    if (ok && avatarFile) {
      try {
        const uploaded = await usersApi.uploadAvatar(avatarFile);
        const updated = await usersApi.updateProfile({
          profilePicture: uploaded.imageUrl,
        });
        setUser(updated.user);
      } catch {
        toast.error('Account created, but avatar upload failed.');
      }
    }
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
            Create Account
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Join Connectly to publish updates and follow creators.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="flex items-center gap-4">
              <Avatar src={avatarUrl} name={name || 'New Member'} size="lg" />
              <div className="flex-1">
                <label
                  htmlFor="register-avatar"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
                >
                  <Camera className="h-4 w-4 text-[#64748B]" />
                  <span>
                    {avatarUrl ? 'Change photo' : 'Profile photo (optional)'}
                  </span>
                </label>
                <input
                  id="register-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl('');
                      setAvatarFile(null);
                    }}
                    className="ml-3 text-xs font-medium text-[#EF4444] hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="register-name"
                className="block text-xs font-medium text-[#0F172A]"
              >
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elena Vance"
                className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[#EF4444]">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-username"
                className="block text-xs font-medium text-[#0F172A]"
              >
                Username
              </label>
              <input
                id="register-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="elena_vance"
                className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-[#EF4444]">{errors.username}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-medium text-[#0F172A]"
              >
                Email Address
              </label>
              <input
                id="register-email"
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
                htmlFor="register-password"
                className="block text-xs font-medium text-[#0F172A]"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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

            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-medium text-[#0F172A]"
              >
                Confirm Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pr-10 pl-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-[#64748B] transition-colors hover:text-[#0F172A]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-[#EF4444]">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </span>
            </button>
          </form>

          <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-center text-sm text-[#64748B]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#6366F1] hover:text-[#4F46E5]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
