import { ObjectId } from 'mongodb';
import { getCollections, parseObjectId, type UserDoc } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface PublicUserDTO {
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

export async function formatUserProfile(
  user: UserDoc,
  viewerId?: string,
  includeEmail = false
): Promise<PublicUserDTO> {
  const cols = getCollections();
  const viewerOid = viewerId ? parseObjectId(viewerId) : null;

  const [postsCount, followersCount, followingCount, followRecord] =
    await Promise.all([
      cols.posts.countDocuments({ authorId: user._id }),
      cols.follows.countDocuments({ followingId: user._id }),
      cols.follows.countDocuments({ followerId: user._id }),
      viewerOid && !viewerOid.equals(user._id)
        ? cols.follows.findOne({ followerId: viewerOid, followingId: user._id })
        : Promise.resolve(null),
    ]);

  return {
    id: user._id.toHexString(),
    name: user.name,
    username: user.username,
    ...(includeEmail ? { email: user.email } : {}),
    profilePicture: user.profilePicture || '',
    bio: user.bio || '',
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : String(user.createdAt),
    postsCount,
    followersCount,
    followingCount,
    isFollowing: Boolean(followRecord),
  };
}

export async function getSuggestedUsers(
  viewerId?: string,
  limit = 6
): Promise<PublicUserDTO[]> {
  const cols = getCollections();
  const viewerOid = viewerId ? parseObjectId(viewerId) : null;

  const filter: Record<string, unknown> = viewerOid
    ? { _id: { $ne: viewerOid } }
    : {};

  const users = await cols.users
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return Promise.all(users.map((u) => formatUserProfile(u, viewerId, false)));
}

export async function searchUsers(
  query: string,
  viewerId?: string,
  limit = 12
): Promise<PublicUserDTO[]> {
  const cols = getCollections();
  const safe = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (safe.length < 2) return [];

  const users = await cols.users
    .find({
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { username: { $regex: safe, $options: 'i' } },
      ],
    })
    .limit(limit)
    .toArray();

  return Promise.all(users.map((u) => formatUserProfile(u, viewerId, false)));
}

export async function getUserByIdOrThrow(userId: string): Promise<UserDoc> {
  const oid = parseObjectId(userId);
  if (!oid) {
    throw new AppError('Invalid user ID format.', 400, 'INVALID_OBJECT_ID');
  }
  const cols = getCollections();
  const user = await cols.users.findOne({ _id: oid });
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }
  return user;
}

export async function followUser(
  followerId: string,
  targetUserId: string
): Promise<{ following: boolean; followersCount: number }> {
  const followerOid = parseObjectId(followerId);
  const targetOid = parseObjectId(targetUserId);
  if (!followerOid || !targetOid) {
    throw new AppError('Invalid user ID.', 400, 'INVALID_OBJECT_ID');
  }
  if (followerOid.equals(targetOid)) {
    throw new AppError('You cannot follow yourself.', 400, 'SELF_FOLLOW');
  }

  const cols = getCollections();
  const targetUser = await cols.users.findOne({ _id: targetOid });
  if (!targetUser) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const existing = await cols.follows.findOne({
    followerId: followerOid,
    followingId: targetOid,
  });

  if (!existing) {
    await cols.follows.insertOne({
      _id: new ObjectId(),
      followerId: followerOid,
      followingId: targetOid,
      createdAt: new Date(),
    });
  }

  const followersCount = await cols.follows.countDocuments({
    followingId: targetOid,
  });
  return { following: true, followersCount };
}

export async function unfollowUser(
  followerId: string,
  targetUserId: string
): Promise<{ following: boolean; followersCount: number }> {
  const followerOid = parseObjectId(followerId);
  const targetOid = parseObjectId(targetUserId);
  if (!followerOid || !targetOid) {
    throw new AppError('Invalid user ID.', 400, 'INVALID_OBJECT_ID');
  }

  const cols = getCollections();
  await cols.follows.deleteOne({
    followerId: followerOid,
    followingId: targetOid,
  });

  const followersCount = await cols.follows.countDocuments({
    followingId: targetOid,
  });
  return { following: false, followersCount };
}

export async function getFollowersList(
  targetUserId: string,
  viewerId?: string
): Promise<PublicUserDTO[]> {
  const targetOid = parseObjectId(targetUserId);
  if (!targetOid) {
    throw new AppError('Invalid user ID.', 400, 'INVALID_OBJECT_ID');
  }
  const cols = getCollections();
  const edges = await cols.follows
    .find({ followingId: targetOid })
    .sort({ createdAt: -1 })
    .toArray();

  if (edges.length === 0) return [];
  const followerIds = edges.map((e) => e.followerId);
  const users = await cols.users.find({ _id: { $in: followerIds } }).toArray();
  return Promise.all(users.map((u) => formatUserProfile(u, viewerId, false)));
}

export async function getFollowingList(
  targetUserId: string,
  viewerId?: string
): Promise<PublicUserDTO[]> {
  const targetOid = parseObjectId(targetUserId);
  if (!targetOid) {
    throw new AppError('Invalid user ID.', 400, 'INVALID_OBJECT_ID');
  }
  const cols = getCollections();
  const edges = await cols.follows
    .find({ followerId: targetOid })
    .sort({ createdAt: -1 })
    .toArray();

  if (edges.length === 0) return [];
  const followingIds = edges.map((e) => e.followingId);
  const users = await cols.users.find({ _id: { $in: followingIds } }).toArray();
  return Promise.all(users.map((u) => formatUserProfile(u, viewerId, false)));
}
