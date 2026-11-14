import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId, type Db } from 'mongodb';
import { env } from './env';

export interface UserDoc {
  _id: ObjectId;
  name: string;
  username: string;
  email: string;
  password: string;
  profilePicture: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDoc {
  _id: ObjectId;
  authorId: ObjectId;
  content: string;
  image: string;
  likes: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentDoc {
  _id: ObjectId;
  postId: ObjectId;
  authorId: ObjectId;
  content: string;
  createdAt: Date;
}

export interface FollowDoc {
  _id: ObjectId;
  followerId: ObjectId;
  followingId: ObjectId;
  createdAt: Date;
}

type DocRecord = { _id: ObjectId };

interface IndexDef {
  fields: string[];
  unique?: boolean;
}

function serializeValue(val: unknown): unknown {
  if (val instanceof ObjectId) {
    return { __oid: val.toHexString() };
  }
  if (val instanceof Date) {
    return { __date: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return val.map(serializeValue);
  }
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  return val;
}

function deserializeValue(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map(deserializeValue);
  }
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj.__oid === 'string' && Object.keys(obj).length === 1) {
      return new ObjectId(obj.__oid);
    }
    if (typeof obj.__date === 'string' && Object.keys(obj).length === 1) {
      return new Date(obj.__date);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = deserializeValue(v);
    }
    return out;
  }
  return val;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof ObjectId && b instanceof ObjectId) {
    return a.toHexString() === b.toHexString();
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  return a === b;
}

function matchesFilter(doc: DocRecord, filter: Record<string, unknown>): boolean {
  for (const [key, cond] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(cond)) {
      const anyMatch = cond.some((sub) =>
        matchesFilter(doc, sub as Record<string, unknown>)
      );
      if (!anyMatch) return false;
      continue;
    }

    const docVal = (doc as Record<string, unknown>)[key];

    if (
      cond &&
      typeof cond === 'object' &&
      !(cond instanceof ObjectId) &&
      !(cond instanceof Date) &&
      !(cond instanceof RegExp)
    ) {
      const ops = cond as Record<string, unknown>;
      if ('$in' in ops && Array.isArray(ops.$in)) {
        const list = ops.$in;
        if (Array.isArray(docVal)) {
          if (!docVal.some((item) => list.some((t) => valuesEqual(item, t)))) {
            return false;
          }
        } else if (!list.some((t) => valuesEqual(docVal, t))) {
          return false;
        }
      }
      if ('$ne' in ops) {
        if (valuesEqual(docVal, ops.$ne)) return false;
      }
      if ('$regex' in ops) {
        const flags = typeof ops.$options === 'string' ? ops.$options : '';
        const regex =
          ops.$regex instanceof RegExp
            ? ops.$regex
            : new RegExp(String(ops.$regex), flags);
        if (typeof docVal !== 'string' || !regex.test(docVal)) return false;
      }
      continue;
    }

    if (Array.isArray(docVal)) {
      if (!docVal.some((item) => valuesEqual(item, cond))) return false;
    } else if (!valuesEqual(docVal, cond)) {
      return false;
    }
  }
  return true;
}

class LocalCursor<T extends DocRecord> {
  private items: T[];
  private sortSpec: Record<string, 1 | -1> | null = null;
  private skipCount = 0;
  private limitCount: number | null = null;

  constructor(items: T[]) {
    this.items = items;
  }

  sort(spec: Record<string, 1 | -1>): this {
    this.sortSpec = spec;
    return this;
  }

  skip(n: number): this {
    this.skipCount = Math.max(0, n);
    return this;
  }

  limit(n: number): this {
    this.limitCount = Math.max(0, n);
    return this;
  }

  async toArray(): Promise<T[]> {
    let result = [...this.items];
    if (this.sortSpec) {
      const entries = Object.entries(this.sortSpec);
      result.sort((a, b) => {
        for (const [field, dir] of entries) {
          const av = (a as Record<string, unknown>)[field];
          const bv = (b as Record<string, unknown>)[field];
          const aNum =
            av instanceof Date ? av.getTime() : typeof av === 'number' ? av : 0;
          const bNum =
            bv instanceof Date ? bv.getTime() : typeof bv === 'number' ? bv : 0;
          if (aNum !== bNum) return (aNum - bNum) * dir;
          const aStr = String(av ?? '');
          const bStr = String(bv ?? '');
          if (aStr !== bStr) return aStr.localeCompare(bStr) * dir;
        }
        return 0;
      });
    }
    if (this.skipCount > 0) {
      result = result.slice(this.skipCount);
    }
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }
    return result;
  }
}

