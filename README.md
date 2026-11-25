# KMUTT Lost & Found

A web app for KMUTT students and staff to post lost or found items, claim items, and arrange handover.

- **Client:** React + Vite + React Router
- **Server:** Node.js + Express, JWT auth, Multer image uploads
- **Database:** PostgreSQL

## Project Structure

```
web-kmutt-lost-found/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # Shared UI (navbar, buttons, cards, modals...)
│       ├── pages/          # Login, Register, Listpost, PostDetail, CreatePost, Map, Profile...
│       │   └── requests/   # Claim / review / received request pages
│       ├── services/       # Claim and notification logic
│       └── api.js          # fetch wrapper for /api
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.js        # App entry, serves /api and /uploads
│   │   ├── db.js           # PostgreSQL pool
│   │   ├── middleware/     # requireAuth (JWT)
│   │   └── routes/         # auth, posts, verify, locations, me
│   ├── db/
│   │   ├── schema.sql      # Full schema (drops and recreates tables)
│   │   └── migrations/     # Incremental changes for existing databases
│   └── uploads/            # Uploaded images
└── docs/                   # Planning notes
```

## Installation

### Requirements

- Node.js 20.6+ (uses `--env-file`)
- PostgreSQL

### 1. Database

```bash
createdb -U postgres lostfound
cd server
npm run db:reset   # create tables (wipes existing data)
```

### 2. Server

```bash
cd server
npm install
cp .env.example .env   # then set DATABASE_URL and JWT_SECRET
npm run dev            # http://localhost:3000
```

### 3. Client

```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:3000`, so start the server first.
