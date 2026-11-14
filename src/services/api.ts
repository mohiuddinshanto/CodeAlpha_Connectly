import type { CommentItem, PostItem, UserProfile } from '../types';

const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
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

  return data as T;
}

export const authApi = {
  register(payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    profilePicture?: string;
  }) {
    return request<{ success: boolean; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return request<{ success: boolean; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  logout() {
    return request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },
  me() {
    return request<{ success: boolean; user: UserProfile }>('/auth/me');
  },
};

export const usersApi = {
  listSuggested(limit = 6) {
    return request<{ success: boolean; users: UserProfile[] }>(
      `/users?limit=${limit}`
    );
  },
  search(q: string) {
    return request<{ success: boolean; users: UserProfile[] }>(
      `/users/search?q=${encodeURIComponent(q)}`
    );
  },
  getProfile(userId: string) {
    return request<{ success: boolean; user: UserProfile }>(`/users/${userId}`);
  },
  updateProfile(payload: {
    name?: string;
    bio?: string;
    profilePicture?: string;
  }) {
    return request<{ success: boolean; user: UserProfile }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  getUserPosts(userId: string, limit = 20, skip = 0) {
    return request<{
      success: boolean;
      posts: PostItem[];
      total: number;
      hasMore: boolean;
    }>(`/users/${userId}/posts?limit=${limit}&skip=${skip}`);
  },
  getFollowers(userId: string) {
    return request<{ success: boolean; users: UserProfile[] }>(
      `/users/${userId}/followers`
    );
  },
  getFollowing(userId: string) {
    return request<{ success: boolean; users: UserProfile[] }>(
      `/users/${userId}/following`
    );
  },
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ success: boolean; imageUrl: string }>(
      '/users/upload-avatar',
      {
        method: 'POST',
        body: formData,
      }
    );
  },
  follow(userId: string) {
    return request<{
      success: boolean;
      following: boolean;
      followersCount: number;
    }>(`/users/${userId}/follow`, {
      method: 'POST',
    });
  },
  unfollow(userId: string) {
    return request<{
      success: boolean;
      following: boolean;
      followersCount: number;
    }>(`/users/${userId}/follow`, {
      method: 'DELETE',
    });
  },
};

export const postsApi = {
  listAll(limit = 10, skip = 0, q = '') {
    const params = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
    });
    if (q.trim()) params.set('q', q.trim());
    return request<{
      success: boolean;
      posts: PostItem[];
      total: number;
      hasMore: boolean;
    }>(`/posts?${params.toString()}`);
  },
  listFollowing(limit = 10, skip = 0) {
    return request<{
      success: boolean;
      posts: PostItem[];
      total: number;
      hasMore: boolean;
    }>(`/posts/following?limit=${limit}&skip=${skip}`);
  },
  create(payload: { content: string; image?: string }) {
    return request<{ success: boolean; post: PostItem }>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(postId: string, payload: { content: string; image?: string }) {
    return request<{ success: boolean; post: PostItem }>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  remove(postId: string) {
    return request<{ success: boolean; deletedId: string }>(
      `/posts/${postId}`,
      {
        method: 'DELETE',
      }
    );
  },
  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ success: boolean; imageUrl: string }>(
      '/posts/upload-image',
      {
        method: 'POST',
        body: formData,
      }
    );
  },
  like(postId: string) {
    return request<{
      success: boolean;
      isLiked: boolean;
      likesCount: number;
    }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },
  unlike(postId: string) {
    return request<{
      success: boolean;
      isLiked: boolean;
      likesCount: number;
    }>(`/posts/${postId}/like`, {
      method: 'DELETE',
    });
  },
  getComments(postId: string) {
    return request<{ success: boolean; comments: CommentItem[] }>(
      `/posts/${postId}/comments`
    );
  },
  addComment(postId: string, content: string) {
    return request<{
      success: boolean;
      comment: CommentItem;
      commentsCount: number;
    }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
  deleteComment(commentId: string) {
    return request<{
      success: boolean;
      deletedId: string;
      postId: string;
      commentsCount: number;
    }>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};
