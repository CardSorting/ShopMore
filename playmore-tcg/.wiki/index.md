# Sovereign Knowledge Ledger — PlayMoreTCG

This `.wiki/` directory is the definitive architectural bridge for PlayMoreTCG. It documents verified present-state facts observed from the repository, not assumptions.

## First Reads

1. [Agent Memory Core](./agent-memory.md) — strict constraints for future autonomous agents.
2. [Getting Started](./getting-started.md) — local setup and environmental parity checks.
3. [Architecture](./architecture.md) — layered system map and service dependency diagrams.
4. [Risk Map](./risk-map.md) — blast-radius guidance before touching fragile areas.

## Omni-Bridge Documentation

- [Walkthrough](./walkthrough.md) — human onboarding and first-run path.
- [Directories](./directories.md) — top-level and source directory dictionary.
- [API](./api.md) — observed Next API route surface.
- [Schemas](./schemas.md) — Domain models, repository interfaces, SQLite tables, and env schema.
- [Patterns](./patterns.md) — step-by-step implementation recipes.
- [Decisions](./decisions.md) — architectural decision records and rationale.
- [Troubleshooting](./troubleshooting.md) — known setup pitfalls and fixes.
- [Changelog](./changelog.md) — chronological documentation synchronization notes.

## Historical Audit Records

- [Forensic Structural Audit — 2026-04-25](./forensic-structural-audit-2026-04-25.md)
- [Next.js + SQLite Migration Pass — 2026-04-25](./nextjs-sqlite-migration-2026-04-25.md)
- [Production Hardening Pass — 2026-04-25](./production-hardening-pass-2026-04-25.md)
- [Production Hardening Pass — 2026-04-24](./production-hardening-pass-2026-04-24.md)

## Verified Current-State Summary

- Stack: Next.js App Router, React 19, TypeScript, Tailwind CSS 4, SQLite via `better-sqlite3` and Kysely, Stripe client packages, bcrypt-backed auth.
- Scripts in `package.json`: `npm run dev`, `npm run build`, `npm run lint`, `npm run start`.
- Source layers: `src/domain` for pure contracts/rules, `src/core` for orchestration, `src/infrastructure` for SQLite/server/payment/auth adapters, `src/ui` for presentation, `src/utils` for stateless helpers, and `src/app` for Next pages/API route handlers.
- Runtime service path: `src/app/api/**/route.ts` → `src/infrastructure/server/services.ts` → `src/core/container.ts` → Core services → Domain repository interfaces → SQLite infrastructure adapters.
- Environment variables observed in `.env.example`: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SESSION_SECRET`, `SQLITE_DATABASE_PATH`; `TrustedCheckoutGateway` also reads optional `CHECKOUT_ENDPOINT`.
- Current git status during this pass already contained modified generated `.next/dev` files, modified `.wiki/index.md` and `.wiki/changelog.md`, deleted `knowledgebase/*`, and untracked `.wiki/forensic-structural-audit-2026-04-25.md`; this pass intentionally updates only `.wiki/` documentation.