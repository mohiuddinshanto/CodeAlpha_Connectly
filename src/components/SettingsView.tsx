import { ArrowLeft, Camera, Loader2, LogOut } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { ApiError, usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { useUserStore } from '../store/userStore';
import { formatJoinedDate } from '../utils/formatters';
import { validateImageUploadInput } from '../utils/validation';
import { Avatar } from './Avatar';

interface SettingsViewProps {
  onBack: () => void;
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const { user, setUser, logout } = useAuthStore();
  const { updateOwnProfile } = useUserStore();
  const { syncAuthorProfile } = usePostStore();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture || ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  if (!user) return null;

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageUploadInput(file);
    if (err) {
      toast.error(err);
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const res = await usersApi.uploadAvatar(file);
      setProfilePicture(res.imageUrl);
      toast.success('Avatar uploaded');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Failed to upload avatar.'
      );
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Full name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    const updated = await updateOwnProfile({
      name: name.trim(),
      bio: bio.trim(),
      profilePicture,
    });
    setIsSaving(false);

    if (updated) {
      setUser(updated);
      syncAuthorProfile(updated.id, {
        name: updated.name,
        profilePicture: updated.profilePicture,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to feed"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold text-[#0F172A]">
            Account Settings
          </h1>
          <p className="text-xs text-[#64748B]">
            Manage your public profile details and session
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-6"
      >
        <div className="flex items-center gap-4">
          <Avatar src={profilePicture} name={name || user.name} size="lg" />
          <div>
            <label
              htmlFor="settings-avatar-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 text-[#64748B]" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload New Photo'}</span>
            </label>
            <input
              id="settings-avatar-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="sr-only"
            />
            {profilePicture && (
              <button
                type="button"
                onClick={() => setProfilePicture('')}
                className="ml-3 text-xs font-medium text-[#EF4444] hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="settings-name"
              className="block text-xs font-medium text-[#0F172A]"
            >
              Full Name
            </label>
            <input
              id="settings-name"
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#6366F1] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="settings-username"
              className="block text-xs font-medium text-[#0F172A]"
            >
              Username
            </label>
            <input
              id="settings-username"
              type="text"
              disabled
              value={`@${user.username}`}
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#64748B]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="settings-email"
            className="block text-xs font-medium text-[#0F172A]"
          >
            Email Address
          </label>
          <input
            id="settings-email"
            type="email"
            disabled
            value={user.email || ''}
            className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#64748B]"
          />
          <p className="mt-1 text-xs text-[#64748B]">
            Member since {formatJoinedDate(user.createdAt)}
          </p>
        </div>

        <div>
          <label
            htmlFor="settings-bio"
            className="block text-xs font-medium text-[#0F172A]"
          >
            Bio
          </label>
          <textarea
            id="settings-bio"
            rows={3}
            maxLength={240}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share a short bio about your work and interests..."
            className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#6366F1] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] pt-4">
          <button
            type="button"
            onClick={() => {
              void logout();
              onBack();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-sm font-medium text-[#EF4444] transition-colors hover:bg-[#FEE2E2]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>

          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
}
