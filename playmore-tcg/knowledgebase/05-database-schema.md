# 5. Database Schema & Tables

The Local-First backend is powered by `better-sqlite3` and is strictly typed using `kysely`. The database schema is designed to support the advanced BroccoliQ paradigms, including autonomous integrity and global locking.

## Core Tables

### 1. `products`
The source of truth for inventory. Mapped into RAM on boot via the Level 7 Auth-Index.
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `price` (REAL)
- `stock` (INTEGER)
- `category` (TEXT)

### 2. `carts`
A high-frequency mutation table. Protected by Level 3 Dual-Buffering to ensure 0ms UI latency.
- `id` (TEXT PRIMARY KEY)
- `userId` (TEXT UNIQUE)
- `items` (TEXT) - JSON stringified cart items
- `updatedAt` (TEXT)

### 3. `orders`
The finalized transaction ledger.
- `id` (TEXT PRIMARY KEY)
- `userId` (TEXT)
- `items` (TEXT)
- `total` (REAL)
- `status` (TEXT) - 'pending', 'confirmed', 'shipped'
- `paymentTransactionId` (TEXT)

## BroccoliQ Sovereign Tables

### 4. `hive_claims` (Level 5 Locking)
Provides cross-process mutual exclusion. When the Re-entrant RAM Mutex completes its queue, it acquires a physical row here.
- `id` (TEXT PRIMARY KEY) - The resource locked (e.g., `checkout_user123`)
- `owner` (TEXT)
- `expiresAt` (TEXT)
- `createdAt` (TEXT)

### 5. `hive_audit` (Level 9 Integrity)
A self-healing telemetry table. The `IntegrityWorker` logs cleanup actions here, and autonomously prunes rows older than 30 days to prevent infinite disk bloat.
- `id` (TEXT PRIMARY KEY)
- `action` (TEXT)
- `details` (TEXT)
- `timestamp` (TEXT)
