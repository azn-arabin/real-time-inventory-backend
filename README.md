# Real-Time High-Traffic Inventory System — Backend

Backend API for a **Limited Edition Sneaker Drop** platform. Built with Node.js, Express, Sequelize ORM and PostgreSQL. Supports real-time stock updates via Socket.io, atomic reservations with a 60-second window, and prevents overselling even under high concurency.

## Tech Stack

- **Runtime:** Node.js + Express
- **Language:** TypeScript
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Sequelize v6
- **Real-time:** Socket.io
- **Auth:** JWT (jsonwebtoken + bcryptjs)

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database (local or Neon)
- npm or yarn

### 1. Clone the repo

```bash
git clone git@github.com:azn-arabin/real-time-inventory-backend.git
cd real-time-inventory-backend
```

### 2. Install dependancies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the root:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SSL=true

JWT_SECRET=some_random_secret_string
JWT_EXPIRES_IN=7d
```

> If you're using a local postgres without SSL, set `DB_SSL=false`.

### 4. Run the server

```bash
npm run dev
```

The server will:

1. Connect to the database and sync tables (auto creates them if they dont exist)
2. Seed the database with test data (admin user, sample drops, etc.) — only runs if DB is empty
3. Start the reservation expiry scheduler
4. Listen on the configured port (default 5000)

### 5. Seed data manually (optional)

If you want to re-seed:

```bash
npm run seed
```

This creates:

- Admin user: `admin@techzu.com` / `123456`
- 4 regular users (johndoe, sarah_k, mike92, emma_w) all with password `123456`
- 20 sneaker drops with images
- 10 sample completed purchases

## Database Schema

The app uses 4 main tables. Sequelize handles the table creation automaticaly on startup.

### Users

| Column   | Type      | Notes              |
| -------- | --------- | ------------------ |
| id       | UUID (PK) | Auto generated     |
| username | STRING    | Unique             |
| email    | STRING    | Unique             |
| password | STRING    | Hashed with bcrypt |
| role     | ENUM      | `admin` or `user`  |

### Drops

| Column         | Type          | Notes                   |
| -------------- | ------------- | ----------------------- |
| id             | UUID (PK)     | Auto generated          |
| name           | STRING        |                         |
| price          | DECIMAL(10,2) |                         |
| totalStock     | INTEGER       | Initial stock count     |
| availableStock | INTEGER       | Current available stock |
| imageUrl       | STRING        | Nullable                |
| dropStartsAt   | DATE          | When the drop goes live |

### Reservations

| Column    | Type | Notes                               |
| --------- | ---- | ----------------------------------- |
| id        | UUID | PK                                  |
| userId    | UUID | FK → Users                          |
| dropId    | UUID | FK → Drops                          |
| status    | ENUM | `active`, `completed`, or `expired` |
| expiresAt | DATE | 60 seconds from creation            |

### Purchases

| Column        | Type | Notes             |
| ------------- | ---- | ----------------- |
| id            | UUID | PK                |
| userId        | UUID | FK → Users        |
| dropId        | UUID | FK → Drops        |
| reservationId | UUID | FK → Reservations |

## API Endpoints

### Auth

| Method | Endpoint              | Description       | Auth |
| ------ | --------------------- | ----------------- | ---- |
| POST   | `/api/users/register` | Register new user | No   |
| POST   | `/api/users/login`    | Login, get JWT    | No   |
| GET    | `/api/users/:id`      | Get user by ID    | Yes  |

### Drops

| Method | Endpoint         | Description                       | Auth  |
| ------ | ---------------- | --------------------------------- | ----- |
| GET    | `/api/drops`     | List drops (paginated)            | No    |
| GET    | `/api/drops/:id` | Get a single drop with purchasers | No    |
| POST   | `/api/drops`     | Create a new drop                 | Admin |

### Reservations

| Method | Endpoint            | Description                    | Auth |
| ------ | ------------------- | ------------------------------ | ---- |
| POST   | `/api/reservations` | Reserve an item (60s TTL)      | Yes  |
| GET    | `/api/reservations` | Get all my active reservations | Yes  |

### Purchases

| Method | Endpoint              | Description                          | Auth |
| ------ | --------------------- | ------------------------------------ | ---- |
| POST   | `/api/purchases`      | Complete purchase (from reservation) | Yes  |
| GET    | `/api/purchases/mine` | My purchase history                  | Yes  |

## Architecture & Design Decisions

### How I handled the 60-second reservation expiry

When a user clicks "Reserve", we create a reservation record with an `expiresAt` timestamp thats 60 seconds in the future. The available stock is decremented immediately in the same transaction.

A background **scheduler** (using `setInterval`) runs every 5 seconds to check for any active reservations where `expiresAt < now()`. For each expired one, it:

- Marks the reservation status as `expired`
- Adds back 1 unit to the drop's `availableStock`
- Broadcasts a socket event so all connected clients see the stock update in real-time

On the frontend side, there's a local countdown timer so the user sees the exact seconds ticking down. The server-side scheduler is the source of truth tho — even if the user closes their brower, the stock will still be returned.

Why `setInterval` and not something fancier? For this scale it works perfectly fine. In a production system with thousands of concurrent users, I'd probably use a job queue like BullMQ with Redis or schedule each expiry as a delayed job for more precise timing. But for this assesment, the polling approach is simple, reliable, and easy to understand.

### How I prevented overselling (concurrency handling)

This was probably the trickiest part. The reserve endpoint uses **READ COMMITTED** isolation level with a **SELECT ... FOR UPDATE** row-level lock on the drop row:

```typescript
const t = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
});

