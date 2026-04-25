# Sovereign Knowledge Ledger Changelog

## 2026-04-25 — Omni-Bridge Forensic Documentation Pass

### Audit Inputs

- Executed `git status --short` for `playmore-tcg` and observed pre-existing generated `.next/dev` modifications, existing `.wiki` modifications, deleted legacy `knowledgebase/*` files, and untracked `.wiki/forensic-structural-audit-2026-04-25.md`.
- Listed root project and `.wiki/` contents; `.wiki/` was missing required Omni-Bridge files such as `architecture.md`, `directories.md`, `patterns.md`, `decisions.md`, `risk-map.md`, `agent-memory.md`, `walkthrough.md`, `getting-started.md`, `troubleshooting.md`, `api.md`, and `schemas.md`.
- Read `package.json`, `README.md`, `.env.example`, `src/domain/models.ts`, `src/domain/repositories.ts`, `src/infrastructure/sqlite/schema.ts`, `src/infrastructure/sqlite/database.ts`, `src/infrastructure/server/services.ts`, `src/core/AuthService.ts`, `src/core/OrderService.ts`, `src/core/container.ts`, and `src/infrastructure/services/TrustedCheckoutGateway.ts`.
- Searched `src/app/api` route handlers for exported HTTP methods and observed 18 method exports across product, cart, order, admin-order, and auth endpoints.

### Documentation Updates

- Rebuilt `.wiki/index.md` as the Omni-Bridge navigation root and current-state summary.
- Added `.wiki/agent-memory.md` as the machine-readable first-read constraint capsule for future agents.
- Added `.wiki/architecture.md` with Mermaid layer/request-flow diagrams and service dependency mapping.
- Added `.wiki/directories.md` as the directory dictionary for root and `src/` structure.
- Added `.wiki/api.md` documenting observed API route surface.
- Added `.wiki/schemas.md` documenting Domain models, repository interfaces, SQLite tables, and environment variables.
- Added `.wiki/patterns.md` documenting common route, business-rule, DB, page, and contributor workflows.
- Added `.wiki/decisions.md` recording rationale for Next.js App Router, SQLite/Kysely, Joy-Zoning, browser API facade, singleton service container, and trusted checkout boundary.
- Added `.wiki/risk-map.md` documenting checkout, SQLite, auth/session, UI API facade, environment, and generated-file blast radius.
- Added `.wiki/getting-started.md`, `.wiki/walkthrough.md`, and `.wiki/troubleshooting.md` for human onboarding, parity checks, and known pitfalls.

### Verified Current-State Facts

- Active stack is Next.js App Router, React 19, TypeScript, Tailwind CSS 4, SQLite via `better-sqlite3` + Kysely, bcryptjs auth, and Stripe client packages.
- `src/infrastructure/server/services.ts` initializes SQLite through `initDatabase()` before returning `getInitialServices()`.
- `src/core/container.ts` wires SQLite repositories, SQLite auth, Stripe payment processor, and Core services; `getInitialServices()` uses module-level singleton caches.
- `src/domain/models.ts` defines Product, User, Cart, Order, Address, and related union types.
- `src/infrastructure/sqlite/database.ts` creates `products`, `users`, `carts`, `orders`, `hive_claims`, and `hive_audit` tables and enables WAL, `synchronous = NORMAL`, and foreign keys.
- `.env.example` documents `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SESSION_SECRET`, and `SQLITE_DATABASE_PATH`; `TrustedCheckoutGateway.ts` additionally reads optional `CHECKOUT_ENDPOINT`.

## 2026-04-25 — Forensic Structural Documentation Pass

### Audit Inputs

