import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import { env } from './env.js';

let mongoClient = null;
let cachedDb = null;
let initPromise = null;

async function ensureIndexesAndSeed() {
  const cols = getCollections();

  await cols.users.createIndex({ email: 1 }, { unique: true });
  await cols.users.createIndex({ username: 1 }, { unique: true });
  await cols.posts.createIndex({ authorId: 1, createdAt: -1 });
  await cols.posts.createIndex({ createdAt: -1 });
  await cols.comments.createIndex({ postId: 1 });
  await cols.follows.createIndex(
    { followerId: 1, followingId: 1 },
    { unique: true }
  );

  const userCount = await cols.users.countDocuments({});
  if (userCount > 0) return;

  const now = Date.now();
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const elenaId = new ObjectId();
  const marcusId = new ObjectId();
  const amaraId = new ObjectId();
  const liamId = new ObjectId();
  const priyaId = new ObjectId();

  const seedUsers = [
    {
      _id: elenaId,
      name: 'Elena Vance',
      username: 'elena_vance',
      email: 'demo@connectly.app',
      password: passwordHash,
      profilePicture: '/src/assets/images/avatar_elena_vance_1794668742030.jpg',
      bio: 'Staff Product Designer crafting design systems, editorial typography, and calm digital workspaces.',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 45),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
    },
    {
      _id: marcusId,
      name: 'Marcus Chen',
      username: 'marcus_chen',
      email: 'marcus@connectly.app',
      password: passwordHash,
      profilePicture: '/src/assets/images/avatar_marcus_chen_1794668742849.jpg',
      bio: 'Distributed systems architect & MongoDB performance enthusiast. Writing notes on APIs and edge caching.',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 60),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
    },
    {
      _id: amaraId,
      name: 'Amara Okafor',
      username: 'amara_okafor',
      email: 'amara@connectly.app',
      password: passwordHash,
      profilePicture: '/src/assets/images/avatar_amara_okafor_1794668743348.jpg',
      bio: 'VP of Engineering at Northstar Studio. Leading platform teams, mentoring builders, and shipping clean software.',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 38),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 1),
    },
    {
      _id: liamId,
      name: 'Liam Brooks',
      username: 'liam_brooks',
      email: 'liam@connectly.app',
      password: passwordHash,
      profilePicture: '',
      bio: 'Full-stack engineer focused on JavaScript, React accessibility, and zero-latency interfaces.',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 20),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
    },
    {
      _id: priyaId,
      name: 'Priya Nair',
      username: 'priya_nair',
      email: 'priya@connectly.app',
      password: passwordHash,
      profilePicture: '',
      bio: 'Product researcher exploring how online communities stay thoughtful, constructive, and signal-rich.',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 1),
    },
  ];

  for (const u of seedUsers) {
    await cols.users.insertOne(u);
  }

  const post1Id = new ObjectId();
  const post2Id = new ObjectId();
  const post3Id = new ObjectId();
  const post4Id = new ObjectId();
  const post5Id = new ObjectId();
  const post6Id = new ObjectId();

  const seedPosts = [
    {
      _id: post1Id,
      authorId: elenaId,
      content:
        'Morning studio reset before kicking off our Q4 design tokens audit. Keeping component elevation flat with 1px hairline borders made our entire feed 3x easier to scan. #DesignSystems #UIArchitecture',
      image: '/src/assets/images/post_workspace_desk_1794668744253.jpg',
      likes: [marcusId, amaraId, liamId],
      createdAt: new Date(now - 1000 * 60 * 42),
      updatedAt: new Date(now - 1000 * 60 * 42),
    },
    {
      _id: post2Id,
      authorId: marcusId,
      content:
        'Unpopular backend opinion: compounding a unique index on { followerId, followingId } in MongoDB beats application-level locking every single time. Clean constraints let your API handlers stay readable and predictable. #MongoDB #Backend',
      image: '',
      likes: [elenaId, amaraId, priyaId],
      createdAt: new Date(now - 1000 * 60 * 60 * 3),
      updatedAt: new Date(now - 1000 * 60 * 60 * 3),
    },
    {
      _id: post3Id,
      authorId: amaraId,
      content:
        'Stepped into the sunlit atrium at our Berlin engineering offsite today. Giving teams quiet physical spaces to pair on architecture diagrams has done more for velocity than any new sprint ritual. #EngineeringLeadership #ProductTeams',
      image: '/src/assets/images/post_architecture_atrium_1794668744461.jpg',
      likes: [elenaId, marcusId, liamId, priyaId],
      createdAt: new Date(now - 1000 * 60 * 60 * 7),
      updatedAt: new Date(now - 1000 * 60 * 60 * 7),
    },
    {
      _id: post4Id,
      authorId: liamId,
      content:
        'Accessibility checklist item that pays off immediately: make every icon-only action button carry a specific aria-label ("Delete post" vs "Delete"), and keep keyboard focus rings crisp across all cards. #WebPerf #JavaScript',
      image: '',
      likes: [elenaId, priyaId],
      createdAt: new Date(now - 1000 * 60 * 60 * 14),
      updatedAt: new Date(now - 1000 * 60 * 60 * 14),
    },
    {
      _id: post5Id,
      authorId: priyaId,
      content:
        'Research takeaway from 30 creator interviews: people rarely want algorithmic chaos—they want a chronological Following stream paired with intentional user search when looking for new voices. #Community #ProductResearch',
      image: '',
      likes: [amaraId, elenaId],
      createdAt: new Date(now - 1000 * 60 * 60 * 24),
      updatedAt: new Date(now - 1000 * 60 * 60 * 24),
    },
    {
      _id: post6Id,
      authorId: marcusId,
      content:
        'Quick tip on optimistic UI updates: always keep a clean snapshot of the previous state before mutating Zustand stores so network failures roll back gracefully with a single toast notification. #Frontend #Zustand',
      image: '',
      likes: [liamId],
      createdAt: new Date(now - 1000 * 60 * 60 * 36),
      updatedAt: new Date(now - 1000 * 60 * 60 * 36),
    },
  ];

  for (const p of seedPosts) {
    await cols.posts.insertOne(p);
  }

  const seedComments = [
    {
      _id: new ObjectId(),
      postId: post1Id,
      authorId: marcusId,
      content:
        'That oak desk setup is spotless. Hairline borders over heavy drop shadows completely changed how readable our dashboards feel.',
      createdAt: new Date(now - 1000 * 60 * 25),
    },
    {
      _id: new ObjectId(),
      postId: post1Id,
      authorId: amaraId,
      content: 'Agreed—tabular numerals on the counters also make a huge difference.',
      createdAt: new Date(now - 1000 * 60 * 12),
    },
    {
      _id: new ObjectId(),
      postId: post2Id,
      authorId: liamId,
      content: '100%. Letting the database enforce uniqueness prevents so many race conditions.',
      createdAt: new Date(now - 1000 * 60 * 60 * 2),
    },
    {
      _id: new ObjectId(),
      postId: post3Id,
      authorId: elenaId,
      content: 'The natural daylight in that space looks incredible for design critiques.',
      createdAt: new Date(now - 1000 * 60 * 60 * 5),
    },
  ];

  for (const c of seedComments) {
    await cols.comments.insertOne(c);
  }

  const seedFollows = [
    [elenaId, marcusId],
    [elenaId, amaraId],
    [marcusId, elenaId],
    [marcusId, amaraId],
    [amaraId, elenaId],
    [amaraId, priyaId],
    [liamId, elenaId],
    [liamId, marcusId],
    [priyaId, amaraId],
  ];

  for (const [followerId, followingId] of seedFollows) {
    await cols.follows.insertOne({
      _id: new ObjectId(),
      followerId,
      followingId,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
    });
  }
}

export async function connectDatabase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mongoUri = env.mongoUri ? env.mongoUri.trim() : '';
    if (!mongoUri) {
      throw new Error(
        'MONGODB_URI is required. Set MONGODB_URI in backend/.env to connect to MongoDB.'
      );
    }

    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    try {
      await client.connect();
      await client.db(env.mongoDbName).command({ ping: 1 });
      mongoClient = client;
      cachedDb = client.db(env.mongoDbName);
      console.log(`[DB] Connected to MongoDB (${env.mongoDbName})`);
    } catch (err) {
      await client.close().catch(() => {});
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to connect to MongoDB at MONGODB_URI (${message}).`
      );
    }

    await ensureIndexesAndSeed();
  })();

  return initPromise;
}

export function getDbMode() {
  return cachedDb ? 'mongodb' : 'disconnected';
}

export function getCollections() {
  if (!cachedDb) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return {
    users: cachedDb.collection('users'),
    posts: cachedDb.collection('posts'),
    comments: cachedDb.collection('comments'),
    follows: cachedDb.collection('follows'),
  };
}

export function parseObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function closeDatabase() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    cachedDb = null;
  }
}
