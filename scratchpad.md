# PlayMoreTCG Ecommerce — Architectural Draft

## Requirements
- Stack: React + Vite + TypeScript + Tailwind CSS
- Backend: Firebase Authentication + Firestore
- Checkout: Mock only (no real payment gateway)
- Products: Mock TCG products (booster packs, singles, accessories)
- Start: Simplified admin panel, then build outward to customer-facing site

## JoyZoning Layer Breakdown

### DOMAIN (src/domain/)
**Models**
- `Product` — id, name, description, price (cents), category, stock, imageUrl, set, rarity
- `User` — id, email, displayName, role (customer | admin), createdAt
- `Cart` — id, userId, items[], updatedAt
- `CartItem` — productId, quantity, priceSnapshot
- `Order` — id, userId, items[], total, status (pending | confirmed | shipped | cancelled), shippingAddress, createdAt
- `OrderItem` — productId, name, quantity, unitPrice

**Value Objects**
- `Price` — cents integer, formatter helper
- `Quantity` — positive integer with max limit
- `Address` — street, city, state, zip, country

**Business Rules (Pure Functions)**
- `calculateCartTotal(cartItems): number` — sum(quantity * priceSnapshot)
- `validateCartItem(product, quantity): boolean` — stock check, max qty
- `canPlaceOrder(cart, stockMap): boolean` — all items in stock
- `deductStock(product, qty): Product` — immutable stock update

**Domain Events**
- `CartUpdated`
- `OrderPlaced`
- `StockChanged`

### CORE (src/core/)
**Services / Use Cases**
- `ProductService` — getProducts, getProductById, searchProducts, updateProduct (admin)
- `CartService` — getCart, addItem, removeItem, updateQuantity, clearCart
- `OrderService` — placeOrder, getOrders, getOrderById, updateOrderStatus (admin)
- `AuthService` — signIn, signUp, signOut, getCurrentUser, requireAuth, requireAdmin

**Admin Coordination**
- `AdminProductManager` — CRUD operations for products
- `AdminOrderManager` — view orders, update status

### INFRASTRUCTURE (src/infrastructure/)
**Firebase Adapters**
- `firebaseConfig.ts` — Firebase app initialization
- `AuthAdapter` — wraps Firebase Auth (implements domain auth contract)
- `FirestoreProductRepository` — implements Product repository interface
- `FirestoreCartRepository` — implements Cart repository interface
- `FirestoreOrderRepository` — implements Order repository interface

**Mock Components**
- `MockPaymentProcessor` — simulates payment success/failure, returns transactionId
- `SeedDataLoader` — populates Firestore with initial TCG mock products

### UI (src/ui/ or src/components/)
**Pages / Routes**
- `/` — Home (featured products, categories)
- `/products` — Product catalog with filters
- `/products/:id` — Product detail page
- `/cart` — Shopping cart
- `/checkout` — Checkout flow (shipping + mock payment)
- `/orders` — Order history
- `/login` / `/register` — Auth pages
- `/admin` — Admin dashboard (products list, orders list)
- `/admin/products/new` — Add product
- `/admin/products/:id/edit` — Edit product

**Shared Components**
- `Navbar` — with cart badge, auth state
- `ProductCard`
- `CartItemRow`
- `Button`, `Input`, `Select` — design system primitives

### PLUMBING (src/utils/)
- `currency.ts` — formatCentsToDollars
- `validators.ts` — email, password strength, zip code
- `typeGuards.ts` — isProduct, isOrder, etc.
- `constants.ts` — collection names, app constants

## Dependency Flow
```
Domain → (nothing external)
Core → Domain, Infrastructure, Plumbing
Infrastructure → Domain, Plumbing
UI → Domain, Plumbing (NOT Infrastructure directly)
Plumbing → (nothing)
```

## Data Flow
1. UI dispatches user action (e.g., "Add to Cart")
2. Core service coordinates: validate (Domain) → persist (Infrastructure)
3. Infrastructure updates Firestore
4. UI re-renders with updated state

## Admin-First Strategy
Phase 1: Admin panel (product CRUD, order management)
Phase 2: Customer auth + product browsing
Phase 3: Cart + Checkout
Phase 4: Order history + polish

# STRATEGIC REVIEW

## Requirement Analysis

The user is asking for another deeper production-hardening audit of the PlayMoreTCG ecommerce site, with emphasis on doubling down on existing hardening concepts rather than introducing superficial feature work. The next implementation pass should prioritize security, data integrity, checkout/payment correctness, validation consistency, and production reliability.

