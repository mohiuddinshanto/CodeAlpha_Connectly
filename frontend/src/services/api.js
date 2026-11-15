const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : `Request failed with status ${res.status}`;
    throw new ApiError(
      message,
      res.status,
      typeof data.code === 'string' ? data.code : undefined
    );
  }

  return data;
}

export const authApi = {
  register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  login(payload) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  logout() {
    return request('/auth/logout', { method: 'POST' });
  },
  me() {
    return request('/auth/me');
  },
};

export const usersApi = {
  listSuggested(limit = 6) {
    return request(`/users?limit=${limit}`);
  },
  search(q) {
    return request(`/users/search?q=${encodeURIComponent(q)}`);
  },
  getProfile(userId) {
    return request(`/users/${userId}`);
  },
  updateProfile(payload) {
    return request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  getUserPosts(userId, limit = 20, skip = 0) {
    return request(`/users/${userId}/posts?limit=${limit}&skip=${skip}`);
  },
  getFollowers(userId, limit = 50, skip = 0) {
    return request(`/users/${userId}/followers?limit=${limit}&skip=${skip}`);
  },
  getFollowing(userId, limit = 50, skip = 0) {
    return request(`/users/${userId}/following?limit=${limit}&skip=${skip}`);
  },
  uploadAvatar(file) {
    const formData = new FormData();
    formData.append('image', file);
    return request('/users/upload-avatar', {
      method: 'POST',
      body: formData,
    });
  },
  follow(userId) {
    return request(`/users/${userId}/follow`, { method: 'POST' });
  },
  unfollow(userId) {
    return request(`/users/${userId}/follow`, { method: 'DELETE' });
  },
};

export const postsApi = {
  listAll(limit = 10, skip = 0, q = '') {
    const params = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    });
    if (q.trim()) params.set('q', q.trim());
    return request(`/posts?${params.toString()}`);
  },
  listFollowing(limit = 10, skip = 0) {
    return request(`/posts/following?limit=${limit}&skip=${skip}`);
  },
  getById(postId) {
    return request(`/posts/${postId}`);
  },
  create(payload) {
    return request('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(postId, payload) {
    return request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  remove(postId) {
    return request(`/posts/${postId}`, { method: 'DELETE' });
  },
  uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return request('/posts/upload-image', {
      method: 'POST',
      body: formData,
    });
  },
  like(postId) {
    return request(`/posts/${postId}/like`, { method: 'POST' });
  },
  unlike(postId) {
    return request(`/posts/${postId}/like`, { method: 'DELETE' });
  },
  getLikes(postId, limit = 50, skip = 0) {
    return request(`/posts/${postId}/likes?limit=${limit}&skip=${skip}`);
  },
  getComments(postId, limit = 50, skip = 0) {
    return request(`/posts/${postId}/comments?limit=${limit}&skip=${skip}`);
  },
  addComment(postId, content, parentCommentId) {
    return request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        ...(parentCommentId ? { parentCommentId } : {}),
      }),
    });
  },
  deleteComment(commentId) {
    return request(`/comments/${commentId}`, { method: 'DELETE' });
  },
};

export const friendsApi = {
  getAll() {
    return request('/friends');
  },
  getRequests() {
    return request('/friends/requests');
  },
  getStatus(userId) {
    return request(`/friends/status/${userId}`);
  },
  sendRequest(userId) {
    return request(`/friends/requests/${userId}`, { method: 'POST' });
  },
  acceptRequest(requestId) {
    return request(`/friends/requests/${requestId}/accept`, {
      method: 'POST',
    });
  },
  removeRequest(requestId) {
    return request(`/friends/requests/${requestId}`, { method: 'DELETE' });
  },
};

export const chatsApi = {
  getUnreadCount() {
    return request('/chats/unread-count');
  },
  markRead(conversationId) {
    return request(`/chats/${conversationId}/read`, { method: 'POST' });
  },
  getConversation(conversationId) {
    return request(`/chats/${conversationId}`);
  },
  getMessages(conversationId, limit = 50, skip = 0) {
    return request(
      `/chats/${conversationId}/messages?limit=${limit}&skip=${skip}`
    );
  },
  getSocketTicket() {
    return request('/chats/socket-ticket', { method: 'POST' });
  },
};