- Mapped the project hierarchy with `find` while excluding heavyweight generated directories such as `node_modules` and `.next`.
- Read root environment/configuration files: `package.json`, `next.config.ts`, `.env.example`, and `tsconfig.json`.
- Read representative architecture files across active layers: `src/app/layout.tsx`, `src/app/api/products/route.ts`, `src/app/api/orders/route.ts`, `src/core/container.ts`, `src/infrastructure/server/services.ts`, `src/infrastructure/sqlite/database.ts`, `src/infrastructure/sqlite/schema.ts`, `src/domain/models.ts`, `src/domain/rules.ts`, and `src/ui/apiClientServices.ts`.
- Measured source file distribution and largest TypeScript/TSX files with `find`/`wc -l` to identify logic-density hotspots.
- Checked repository cleanliness with `git status --short`; it returned no output before documentation edits.

### Documentation Updates

- Added `.wiki/forensic-structural-audit-2026-04-25.md` as a present-state audit of workspace architecture, runtime environment, service boundaries, logic density, and verification probes.
- Updated `.wiki/index.md` to reference the new structural audit and to refresh current-state notes about source distribution, environment variables, SQLite default path behavior, and generated artifacts.

### Verified Current-State Facts

- The project root is `playmore-tcg/` inside `/Users/bozoegg/Desktop/PlayMoreTCG`, with primary source under `playmore-tcg/src` and Knowledge Ledger files under `playmore-tcg/.wiki`.
- The active runtime is Next.js App Router with scripts `next dev`, `next build`, and `next start` in `package.json`.
- `next.config.ts` configures `better-sqlite3` as a server external package.
- `src/infrastructure/server/services.ts` initializes SQLite through `initDatabase()` before returning Core services from `getInitialServices()`.
- `src/ui/apiClientServices.ts` is a browser-side API facade that calls local `/api/*` routes and revives serialized date fields.
- Logic-density hotspots by line count include `SQLiteProductRepository.ts`, `AdminProductForm.tsx`, `domain/rules.ts`, `OrderService.ts`, `CartPage.tsx`, and `ProductsPage.tsx`.

## 2026-04-25 — Forensic Documentation Synchronization

### Audit Inputs

- `git status --short` and `git diff --stat` were executed for `playmore-tcg`; no uncommitted source changes were reported before this documentation pass.
- `git log --oneline -5` identified latest commit `83b60a8`, whose message records the migration from Vite/React Router/Firebase runtime paths to a Next.js App Router application backed by SQLite/better-sqlite3.
- `git show --stat --name-only --oneline --no-renames HEAD` confirmed the migration commit includes Next App Router files under `src/app/**`, API route handlers under `src/app/api/**`, server infrastructure under `src/infrastructure/server/**`, `next.config.ts`, `next-env.d.ts`, and updated package metadata.

### Documentation Updates

- Added `.wiki/index.md` as the Knowledge Ledger index and current architecture summary.
- Added `.wiki/nextjs-sqlite-migration-2026-04-25.md` to document the verified current state after the Next.js + SQLite migration.
- Preserved existing hardening records for 2026-04-24 and 2026-04-25 as historical audit entries.

### Verified Current-State Facts

- `package.json` scripts now target Next.js (`next dev`, `next build`, `next start`) while retaining `eslint .` for linting.
- `next.config.ts` configures `serverExternalPackages: ['better-sqlite3']`.
- `tsconfig.json` includes Next-generated type paths and path aliases for `@domain/*`, `@core/*`, `@infrastructure/*`, `@ui/*`, and `@utils/*`.
- `src/app/layout.tsx` wraps pages with `ErrorBoundary`, `AuthProvider`, and `Navbar`.
- `src/app/api/products/route.ts` and `src/app/api/orders/route.ts` delegate to `getServerServices()` and return `NextResponse` JSON.
- `src/infrastructure/server/services.ts` initializes SQLite through `initDatabase()` before returning Core services from `getInitialServices()`.
- `src/ui/apiClientServices.ts` provides browser-side service facades backed by `fetch('/api/...')` calls and date revival.

## Historical Entries

- 2026-04-25: Production hardening passes recorded in `.wiki/production-hardening-pass-2026-04-25.md`.
- 2026-04-24: Production hardening pass recorded in `.wiki/production-hardening-pass-2026-04-24.md`.