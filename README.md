# Connectly — CodeAlpha_SocialMediaPlatform

**Connectly** is a full-stack social media platform built for sharing posts, conversations, images, and professional networks. Designed with a clean three-column editorial layout, it uses a Next.js App Router frontend in JavaScript and a separate Express.js REST API backed by the MongoDB Native Driver, HttpOnly JWT cookie authentication, and ImgBB image hosting.

Repository Name: `CodeAlpha_SocialMediaPlatform`

---

## Features

- **Authentication & Sessions**: Registration, login, logout, persistent HttpOnly JWT cookie sessions, `bcryptjs` password hashing, and protected route redirects (`/following`, `/profile`, `/settings`).
- **User Profiles & Follow Graph**: Public profiles (`/profile/[id]`) displaying bio, avatar, join date, post/follower/following counts, interactive followers/following lists, and profile editing (own profile only).
- **Posts CRUD & Pagination**: Create text/image posts, edit and delete own posts with confirmation dialog, view single-post thread pages (`/post/[id]`), and paginate feeds with **Load More**.
- **ImgBB Image Uploads**: Multipart upload parsing (`busboy`) on the Express backend forwarded to the ImgBB API (`IMGBB_API_KEY` stored strictly server-side); only the returned image URL is saved to MongoDB.
- **Social Interactions**: Atomic like/unlike updates with a liker list, threaded replies to comments, inline collapsible discussions, and follow/unfollow relationships enforced by compound unique indexes.
- **Discovery & Search**: Chronological Home feed (`/home`), Explore Community (`/explore`) with topic filtering and suggested creators, personalized Following feed (`/following`), and live user search.
- **Responsive Layout**: Three-column desktop dashboard (`LeftSidebar` + Feed + `RightSidebar`), two-column tablet layout (right discovery sidebar hidden, inline search shown), and single-column mobile layout with sticky header and fixed bottom navigation.

---

## Tech Stack

- **Frontend (`frontend/`)**: Next.js 15 (App Router, JavaScript), React 19, Tailwind CSS v4, HeroUI (`@heroui/react`), Zustand (`authStore`, `postStore`, `userStore`), Lucide React, React Hot Toast
- **Backend (`backend/`)**: Node.js, Express.js, MongoDB Native Driver (`mongodb`), JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `busboy`, `cors`, `cookie-parser`, ImgBB API

---

## Folder Structure

```text
CodeAlpha_SocialMediaPlatform/
├── backend/
│   ├── config/
│   │   ├── database.js         # MongoDB Native Driver connection & index setup
│   │   └── env.js              # Server environment configuration
│   ├── controllers/
│   │   ├── authController.js   # Register, login, logout, /me
│   │   ├── postController.js   # Posts CRUD, likes, comments, image upload
│   │   └── userController.js   # Profiles, search, follow/unfollow, avatar upload
│   ├── middleware/
│   │   ├── auth.js             # HttpOnly JWT cookie signing & auth guards
│   │   └── errorHandler.js     # Centralized Express error handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── postService.js
│   │   ├── uploadService.js    # Busboy multipart parser + ImgBB upload
│   │   └── userService.js
│   ├── validators/
│   │   └── index.js
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   └── validators.test.js
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.jsx
│   │   │   │   └── register/page.jsx
│   │   │   ├── (main)/
│   │   │   │   ├── layout.jsx
│   │   │   │   ├── home/page.jsx
│   │   │   │   ├── explore/page.jsx
│   │   │   │   ├── following/page.jsx
│   │   │   │   ├── profile/page.jsx
│   │   │   │   ├── profile/[id]/page.jsx
│   │   │   │   ├── settings/page.jsx
│   │   │   │   └── post/[id]/page.jsx
│   │   │   ├── globals.css
│   │   │   ├── layout.jsx
│   │   │   ├── not-found.jsx
│   │   │   ├── page.jsx
│   │   │   └── providers.jsx
│   │   ├── components/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── postStore.js
│   │   │   └── userStore.js
│   │   └── utils/
│   ├── .env.example
│   ├── next.config.mjs
│   ├── package.json
│   └── postcss.config.mjs
├── .gitignore
├── package.json                # Root concurrently dev/start/build/test scripts
└── README.md
```

The tree omits some package metadata for readability. Each package directory has its own `package-lock.json`, and `backend/middleware/` also contains `originGuard.js`.

---

## Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/CodeAlpha_SocialMediaPlatform.git
   cd CodeAlpha_SocialMediaPlatform
   ```

2. **Configure environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
   Fill in `MONGODB_URI`, `JWT_SECRET`, and `IMGBB_API_KEY` in `backend/.env`.

3. **Install dependencies**:
   ```bash
   npm install
   npm --prefix backend install
   npm --prefix frontend install
   ```

4. **Run in development**:
   ```bash
   npm run dev
   ```
   - Frontend (Next.js): `http://localhost:3000`
   - Backend (Express API): `http://127.0.0.1:5000` (proxied automatically via `/api/*` rewrite in `frontend/next.config.mjs`)

5. **Run backend unit tests & production build**:
   ```bash
   npm test
   npm run build
   npm start
   ```

---

## Environment Variables

### `backend/.env.example`

