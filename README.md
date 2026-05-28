# ChatVault 💬

A modern, full-stack real-time chat application with private and group messaging, built with a focus on premium UI and developer experience.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## ✨ Features

- **Real-time Messaging** — Instant message delivery via Socket.io
- **Private Chats** — One-on-one direct messaging
- **Group Chats** — Create rooms, add/remove members
- **User Search** — Find users by username
- **Authentication** — JWT-based with email verification & password reset
- **Paginated History** — Load older messages on scroll (20 per page)
- **Online Presence** — See who's online in real-time
- **Typing Indicators** — Know when someone is typing
- **Modern UI** — Dark mode, glassmorphism, smooth animations

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Express** | HTTP server & REST API |
| **Socket.io** | Real-time WebSocket communication |
| **Drizzle ORM** | Type-safe database queries |
| **PostgreSQL** | Persistent data storage |
| **JWT** | Authentication tokens |
| **Resend** | Transactional emails |
| **Zod** | Request validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **TanStack Query** | Server state management |
| **shadcn/ui** | Component library |
| **Tailwind CSS** | Utility-first styling |
| **React Hook Form** | Form handling |
| **Zod** | Form validation |
| **Socket.io Client** | Real-time communication |

### Shared
| Technology | Purpose |
|------------|---------|
| **@repo/shared** | Zod schemas & TypeScript types shared between frontend and backend |

## 📁 Project Structure

```
socket.io-chat-app/
├── apps/
│   ├── backend/           # Express + Socket.io API server
│   │   ├── src/
│   │   │   ├── db/        # Drizzle ORM schemas & connection
│   │   │   ├── lib/       # JWT, email utilities
│   │   │   ├── middleware/ # Auth, validation middleware
│   │   │   ├── routes/    # REST API endpoints
│   │   │   ├── socket/    # Socket.io event handlers
│   │   │   └── index.ts   # Server entry point
│   │   └── drizzle.config.ts
│   └── frontend/          # React + Vite UI
│       ├── src/
│       │   ├── components/ # UI components (shadcn/ui + custom)
│       │   ├── contexts/   # React contexts (Auth)
│       │   ├── hooks/      # Custom hooks (useSocket, useMessages, etc.)
│       │   ├── lib/        # API client, utilities
│       │   ├── pages/      # Route pages
│       │   └── socket/     # Socket.io client setup
│       └── components.json
├── packages/
│   ├── shared/            # Shared Zod schemas & types
│   ├── ui/                # Shared UI component library
│   ├── eslint-config/     # ESLint configurations
│   └── typescript-config/ # Shared TypeScript configs
├── turbo.json
└── pnpm-workspace.yaml
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9.0.0
- **PostgreSQL** ≥ 14

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd socket.io-chat-app
pnpm install
```

### 2. Configure Environment

Copy the example env file and fill in your values:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chatapp
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
RESEND_API_KEY=re_your_api_key
CLIENT_URL=http://localhost:5173
PORT=3000
EMAIL_FROM=onboarding@resend.dev
```

### 3. Set Up Database

Create a PostgreSQL database, then push the schema:

```bash
# Create database (if using psql)
createdb chatapp

# Push Drizzle schema to database
pnpm --filter @myapp/backend db:push
```

### 4. Start Development

```bash
# Start both frontend and backend
pnpm dev

# Or start individually:
pnpm --filter @myapp/backend dev   # Backend on http://localhost:3000
pnpm --filter frontend dev         # Frontend on http://localhost:5173
```

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get tokens |
| POST | `/api/auth/verify-email` | Verify email address |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user 🔒 |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=` | Search users by username 🔒 |
| GET | `/api/users/:id` | Get user profile 🔒 |

### Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms` | Create room (DM or group) 🔒 |
| GET | `/api/rooms` | List user's rooms 🔒 |
| GET | `/api/rooms/:id` | Get room details 🔒 |
| POST | `/api/rooms/:id/members` | Add member to group 🔒 |
| DELETE | `/api/rooms/:id/members/:userId` | Remove member 🔒 |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/:roomId/messages` | Get paginated messages 🔒 |

🔒 = Requires `Authorization: Bearer <token>` header

## 🔌 Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `roomId: string` | Join a chat room |
| `leave_room` | `roomId: string` | Leave a chat room |
| `send_message` | `{ roomId, content }` | Send a message |
| `typing` | `roomId: string` | Start typing indicator |
| `stop_typing` | `roomId: string` | Stop typing indicator |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `receive_message` | `Message` | New message received |
| `user_typing` | `{ roomId, userId, username }` | User started typing |
| `user_stop_typing` | `{ roomId, userId }` | User stopped typing |
| `user_online` | `userId: string` | User came online |
| `user_offline` | `userId: string` | User went offline |
| `room_updated` | `Room` | Room data changed |

## 🗄️ Database Schema

```
users
├── id (uuid, PK)
├── email (varchar, unique)
├── username (varchar, unique)
├── passwordHash (varchar)
├── isVerified (boolean)
├── createdAt (timestamp)
└── updatedAt (timestamp)

rooms
├── id (uuid, PK)
├── name (varchar, nullable)
├── isGroup (boolean)
├── createdBy (uuid, FK → users)
├── createdAt (timestamp)
└── updatedAt (timestamp)

room_members
├── id (uuid, PK)
├── roomId (uuid, FK → rooms)
├── userId (uuid, FK → users)
└── joinedAt (timestamp)

messages
├── id (uuid, PK)
├── roomId (uuid, FK → rooms)
├── senderId (uuid, FK → users)
├── content (text)
└── createdAt (timestamp)

verification_tokens
├── id (uuid, PK)
├── userId (uuid, FK → users)
├── token (varchar, unique)
├── type (varchar: 'email_verify' | 'password_reset')
├── expiresAt (timestamp)
└── createdAt (timestamp)
```

## 📜 License

MIT
