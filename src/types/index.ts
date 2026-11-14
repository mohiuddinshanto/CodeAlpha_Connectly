export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  profilePicture: string;
  bio: string;
  createdAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  profilePicture: string;
}

export interface PostItem {
  id: string;
  content: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface CommentItem {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: PostAuthor;
}

export type FeedTab = 'home' | 'explore' | 'following';

export type AppView =
  | { type: 'feed'; tab: FeedTab }
  | { type: 'profile'; userId: string }
  | { type: 'settings' };
