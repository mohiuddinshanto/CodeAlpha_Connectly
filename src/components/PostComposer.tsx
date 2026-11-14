import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from 'react';
import toast from 'react-hot-toast';
import { ApiError, postsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { validateImageUploadInput } from '../utils/validation';
import { Avatar } from './Avatar';

interface PostComposerProps {
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export function PostComposer({ textareaRef }: PostComposerProps) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const { createPost } = usePostStore();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageUploadInput(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    setIsUploading(true);

    try {
      const res = await postsApi.uploadImage(file);
      setImageUrl(res.imageUrl);
      toast.success('Image uploaded');
    } catch (err) {
      setLocalPreview('');
      setImageUrl('');
      toast.error(
        err instanceof ApiError ? err.message : 'Image upload failed.'
      );
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setImageUrl('');
    setLocalPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const trimmed = content.trim();
    if (!trimmed && !imageUrl) {
      toast.error('Write something or attach an image to publish.');
      return;
    }

    setIsPublishing(true);
    const created = await createPost({ content: trimmed, image: imageUrl });
    setIsPublishing(false);

    if (created) {
      setContent('');
      removeImage();
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-semibold text-[#0F172A]">
              Share your perspective on Connectly
            </h2>
            <p className="mt-0.5 text-sm text-[#64748B]">
              Sign in or create an account to publish posts, like, comment, and follow people.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] whitespace-nowrap"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] whitespace-nowrap"
            >
              Join Connectly
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayPreview = imageUrl || localPreview;
  const remaining = 1000 - content.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-5"
    >
      <div className="flex gap-3.5">
        <Avatar src={user.profilePicture} name={user.name} size="md" />
        <div className="min-w-0 flex-1">
          <label htmlFor="post-composer-input" className="sr-only">
            Share an update
          </label>
          <textarea
            ref={textareaRef}
            id="post-composer-input"
            rows={3}
            maxLength={1000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you building or thinking about today?"
            className="w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
          />

          {displayPreview && (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <img
                src={displayPreview}
                alt="Selected post attachment preview"
                referrerPolicy="no-referrer"
                className="max-h-72 w-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0F172A]/45 text-white">
                  <div className="flex items-center gap-2 rounded-lg bg-[#0F172A]/80 px-3 py-1.5 text-xs font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading image...</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={removeImage}
                aria-label="Remove selected image"
                className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A]/75 text-white transition-colors hover:bg-[#0F172A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-[#F1F5F9] pt-3">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                id="post-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="sr-only"
              />
              <label
                htmlFor="post-image-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#6366F1]"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Add Image</span>
              </label>

              <span
                className={`font-mono text-xs tabular-nums ${
                  remaining < 100 ? 'text-[#EF4444]' : 'text-[#94A3B8]'
                }`}
              >
                {content.length}/1000
              </span>
            </div>

            <button
              type="submit"
              disabled={
                isPublishing || isUploading || (!content.trim() && !imageUrl)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
