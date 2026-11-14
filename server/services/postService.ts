import { ObjectId } from 'mongodb';
import {
  getCollections,
  parseObjectId,
  type CommentDoc,
  type PostDoc,
  type UserDoc,
} from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface PostAuthorDTO {
  id: string;
  name: string;
  username: string;
  profilePicture: string;
}

export interface CommentDTO {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: PostAuthorDTO;
}

export interface PostDTO {
  id: string;
  content: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthorDTO;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

function toAuthorDTO(user: UserDoc | undefined, fallbackId: ObjectId): PostAuthorDTO {
  if (!user) {
    return {
      id: fallbackId.toHexString(),
      name: 'Connectly Member',
      username: 'member',
      profilePicture: '',
    };
  }
  return {
    id: user._id.toHexString(),
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture || '',
  };
}

export async function hydratePosts(
  posts: PostDoc[],
  viewerId?: string
): Promise<PostDTO[]> {
  if (posts.length === 0) return [];
  const cols = getCollections();
  const viewerOid = viewerId ? parseObjectId(viewerId) : null;

  const authorIds = Array.from(
    new Map(posts.map((p) => [p.authorId.toHexString(), p.authorId])).values()
  );

  const authors = await cols.users
    .find({ _id: { $in: authorIds } })
    .toArray();
  const authorMap = new Map(authors.map((a) => [a._id.toHexString(), a]));

  const postIds = posts.map((p) => p._id);
  const allComments = await cols.comments
    .find({ postId: { $in: postIds } })
    .toArray();
  const commentCounts = new Map<string, number>();
  for (const c of allComments) {
    const key = c.postId.toHexString();
    commentCounts.set(key, (commentCounts.get(key) || 0) + 1);
  }

  return posts.map((post) => {
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const isLiked = viewerOid
      ? likes.some((id) => id instanceof ObjectId && id.equals(viewerOid))
      : false;
    const author = authorMap.get(post.authorId.toHexString());
    return {
      id: post._id.toHexString(),
      content: post.content,
      image: post.image || '',
      createdAt:
        post.createdAt instanceof Date
          ? post.createdAt.toISOString()
          : String(post.createdAt),
      updatedAt:
        post.updatedAt instanceof Date
          ? post.updatedAt.toISOString()
          : String(post.updatedAt),
      author: toAuthorDTO(author, post.authorId),
      likesCount: likes.length,
      commentsCount: commentCounts.get(post._id.toHexString()) || 0,
      isLiked,
    };
  });
}

export async function hydrateComments(
  comments: CommentDoc[]
): Promise<CommentDTO[]> {
  if (comments.length === 0) return [];
  const cols = getCollections();
  const authorIds = Array.from(
    new Map(
      comments.map((c) => [c.authorId.toHexString(), c.authorId])
    ).values()
  );
  const authors = await cols.users
    .find({ _id: { $in: authorIds } })
    .toArray();
  const authorMap = new Map(authors.map((a) => [a._id.toHexString(), a]));

  return comments.map((comment) => ({
    id: comment._id.toHexString(),
    postId: comment.postId.toHexString(),
    content: comment.content,
    createdAt:
      comment.createdAt instanceof Date
        ? comment.createdAt.toISOString()
        : String(comment.createdAt),
    author: toAuthorDTO(
      authorMap.get(comment.authorId.toHexString()),
      comment.authorId
    ),
  }));
}

export async function listPosts(options: {
  viewerId?: string;
  limit: number;
  skip: number;
  topicQuery?: string;
}): Promise<{ posts: PostDTO[]; total: number; hasMore: boolean }> {
  const cols = getCollections();
  const filter: Record<string, unknown> = {};

  if (options.topicQuery && options.topicQuery.trim().length > 0) {
    const safe = options.topicQuery
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.content = { $regex: safe, $options: 'i' };
  }

  const [total, rawPosts] = await Promise.all([
    cols.posts.countDocuments(filter),
    cols.posts
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(options.skip)
      .limit(options.limit)
      .toArray(),
  ]);

  const posts = await hydratePosts(rawPosts, options.viewerId);
  return {
    posts,
    total,
    hasMore: options.skip + posts.length < total,
  };
}

export async function listFollowingPosts(options: {
  viewerId: string;
  limit: number;
  skip: number;
}): Promise<{ posts: PostDTO[]; total: number; hasMore: boolean }> {
  const viewerOid = parseObjectId(options.viewerId);
  if (!viewerOid) {
    throw new AppError('Invalid user ID.', 400, 'INVALID_OBJECT_ID');
  }
  const cols = getCollections();
  const followEdges = await cols.follows
    .find({ followerId: viewerOid })
    .toArray();
  const followedIds = followEdges.map((f) => f.followingId);

  if (followedIds.length === 0) {
    return { posts: [], total: 0, hasMore: false };
  }

  const filter = { authorId: { $in: followedIds } };
  const [total, rawPosts] = await Promise.all([
    cols.posts.countDocuments(filter),
    cols.posts
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(options.skip)
      .limit(options.limit)
      .toArray(),
  ]);

  const posts = await hydratePosts(rawPosts, options.viewerId);
  return {
    posts,
    total,
    hasMore: options.skip + posts.length < total,
  };
}

export async function listUserPosts(
  targetUserId: string,
  viewerId?: string,
  limit = 20,
  skip = 0
): Promise<{ posts: PostDTO[]; total: number; hasMore: boolean }> {
  const targetOid = parseObjectId(targetUserId);
  if (!targetOid) {
    throw new AppError('Invalid user ID.', 400, 'INVALID_OBJECT_ID');
  }
  const cols = getCollections();
  const filter = { authorId: targetOid };
  const [total, rawPosts] = await Promise.all([
    cols.posts.countDocuments(filter),
    cols.posts
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  const posts = await hydratePosts(rawPosts, viewerId);
  return {
    posts,
    total,
    hasMore: skip + posts.length < total,
  };
}

export async function getPostByIdOrThrow(postId: string): Promise<PostDoc> {
  const oid = parseObjectId(postId);
  if (!oid) {
    throw new AppError('Invalid post ID format.', 400, 'INVALID_OBJECT_ID');
  }
  const cols = getCollections();
  const post = await cols.posts.findOne({ _id: oid });
  if (!post) {
    throw new AppError('Post not found.', 404, 'POST_NOT_FOUND');
  }
  return post;
}