class LocalCollection<T extends DocRecord> {
  private docs: T[] = [];
  private indexes: IndexDef[] = [];
  private onPersist: () => void;

  constructor(initialDocs: T[], onPersist: () => void) {
    this.docs = initialDocs;
    this.onPersist = onPersist;
  }

  dumpRaw(): unknown[] {
    return this.docs.map((d) => serializeValue(d));
  }

  async createIndex(
    spec: Record<string, 1 | -1>,
    options?: { unique?: boolean }
  ): Promise<string> {
    const fields = Object.keys(spec);
    const exists = this.indexes.some(
      (idx) =>
        idx.fields.length === fields.length &&
        idx.fields.every((f, i) => f === fields[i])
    );
    if (!exists) {
      this.indexes.push({ fields, unique: options?.unique });
    }
    return fields.join('_');
  }

  private assertUnique(candidate: T, ignoreId?: ObjectId): void {
    for (const idx of this.indexes) {
      if (!idx.unique) continue;
      for (const existing of this.docs) {
        if (ignoreId && valuesEqual(existing._id, ignoreId)) continue;
        const collision = idx.fields.every((f) =>
          valuesEqual(
            (existing as Record<string, unknown>)[f],
            (candidate as Record<string, unknown>)[f]
          )
        );
        if (collision) {
          const err = new Error('E11000 duplicate key error') as Error & {
            code: number;
            keyPattern: Record<string, number>;
          };
          err.code = 11000;
          err.keyPattern = Object.fromEntries(idx.fields.map((f) => [f, 1]));
          throw err;
        }
      }
    }
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    const found = this.docs.find((d) => matchesFilter(d, filter));
    return found ? ({ ...found } as T) : null;
  }

  find(filter: Record<string, unknown> = {}): LocalCursor<T> {
    const matched = this.docs
      .filter((d) => matchesFilter(d, filter))
      .map((d) => ({ ...d } as T));
    return new LocalCursor<T>(matched);
  }

  async insertOne(doc: Omit<T, '_id'> & { _id?: ObjectId }): Promise<{ insertedId: ObjectId }> {
    const _id = doc._id instanceof ObjectId ? doc._id : new ObjectId();
    const fullDoc = { ...doc, _id } as T;
    this.assertUnique(fullDoc);
    this.docs.push(fullDoc);
    this.onPersist();
    return { insertedId: _id };
  }

  async updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const idx = this.docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };

    const next = { ...this.docs[idx] } as Record<string, unknown>;

    if (update.$set && typeof update.$set === 'object') {
      for (const [k, v] of Object.entries(update.$set)) {
        next[k] = v;
      }
    }
    if (update.$addToSet && typeof update.$addToSet === 'object') {
      for (const [k, v] of Object.entries(update.$addToSet)) {
        const arr = Array.isArray(next[k]) ? [...(next[k] as unknown[])] : [];
        if (!arr.some((item) => valuesEqual(item, v))) {
          arr.push(v);
        }
        next[k] = arr;
      }
    }
    if (update.$pull && typeof update.$pull === 'object') {
      for (const [k, v] of Object.entries(update.$pull)) {
        const arr = Array.isArray(next[k]) ? (next[k] as unknown[]) : [];
        next[k] = arr.filter((item) => !valuesEqual(item, v));
      }
    }

    const updatedDoc = next as T;
    this.assertUnique(updatedDoc, updatedDoc._id);
    this.docs[idx] = updatedDoc;
    this.onPersist();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(
    filter: Record<string, unknown>
  ): Promise<{ deletedCount: number }> {
    const idx = this.docs.findIndex((d) => matchesFilter(d, filter));
    if (idx === -1) return { deletedCount: 0 };
    this.docs.splice(idx, 1);
    this.onPersist();
    return { deletedCount: 1 };
  }

  async deleteMany(
    filter: Record<string, unknown>
  ): Promise<{ deletedCount: number }> {
    const before = this.docs.length;
    this.docs = this.docs.filter((d) => !matchesFilter(d, filter));
    const deletedCount = before - this.docs.length;
    if (deletedCount > 0) this.onPersist();
    return { deletedCount };
  }

  async countDocuments(filter: Record<string, unknown> = {}): Promise<number> {
    return this.docs.filter((d) => matchesFilter(d, filter)).length;
  }
}

