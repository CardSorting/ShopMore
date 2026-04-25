# Sovereign Knowledge Ledger Changelog

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