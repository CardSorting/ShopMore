# 1. System Overview & Tech Stack

PlayMoreTCG is an e-commerce application engineered for extreme velocity and structural integrity.

## Core Technologies
- **Frontend / Build System:** React 19, Vite, Tailwind CSS.
- **Local-First Database:** `better-sqlite3` strictly typed via `kysely`.
- **Cloud Synchronization:** Firebase / Firestore (Provider toggleable).
- **Payment Processing:** Stripe Integration.

## Dual-Provider Architecture
The system features a dual-provider database architecture. By setting `VITE_DB_PROVIDER=sqlite` or `firebase` in your environment, the underlying infrastructure seamlessly swaps out without affecting the core application layers. This allows developers to work fully local-first while maintaining the capability to sync with cloud services.

## Environment Variables
To correctly bootstrap the application, the following environment configurations are observed:

```env
# Database Provider Selection ('sqlite' or 'firebase')
VITE_DB_PROVIDER=sqlite

# Stripe Integration (Required for Checkout)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_SECRET_KEY=sk_test_...

# Firebase Configuration (Required only if VITE_DB_PROVIDER=firebase)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
```
