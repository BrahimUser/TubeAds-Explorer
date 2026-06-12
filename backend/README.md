# Marketplace Backend API

Express + MySQL + Prisma replacement for Firebase (web app only).

## Stack

- Node.js, Express 5
- MySQL 8 (Docker)
- Prisma ORM
- JWT authentication (access + refresh tokens)
- bcrypt, multer, helmet, cors, express-validator, morgan

## Quick start

### 1. Start MySQL

```bash
cd backend
cp .env.example .env   # edit secrets if needed
docker compose up -d
```

Wait until healthy: `docker compose ps`

### 2. Install & migrate

```bash
npm install
npx prisma migrate dev
npx prisma db seed
```

### 3. Run API (port 3002)

```bash
npm run dev
```

### 4. Start React frontend (port 3000)

```bash
cd ..
REACT_APP_API_URL=http://localhost:3002/api npm start
```

## Environment variables

See [.env.example](.env.example).

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `3002`) |
| `DATABASE_URL` | MySQL connection string |
| `CORS_ORIGIN` | React app origin (`http://localhost:3000`) |
| `JWT_ACCESS_SECRET` | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `SUPER_ADMIN_PHONE` | Seeded admin phone (E.164) |
| `SUPER_ADMIN_PASSWORD` | Seeded admin password |

Default super admin after seed: phone `600000000` (Morocco) / password `admin123456`

## API base URL

`http://localhost:3002/api`

## Response format

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error:**
```json
{ "success": false, "message": "...", "errors": [] }
```

## Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register with phone + password |
| POST | `/login` | No | Login |
| POST | `/logout` | No | Revoke refresh token |
| POST | `/refresh` | No | Refresh access token |
| GET | `/me` | Yes | Current user profile |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:id` | No | Public seller profile |
| PUT | `/me` | Yes | Update own profile |

### Listings — `/api/listings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List (filter: status, category, city, ownerId, search) |
| GET | `/:id` | No | Get one |
| POST | `/` | Yes | Create listing |
| PUT | `/:id` | Yes | Update (owner → status pending) |
| DELETE | `/:id` | Yes | Delete (owner or admin) |
| POST | `/:id/approve` | Admin | Approve listing |
| POST | `/:id/reject` | Admin | Reject listing |

### Favorites — `/api/favorites`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List favorites |
| POST | `/` | Yes | Add `{ "listingId": "..." }` |
| DELETE | `/:listingId` | Yes | Remove |

### Chat — `/api/chat`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/threads` | Yes | Inbox |
| POST | `/threads` | Yes | Get or create `{ "listingId": "..." }` |
| GET | `/threads/:id/messages` | Yes | Messages (paginated) |
| POST | `/threads/:id/messages` | Yes | Send message |

### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Recent notifications |
| GET | `/unread-count` | Yes | Unread badge count |
| PATCH | `/:id/read` | Yes | Mark as read |

### Orders — `/api/orders`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Place order |
| GET | `/` | Yes | List (`?role=buyer\|seller`) |
| GET | `/:id` | Yes | Get order |
| PATCH | `/:id/status` | Yes | Seller: `{ "action": "confirm\|ship\|cancel" }` |

### Uploads — `/api/uploads`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Upload file (multipart `file`) |
| GET | `/:id` | Yes | Metadata |
| DELETE | `/:id` | Yes | Delete |

### Health

| GET | `/api/health` | No |

## Authentication

Send access token as:

```
Authorization: Bearer <accessToken>
```

On 401, refresh via `POST /api/auth/refresh` with `{ "refreshToken": "..." }`.

## Postman

Import [postman/Marketplace-API.postman_collection.json](postman/Marketplace-API.postman_collection.json).

## Frontend migration

See [FRONTEND_MIGRATION.md](../FRONTEND_MIGRATION.md).