class LocalFileDatabase {
  private filePath: string;
  private collections = new Map<string, LocalCollection<DocRecord>>();

  constructor(filePath: string) {
    this.filePath = filePath;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      return;
    }
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Record<string, unknown[]>;
      for (const [name, list] of Object.entries(parsed)) {
        const hydrated = list.map((item) => deserializeValue(item) as DocRecord);
        this.collections.set(
          name,
          new LocalCollection<DocRecord>(hydrated, () => this.persist())
        );
      }
    } catch (err) {
      console.warn('[DB] Failed to load local store, starting fresh:', err);
    }
  }

  private persist(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const payload: Record<string, unknown[]> = {};
    for (const [name, col] of this.collections.entries()) {
      payload[name] = col.dumpRaw();
    }
    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.filePath);
  }

  collection<T extends DocRecord>(name: string): LocalCollection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(
        name,
        new LocalCollection<DocRecord>([], () => this.persist())
      );
    }
    return this.collections.get(name)! as unknown as LocalCollection<T>;
  }
}

export interface ConnectlyCollections {
  users: LocalCollection<UserDoc> | ReturnType<Db['collection']>;
  posts: LocalCollection<PostDoc> | ReturnType<Db['collection']>;
  comments: LocalCollection<CommentDoc> | ReturnType<Db['collection']>;
  follows: LocalCollection<FollowDoc> | ReturnType<Db['collection']>;
}

let mongoClient: MongoClient | null = null;
let activeMode: 'mongodb' | 'local-store' = 'local-store';
let cachedDb: Db | LocalFileDatabase | null = null;
let initPromise: Promise<void> | null = null;

async function ensureIndexesAndSeed(): Promise<void> {
  const cols = getCollections();

  await cols.users.createIndex({ email: 1 }, { unique: true });
  await cols.users.createIndex({ username: 1 }, { unique: true });
  await cols.posts.createIndex({ authorId: 1 });
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

  const seedUsers: UserDoc[] = [
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
      bio: 'Full-stack engineer focused on TypeScript, React accessibility, and zero-latency interfaces.',
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

  const seedPosts: PostDoc[] = [
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
        'Accessibility checklist item that pays off immediately: make every icon-only action button carry a specific aria-label ("Delete post" vs "Delete"), and keep keyboard focus rings crisp across all cards. #WebPerf #TypeScript',
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

  const seedComments: CommentDoc[] = [
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

  const seedFollows: Array<[ObjectId, ObjectId]> = [
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

export async function connectDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (env.mongoUri && env.mongoUri.trim().length > 0) {
      try {
        const client = new MongoClient(env.mongoUri, {
          serverSelectionTimeoutMS: 2500,
          connectTimeoutMS: 2500,
        });
        await client.connect();
        await client.db(env.mongoDbName).command({ ping: 1 });
        mongoClient = client;
        cachedDb = client.db(env.mongoDbName);
        activeMode = 'mongodb';
        console.log(`[DB] Connected to MongoDB (${env.mongoDbName})`);
      } catch (err) {
        console.warn(
          '[DB] MongoDB unreachable at MONGODB_URI, using persistent local document store:',
          err instanceof Error ? err.message : err
        );
      }
    }

    if (!cachedDb) {
      const storePath = path.resolve(process.cwd(), '.data', 'connectly-db.json');
      cachedDb = new LocalFileDatabase(storePath);
      activeMode = 'local-store';
      console.log(`[DB] Using persistent MongoDB-compatible store at ${storePath}`);
    }

    await ensureIndexesAndSeed();
  })();

  return initPromise;
}

export function getDbMode(): 'mongodb' | 'local-store' {
  return activeMode;
}

export function getCollections() {
  if (!cachedDb) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  if (cachedDb instanceof LocalFileDatabase) {
    return {
      users: cachedDb.collection<UserDoc>('users'),
      posts: cachedDb.collection<PostDoc>('posts'),
      comments: cachedDb.collection<CommentDoc>('comments'),
      follows: cachedDb.collection<FollowDoc>('follows'),
    };
  }
  return {
    users: cachedDb.collection<UserDoc>('users'),
    posts: cachedDb.collection<PostDoc>('posts'),
    comments: cachedDb.collection<CommentDoc>('comments'),
    follows: cachedDb.collection<FollowDoc>('follows'),
  };
}

export function parseObjectId(id: string): ObjectId | null {
  if (!ObjectId.isValid(id)) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function closeDatabase(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
}
