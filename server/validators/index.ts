export interface ValidationResult<T = string> {
  valid: boolean;
  value?: T;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function isValidObjectIdHex(id: string): boolean {
  return typeof id === 'string' && OBJECT_ID_REGEX.test(id.trim());
}

export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email is required.' };
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { valid: false, error: 'Email is required.' };
  }
  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true, value: normalized };
}

export function validateUsername(username: unknown): ValidationResult {
  if (typeof username !== 'string') {
    return { valid: false, error: 'Username is required.' };
  }
  const normalized = username.trim().toLowerCase().replace(/^@+/, '');
  if (!normalized) {
    return { valid: false, error: 'Username is required.' };
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return {
      valid: false,
      error:
        'Username must be 3–24 characters using lowercase letters, numbers, or underscores.',
    };
  }
  return { valid: true, value: normalized };
}

export function validatePassword(password: unknown): ValidationResult {
  if (typeof password !== 'string' || !password) {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < 6) {
    return {
      valid: false,
      error: 'Password must be at least 6 characters long.',
    };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long.' };
  }
  return { valid: true, value: password };
}

export function validateFullName(name: unknown): ValidationResult {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Full name is required.' };
  }
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Full name must be at least 2 characters.',
    };
  }
  if (trimmed.length > 60) {
    return {
      valid: false,
      error: 'Full name must be 60 characters or fewer.',
    };
  }
  return { valid: true, value: trimmed };
}

export function validateBio(bio: unknown): ValidationResult {
  if (bio === undefined || bio === null) {
    return { valid: true, value: '' };
  }
  if (typeof bio !== 'string') {
    return { valid: false, error: 'Bio must be text.' };
  }
  const trimmed = bio.trim();
  if (trimmed.length > 240) {
    return { valid: false, error: 'Bio must be 240 characters or fewer.' };
  }
  return { valid: true, value: trimmed };
}

export function validatePostContent(
  content: unknown,
  imageUrl?: unknown
): ValidationResult {
  const hasImage = typeof imageUrl === 'string' && imageUrl.trim().length > 0;
  const text = typeof content === 'string' ? content.trim() : '';

  if (!text && !hasImage) {
    return {
      valid: false,
      error: 'Post must contain text content or an attached image.',
    };
  }
  if (text.length > 1000) {
    return {
      valid: false,
      error: 'Post content cannot exceed 1,000 characters.',
    };
  }
  return { valid: true, value: text };
}

export function validateCommentContent(content: unknown): ValidationResult {
  if (typeof content !== 'string') {
    return { valid: false, error: 'Comment cannot be empty.' };
  }
  const trimmed = content.trim();
  if (!trimmed) {
    return { valid: false, error: 'Comment cannot be empty.' };
  }
  if (trimmed.length > 500) {
    return {
      valid: false,
      error: 'Comment cannot exceed 500 characters.',
    };
  }
  return { valid: true, value: trimmed };
}

export function validateImageFile(
  mimeType: string,
  byteLength: number
): ValidationResult<null> {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, WebP, or GIF images are supported.',
    };
  }
  if (byteLength <= 0) {
    return { valid: false, error: 'Selected image file is empty.' };
  }
  if (byteLength > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Image file must be 5 MB or smaller.' };
  }
  return { valid: true, value: null };
}
