const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateLoginForm(values) {
  const errors = {};
  const email = (values.email || '').trim().toLowerCase();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

export function validateRegisterForm(values) {
  const errors = {};
  const name = (values.name || '').trim();
  const username = (values.username || '').trim().toLowerCase().replace(/^@+/, '');
  const email = (values.email || '').trim().toLowerCase();

  if (name.length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  } else if (name.length > 60) {
    errors.name = 'Full name must be 60 characters or fewer.';
  }

  if (!username) {
    errors.username = 'Username is required.';
  } else if (!USERNAME_REGEX.test(username)) {
    errors.username =
      'Use 3–24 lowercase letters, numbers, or underscores.';
  }

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
}

export function validateImageUploadInput(file) {
  if (!ALLOWED_IMAGE_TYPES.has((file.type || '').toLowerCase())) {
    return 'Please select a JPEG, PNG, WebP, or GIF image.';
  }
  if (file.size <= 0) {
    return 'Selected file is empty.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image size must be 5 MB or smaller.';
  }
  return null;
}