const drop = await Drop.findByPk(dropId, {
  lock: Transaction.LOCK.UPDATE,
  transaction: t,
});
```

What this does: when multiple users try to reserve the same item simultaneosly, the first transaction locks the row. Other transactions have to **wait** until the first one commits or rolls back, then they read the updated stock value. This way only one user gets the last item — the rest see `availableStock <= 0` and get a 409 error.

I initially tried using `SERIALIZABLE` isolation level but it was causing a lot of unnecessary transaction aborts even when there was plenty of stock available. The `READ COMMITTED` + row lock approach is much better because transactions only block when they're actually competing for the same row, so theres no wasted retries.

### WebSocket Events

All real-time communication uses Socket.io. The server emits these events:

| Event                | When                              | Payload                                             |
| -------------------- | --------------------------------- | --------------------------------------------------- |
| `inventory_update`   | Stock changes (reserve/expire)    | `{ dropId, availableStock }`                        |
| `purchase_update`    | Someone buys an item              | `{ dropId, username }`                              |
| `reservation_update` | A reservation expires server-side | `{ reservationId, dropId, userId, availableStock }` |
| `new_drop`           | Admin creates a new drop          | Full drop object                                    |

## Project Structure

```
src/
├── index.ts                    # Entry point, server setup
├── controllers/
│   ├── authController.ts       # Login/register logic
│   ├── dropController.ts       # Drop CRUD + purchaser info
│   ├── purchaseController.ts   # Purchase flow
│   └── reservationController.ts # Atomic reservation logic
├── models/
│   ├── index.ts                # Model associations
│   ├── User.ts
│   ├── Drop.ts
│   ├── Reservation.ts
│   └── Purchase.ts
├── routes/
│   ├── userRoutes.ts
│   ├── dropRoutes.ts
│   ├── purchaseRoutes.ts
│   └── reservationRoutes.ts
├── middlewares/
│   └── authMiddleware.ts       # JWT verification
├── scheduler/
│   └── reservationScheduler.ts # Checks expired reservations
├── socket/
│   └── index.ts                # Socket.io setup
└── lib/
    ├── config/
    │   └── database.ts         # Sequelize connection config
    ├── constants/
    │   └── utils.constants.ts  # Socket event names
    ├── helpers/
    │   ├── globalError.ts      # Express error handler
    │   ├── paginationHelper.ts # Generic pagination util
    │   └── responseHelper.ts   # Standardized API responses
    └── seeders/
        └── seed.ts             # Test data seeder
```

## Scripts

| Command         | What it does                                   |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Start dev server (ts-node-dev with hot reload) |
| `npm run build` | Compile TypeScript to JS                       |
| `npm start`     | Run compiled JS (production)                   |
| `npm run seed`  | Seed the database manually                     |