Key requirements verified from the current codebase and knowledge ledger:
- Preserve JoyZoning boundaries: Domain remains pure, Core orchestrates use cases, Infrastructure implements adapters, UI renders state and dispatches actions, Plumbing stays dependency-free.
- Continue the established production-hardening trajectory documented in `.wiki/production-hardening-pass-2026-04-25.md`.
- Focus on unresolved risks: checkout idempotency/reconciliation, trusted payment boundary, inconsistent auth/input validation, local auth persistence risk, duplicate stock mutation coalescing, hook warnings, and remaining bundle/security diagnostics.
- Maintain evidence-based SKL updates after implementation, with exact changed files and verification commands/results.

## The Architect review

Layer-by-layer architecture implications for the next pass:

- **Domain**: Add or refine pure contracts for checkout attempts/idempotency and cart stock coalescing. Domain must not know about Stripe, Firestore, SQLite, localStorage, timers, or logging.
- **Core**: Refactor checkout orchestration into explicit saga phases. Core can coordinate inventory, payment, order persistence, cart clearing, compensation, and reconciliation errors through interfaces only.
- **Infrastructure**: Harden adapters by implementing the expanded contracts: stable payment idempotency metadata, defensive duplicate-stock coalescing, safer SQLite auth email normalization/error mapping, and session revalidation where possible.
- **UI**: Integrate existing validators into login/register/admin product forms for usability, while keeping Domain/Core authoritative. Resolve hook dependency warnings without introducing direct Infrastructure imports.
- **Plumbing**: Reuse or extend dependency-free validators/parsers where policy is generic; promote security/business policy to Domain/Core when it affects correctness.

Architectural guardrails:
- Do not move payment capture into UI or browser infrastructure.
- Do not let UI-local validation become the only enforcement point.
- Do not trust localStorage role/user data for privileged decisions.
- Use Domain interfaces to bridge Core and Infrastructure.

## The Critic review

Primary objections and risk probes:

1. **Checkout saga risk**: Current flow deducts inventory before payment and rolls back on payment failure, but paid-after-payment failures remain under-modeled. The next pass should add explicit post-payment failure handling or reconciliation signaling.
2. **Idempotency gap**: Retried checkout submissions may duplicate payment/order attempts unless the payment boundary receives stable idempotency metadata.
3. **Validation drift**: Registration UI checks 6-character passwords while stronger validators exist elsewhere. Security policy must be centralized to avoid bypass by alternate callers.
4. **Local auth trust issue**: `SQLiteAuthAdapter` restores a serialized user from localStorage, including role. That state is user-controlled and should not be treated as authoritative for admin operations.
5. **Stock update semantics**: Batch stock updates are atomic but not obviously duplicate-safe if a cart contains repeated product IDs or if future callers pass duplicate updates.
6. **Remaining lint warnings**: React hook dependency warnings can create stale data and should not remain in a production-hardening track.

Acceptance criteria for the next pass:
- Build and lint remain passing.
- No new Domain external imports.
- Auth and product forms use consistent validation feedback.
- Checkout failure paths are more explicit and easier to reconcile.
- SKL records exact facts, not aspirational claims.

## The SRE review

Operational hardening priorities:

- **Reliability**: Ensure checkout has deterministic lock release, duplicate-submit protection, idempotency metadata, and clear reconciliation errors for partial failures.
- **Observability**: Use the existing environment-gated logger for operationally meaningful events without leaking sensitive payment/auth details in production UI.
- **Failure handling**: Separate payment-declined, inventory-unavailable, order-persist-failed, and cart-clear-failed cases so operators can understand blast radius.
- **Security**: Normalize auth inputs, avoid account enumeration where possible, and avoid trusting browser-persisted roles.
- **Data integrity**: Coalesce stock deltas, reject invalid numeric input before persistence, and keep repository mutations atomic.
- **Verification**: Run `npm run lint`, `npm run build`, and `npm audit --omit=dev --json`; document any unchanged warnings/risks.

Rollback strategy:
- Keep changes contract-driven and localized by layer.
- If checkout saga refactor fails verification, revert Core changes independently from UI validation changes.
- Infrastructure adapter hardening should remain compatible with existing Domain/Core call sites where possible.

## Stability Protocol Assessment

### What could go wrong?
1. **Firebase Auth custom claims require server-side function** — client cannot set admin role. Mitigation: document that admin must be set via Firebase Console or Cloud Function; implement simple role-gate in UI.
2. **Firestore rules complexity** — early incorrect rules could expose cart/order data. Mitigation: start with strict defaults, test with emulator.
3. **No real payment verification** — mock checkout means anyone can place orders. Mitigation: acceptable for MVP; clearly mark as mock.
4. **Stock race conditions** — two users checkout simultaneously could oversell. Mitigation: use Firestore transactions in `OrderService.placeOrder`.

