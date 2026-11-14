import { Camera, Loader2, X } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { ApiError, usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  validateImageUploadInput,
  validateLoginForm,
  validateRegisterForm,
} from '../utils/validation';
import { Avatar } from './Avatar';

interface AuthModalProps {
  onSuccess?: () => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const { authModalMode, openAuthModal, closeAuthModal, login, register } =
    useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!authModalMode) return null;

  const isRegister = authModalMode === 'register';

  const switchMode = (mode: 'login' | 'register') => {
    setErrors({});
    openAuthModal(mode);
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationErr = validateImageUploadInput(file);
    if (validationErr) {
      toast.error(validationErr);
      e.target.value = '';
      return;
    }

    // Create immediate local preview before optional upload
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // If user already wants server ImgBB upload during registration,
    // note /api/users/upload-avatar requires auth, so we keep validated preview
    // and attach it during register, OR upload right after registration.
    setIsUploadingAvatar(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isRegister) {
      const nextErrors = validateRegisterForm({
        name,
        username,
        email,
        password,
      });
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
        profilePicture: avatarUrl,
      });
      setIsSubmitting(false);
      if (ok) {
        onSuccess?.();
      }
    } else {
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
        onSuccess?.();
      }
    }
  };

  const handleDemoSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const ok = await login('demo@connectly.app', 'Password123!');
    setIsSubmitting(false);
    if (ok) {
      onSuccess?.();
    }
  };

  // Suppress unused import lint when upload-avatar happens on edit profile
  void ApiError;
  void usersApi;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="auth-modal-title"
              className="font-display text-xl font-bold tracking-tight text-[#0F172A]"
            >
              {isRegister ? 'Create your Connectly account' : 'Sign in to Connectly'}
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {isRegister
                ? 'Build your profile, share updates, and follow creators.'
                : 'Welcome back. Enter your credentials to continue.'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close authentication modal"
            className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {isRegister && (
            <>
              <div className="flex items-center gap-4">
                <Avatar src={avatarUrl} name={name || 'New Member'} size="lg" />
                <div className="flex-1">
                  <label
                    htmlFor="reg-avatar"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
                  >
                    <Camera className="h-4 w-4 text-[#64748B]" />
                    <span>{avatarUrl ? 'Change photo' : 'Upload photo (optional)'}</span>
                  </label>
                  <input
                    id="reg-avatar"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="sr-only"
                  />
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="ml-3 text-xs font-medium text-[#EF4444] hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-medium text-[#0F172A]"
                >
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
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
                  htmlFor="auth-username"
                  className="block text-xs font-medium text-[#0F172A]"
                >
                  Username
                </label>
                <input
                  id="auth-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="elena_vance"
                  className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-[#EF4444]">
                    {errors.username}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium text-[#0F172A]"
            >
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
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
              htmlFor="auth-password"
              className="block text-xs font-medium text-[#0F172A]"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-[#EF4444]">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingAvatar}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        {!isRegister && (
          <div className="mt-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDemoSignIn}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs font-medium text-[#0F172A] transition-colors hover:bg-[#EEF2FF] hover:text-[#4F46E5] disabled:opacity-60"
            >
              Continue with Demo Account (Elena Vance)
            </button>
          </div>
        )}

        <div className="mt-5 border-t border-[#E2E8F0] pt-4 text-center text-sm text-[#64748B]">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-semibold text-[#6366F1] hover:text-[#4F46E5]"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Connectly?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-semibold text-[#6366F1] hover:text-[#4F46E5]"
              >
                Create account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