| Variable | Description | Example / Default |
| --- | --- | --- |
| `PORT` | Express API listening port | `5000` |
| `MONGODB_URI` | MongoDB connection string (required) | `mongodb+srv://...` |
| `MONGODB_DB_NAME` | Target MongoDB database name | `connectly` |
| `JWT_SECRET` | Secret key for signing JWT cookies (required) | `your-random-secret` |
| `CLIENT_URL` | Allowed CORS origin(s) | `http://localhost:3000` |
| `IMGBB_API_KEY` | Server-side ImgBB upload API key (required) | `your-imgbb-key` |
| `CROSS_SITE_COOKIES` | Set to `true` only when frontend and API are on different sites; enables `SameSite=None; Secure` | `false` |

### `frontend/.env.example`

| Variable | Description | Default |
| --- | --- | --- |
| `API_URL` | Server-side backend API base URL used by the Next.js proxy | `http://localhost:5000/api` |

---

## MongoDB Collections & Indexes

- `users`: `{ email: 1 }` (unique), `{ username: 1 }` (unique)
- `posts`: `{ authorId: 1, createdAt: -1 }`, `{ createdAt: -1 }`
- `comments`: `{ postId: 1 }`
- `follows`: `{ followerId: 1, followingId: 1 }` (unique), `{ followingId: 1, createdAt: -1 }`

---

## API Endpoint Table

### Health & Authentication
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API health & MongoDB connection mode |
| `POST` | `/api/auth/register` | Public | Register account and set HttpOnly JWT cookie |
| `POST` | `/api/auth/login` | Public | Authenticate user and set HttpOnly JWT cookie |
| `POST` | `/api/auth/logout` | Public | Clear authentication cookie |
| `GET` | `/api/auth/me` | Required | Get currently authenticated user |

### Users & Follow System
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/users` | Optional | List suggested users |
| `GET` | `/api/users/search?q=` | Optional | Search users by name or username |
| `PUT` | `/api/users/profile` | Required | Update own profile (`name`, `bio`, `profilePicture`) |
| `POST` | `/api/users/upload-avatar` | Required | Upload avatar via Express -> ImgBB |
| `GET` | `/api/users/:id` | Optional | Fetch public profile and counts |
| `GET` | `/api/users/:id/posts` | Optional | Paginated posts authored by user |
| `GET` | `/api/users/:id/followers` | Optional | Paginated followers (`limit`, `skip`; default 50, max 100) |
| `GET` | `/api/users/:id/following` | Optional | Paginated following (`limit`, `skip`; default 50, max 100) |
| `POST` | `/api/users/:id/follow` | Required | Follow a user |
| `DELETE` | `/api/users/:id/follow` | Required | Unfollow a user |

### Posts, Likes & Comments
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/posts` | Optional | Paginated public/explore feed (`limit`, `skip`, `q`) |
| `GET` | `/api/posts/following` | Required | Paginated feed from followed accounts |
| `POST` | `/api/posts` | Required | Create a new post |
| `POST` | `/api/posts/upload-image` | Required | Upload post image via Express -> ImgBB |
| `GET` | `/api/posts/:id` | Optional | Fetch single post detail |
| `PUT` | `/api/posts/:id` | Required (Owner) | Update own post |
| `DELETE` | `/api/posts/:id` | Required (Owner) | Delete own post and its comments |
| `POST` | `/api/posts/:id/like` | Required | Atomically like a post |
| `DELETE` | `/api/posts/:id/like` | Required | Atomically unlike a post |
| `GET` | `/api/posts/:id/likes` | Optional | Paginated list of users who liked a post (`limit`, `skip`) |
| `GET` | `/api/posts/:id/comments` | Optional | Paginated comments (`limit`, `skip`; default 50, max 100) |
| `POST` | `/api/posts/:id/comments` | Required | Add a comment or a reply to a top-level comment (`parentCommentId`) |
| `DELETE` | `/api/comments/:id` | Required (Owner) | Delete own comment |

---

## Troubleshooting

- **Missing Environment Variables (`JWT_SECRET`, `IMGBB_API_KEY`, or `MONGODB_URI is required`)**:
  Ensure `backend/.env` exists (copied from `backend/.env.example`) and all three required variables are populated with non-empty values.
- **MongoDB Connection Failed (`ECONNREFUSED` or `ServerSelectionError`)**:
  Verify your local `mongod` service is running or your MongoDB Atlas URI is valid, your IP is allowlisted in Atlas Network Access, and `MONGODB_URI` is reachable from the backend host.
- **CORS or Cookie Session Not Persisting**:
  - Set `API_URL` in `frontend/.env.local` to the backend URL ending in `/api`; browser requests go to the same-origin `/api` path and are proxied by Next.js.
  - Ensure `CLIENT_URL` in `backend/.env` matches the exact frontend origin (e.g. `http://localhost:3000`).
  - Cookies default to `SameSite=Lax`; set `CROSS_SITE_COOKIES=true` only when frontend and API are cross-site. That setting requires HTTPS and uses `SameSite=None; Secure`.
  - State-changing requests with an `Origin` header must match one of the comma-separated `CLIENT_URL` origins. Requests without an Origin header are allowed for command-line clients.

### Windows PowerShell commands

After completing setup and filling in `backend/.env`, run:

```powershell
npm run dev
npm run build
npm start
```

## Screenshots

| Home feed (desktop) | Explore search (desktop) |
| --- | --- |
| ![Home feed at desktop size](./docs/screenshots/home-feed-desktop.png) | ![Explore search at desktop size](./docs/screenshots/explore-search-desktop.png) |

| Profile (desktop) | Home feed (mobile) |
| --- | --- |
| ![Profile at desktop size](./docs/screenshots/profile-desktop.png) | ![Home feed at 375px with bottom navigation](./docs/screenshots/mobile-feed-375.png) |
