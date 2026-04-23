# PlayMoreTCG — E-Commerce Platform

A full-stack ecommerce application for trading card game products, built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **Firebase Authentication**, and **Cloud Firestore**.

## Architecture (Joy-Zoning)

| Layer | Path | Responsibility |
|---|---|---|
| **Domain** | `src/domain/` | Pure business logic: models, rules, errors, repository contracts |
| **Core** | `src/core/` | Application orchestration: services coordinate domain + infrastructure |
| **Infrastructure** | `src/infrastructure/` | Adapters: Firebase Auth, Firestore repositories, payment processors |
| **UI** | `src/ui/` | React components, pages, hooks, layouts |
| **Plumbing** | `src/utils/` | Stateless helpers: constants, formatters, validators |

## Features

### Customer
- Browse products with category filtering
- Product detail pages with stock display
- Add to cart (quantity selector)
- Full cart management (update qty, remove items)
- Checkout with shipping address + mock payment
- Order history with status tracking
- Account creation & login

### Admin
- Dashboard with stats, revenue, low-stock alerts
- CRUD product management
- Order list with status updates (pending → confirmed → shipped → delivered)
- Role-based access control (`admin` vs `customer`)

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite 6 |
| Styling | Tailwind CSS 4 |
| Router | React Router DOM |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Icons | Lucide React |

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
Copy `.env.example` to `.env` and fill in your Firebase project credentials:
```bash
cp .env.example .env
```

Required environment variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 3. Seed Mock Products
```bash
npx tsx src/infrastructure/services/SeedDataLoader.ts
```

### 4. Start Dev Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Firestore Security Rules

Deploy `firestore.rules` to enforce:
- **Products**: public read, admin-only write
- **Carts**: user-scoped read/write
- **Orders**: users read their own, admins read all + update status

```bash
firebase deploy --only firestore:rules
```

## Admin Setup

The first user created via Firebase Auth can be promoted to admin by setting a custom claim. Use the Firebase Admin SDK or Firebase Console to set `admin: true` on a user's token. After that, the `/admin` route will be accessible.

## Project Structure

```
src/
├── domain/          # Models, rules, errors, repository interfaces
├── core/            # Services (CartService, OrderService, etc.)
├── infrastructure/  # Firebase config, repositories, auth adapter
├── ui/              # Pages, components, hooks, layouts, router
├── utils/           # Constants, helpers
├── main.tsx         # App entry point
└── index.css        # Tailwind theme
```

## License

MIT