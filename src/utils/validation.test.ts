import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRelativeTime, getInitials } from './formatters';
import {
  validateImageUploadInput,
  validateLoginForm,
  validateRegisterForm,
} from './validation';

test('getInitials generates clean 1-2 character initials', () => {
  assert.equal(getInitials('Elena Vance'), 'EV');
  assert.equal(getInitials('Marcus'), 'MA');
  assert.equal(getInitials(''), 'C');
});

test('formatRelativeTime formats recent timestamps accurately', () => {
  const nowIso = new Date().toISOString();
  assert.equal(formatRelativeTime(nowIso), 'just now');

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  assert.equal(formatRelativeTime(twoHoursAgo), '2h');
});

test('validateLoginForm catches missing and invalid fields', () => {
  const err1 = validateLoginForm({ email: '', password: '' });
  assert.ok(err1.email);
  assert.ok(err1.password);

  const err2 = validateLoginForm({
    email: 'elena@connectly.app',
    password: 'Password123!',
  });
  assert.deepEqual(err2, {});
});

test('validateRegisterForm enforces name, username, email, and password', () => {
  const invalid = validateRegisterForm({
    name: 'A',
    username: 'bad-user!',
    email: 'nope',
    password: '123',
  });
  assert.ok(invalid.name);
  assert.ok(invalid.username);
  assert.ok(invalid.email);
  assert.ok(invalid.password);

  const valid = validateRegisterForm({
    name: 'Elena Vance',
    username: 'elena_vance',
    email: 'elena@connectly.app',
    password: 'Password123!',
  });
  assert.deepEqual(valid, {});
});

test('validateImageUploadInput rejects unsupported mime types and >5MB files', () => {
  assert.equal(
    validateImageUploadInput({ type: 'image/jpeg', size: 500_000 }),
    null
  );
  assert.ok(validateImageUploadInput({ type: 'text/plain', size: 100 }));
  assert.ok(
    validateImageUploadInput({ type: 'image/png', size: 6 * 1024 * 1024 })
  );
});
