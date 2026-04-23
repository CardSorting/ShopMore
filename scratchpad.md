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
