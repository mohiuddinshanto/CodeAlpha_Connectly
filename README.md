# Connectly — Full-Stack Social Media Platform

**Connectly** is a modern social media platform built for sharing posts, conversations, images, and professional networks. Designed with a clean, three-column editorial layout inspired by Threads and LinkedIn, it includes JWT authentication via HttpOnly cookies, MongoDB persistence, ImgBB image uploads, likes, comments, user search, and a follow/unfollow relationship graph.

---

## Core Features

- **Authentication & Security**: User registration, login, logout, persistent HttpOnly JWT cookie sessions, bcryptjs password hashing, and route-level authorization checks.
- **User Profiles**: Public profiles with bio, avatar, join date, posts count, followers count, following count, followers/following lists, and profile editing (own profile only).
- **Post Management (CRUD)**: Create text/image posts, edit own posts, delete own posts with confirmation dialog, and paginate feed with "Load More".
- **ImgBB Image Uploads**: Zero-Multer multipart image parsing (`busboy`) on the Express backend forwarded to the ImgBB API (`IMGBB_API_KEY` kept strictly server-side).
- **Social Interactions**: Atomic like/unlike updates, inline collapsible comment threads (create & delete own comments), and follow/unfollow relationships with duplicate prevention.
- **Discovery & Feeds**: Chronological Home/Explore feeds, personalized Following feed, interactive topic filtering, live user search, and suggested people from the database.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Zustand (`authStore`, `postStore`, `userStore`), Lucide React, React Hot Toast
- **Backend**: Node.js, Express.js (`server.ts`), MongoDB Native Driver (`mongodb`), JWT (`jsonwebtoken`), `bcryptjs`, `busboy`, ImgBB API
- **Persistence**: MongoDB Native Driver (`MONGODB_URI`), with an automatic persistent local document store fallback (`.data/connectly-db.json`) when a local MongoDB daemon is not running in sandbox environments.

---

## Database Collections & Indexes

- `users`: `_id`, `name`, `username` (unique), `email` (unique), `password`, `profilePicture`, `bio`, `createdAt`, `updatedAt`
- `posts`: `_id`, `authorId` (indexed), `content`, `image`, `likes`, `createdAt` (indexed), `updatedAt`
- `comments`: `_id`, `postId` (indexed), `authorId`, `content`, `createdAt`
- `follows`: `_id`, `followerId`, `followingId` (compound unique index `{ followerId: 1, followingId: 1 }`), `createdAt`

---

## REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user and issue HttpOnly JWT cookie
- `POST /api/auth/login` — Authenticate user and issue HttpOnly JWT cookie
- `POST /api/auth/logout` — Clear authentication cookie
- `GET /api/auth/me` — Return currently authenticated user

### Users & Follow System
- `GET /api/users` — List suggested users
- `GET /api/users/search?q=` — Search users by name or username
- `GET /api/users/:id` — Fetch public user profile & counts
- `PUT /api/users/profile` — Update authenticated user's profile
- `POST /api/users/upload-avatar` — Upload profile avatar via Express -> ImgBB
- `GET /api/users/:id/posts` — Paginated posts authored by user
- `GET /api/users/:id/followers` — List user's followers
- `GET /api/users/:id/following` — List accounts user follows
- `POST /api/users/:id/follow` — Follow a user
- `DELETE /api/users/:id/follow` — Unfollow a user

### Posts, Likes & Comments
- `POST /api/posts` — Create a post
- `GET /api/posts` — Paginated public/explore feed (`limit`, `skip`, `q`)
- `GET /api/posts/following` — Paginated feed from followed accounts
- `GET /api/posts/:id` — Fetch single post detail
- `PUT /api/posts/:id` — Update own post
- `DELETE /api/posts/:id` — Delete own post and associated comments
- `POST /api/posts/upload-image` — Upload post image via Express -> ImgBB
- `POST /api/posts/:id/like` — Atomically like a post
- `DELETE /api/posts/:id/like` — Atomically unlike a post
- `POST /api/posts/:id/comments` — Add a comment to a post
- `GET /api/posts/:id/comments` — List comments for a post
- `DELETE /api/comments/:id` — Delete own comment

---

## Local Setup

1. Copy `.env.example` to `.env` and configure `MONGODB_URI`, `JWT_SECRET`, and `IMGBB_API_KEY`.
2. Install dependencies: `npm install`
3. Run development server: `npm run dev` (starts Express + Vite on `http://localhost:3000`)
4. Run unit tests: `npm test`
5. Build for production: `npm run build` && `npm start`