### Rollback / Pivot Points
- Payment gateway: `PaymentProcessor` interface swap
- Database: repository pattern isolates Firestore; could migrate to another DB
- Auth: Firebase Auth is replaceable; domain `User` model is provider-agnostic

### Performance Anchors
- Product catalog: paginated Firestore queries (limit 20)
- Cart: real-time listener for badge count
- Orders: indexed by `userId` + `createdAt` desc

## TRIAD AUDIT

### The Architect
- ✅ Domain models are pure — no Firebase imports, no UI state
- ✅ Core services orchestrate without direct Firestore calls (via repository interfaces)
- ✅ Infrastructure implements domain-defined repository contracts
- ✅ UI depends on Core services through hooks, never touches Firestore directly
- ✅ Repository interfaces (`IProductRepository`, `ICartRepository`, `IOrderRepository`, `IAuthProvider`) defined in Domain, implemented in Infrastructure

### The Critic
- Q: Why Firestore for cart instead of localStorage?
  A: Cart should persist across devices for logged-in users. Firestore fits.
- Q: Mock payment — how to structure for future Stripe swap?
  A: Define `PaymentProcessor` interface in Domain, implement `MockPaymentProcessor` in Infrastructure. Stripe adapter can replace mock later without touching Core/Domain.
- Q: Admin panel security?
  A: Use Firebase custom claims for `admin` role, enforced in Firestore rules + UI route guards.
- Q: Real-time stock updates?
  A: Firestore listeners on product stock fields. UI subscribes, Core manages cleanup.

### The SRE
- **Error Handling**: Core services wrap Firebase errors into domain-specific errors (ProductNotFound, InsufficientStock, AuthError)
- **Loading States**: UI handles async states via React hooks (isLoading, error)
- **Offline**: Firestore offline persistence enabled for cart continuity
- **Security**: Firestore rules — users read only own cart/orders, admins write products, read all orders
- **Seeding**: `npm run seed` script to populate initial TCG products

## THE FOUNDATION
- **Project scaffolds cleanly**: Vite + React + TypeScript + Tailwind via `npm create vite@latest`
- **Firebase SDK version**: Use Firebase v11 (modular API) for tree-shaking and modern patterns
- **TypeScript strict mode**: enabled — no `any` in Domain, explicit return types on all public methods
- **Testability**: Domain is 100% unit-testable with zero mocks; Core services tested with in-memory repository stubs

## THE QUALITY CHECK
- **Linting**: ESLint + TypeScript + React hooks rules
- **Formatting**: Prettier with Tailwind plugin
- **No cross-layer leakage**: enforced by ESLint `no-restricted-imports` — UI cannot import from `src/infrastructure`
- **Code reviews**: Repository pattern means Firebase changes are isolated to one directory

## THE STABILITY GUARD
- **Firebase Emulator Suite**: Firestore + Auth emulators for local dev and CI
- **Firestore rules tested**: `firestore.rules` unit tests via `@firebase/rules-unit-testing`
- **Graceful degradation**: Auth state unknown → loading spinner; Firestore offline → cached data
- **Error boundaries**: React error boundaries on route level to prevent full app crash
- **Mock payment idempotency**: `MockPaymentProcessor` uses deterministic transaction IDs per order

## Stability Standard
- All Domain logic must compile and pass unit tests without Firebase or React installed.
- All Infrastructure adapters must implement Domain interfaces exactly — no extra public methods.
- UI components accept only Domain types and Plumbing helpers as props — no Firestore `DocumentSnapshot`.
- Every repository write path has a corresponding read path tested in emulator suite.
- Admin routes are gated by both client-side route guard AND Firestore security rules (defense in depth).

## [SYSTEM DIAGNOSTICS]
- **Build target**: Modern browsers (ES2020+), no IE11
- **Bundle analyzer**: Enabled in production build to catch Firebase bloat
- **Firestore indexes**: Composite index on `orders` (`userId` ascending, `createdAt` descending) — must be created via Firebase Console or `firestore.indexes.json`
- **Environment variables**: `VITE_FIREBASE_*` prefix for Vite; `.env.local` excluded from git
- **Node version**: 20+ (LTS)

## [FINAL STEPS]
1. Present this plan to user for approval
2. On approval, toggle to ACT mode
3. Execute Phase 1: scaffold project + Domain models + repository interfaces
4. Execute Phase 1: Firebase config + Firestore rules + seed data
5. Execute Phase 1: Admin panel UI (product CRUD, order list)
6. Execute Phase 2: Customer auth + product catalog
7. Execute Phase 3: Cart + Checkout
8. Execute Phase 4: Order history + polish
