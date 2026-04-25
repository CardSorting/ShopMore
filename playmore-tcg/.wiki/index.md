# Sovereign Knowledge Ledger — PlayMoreTCG

This directory is the forensic Knowledge Ledger for verified architectural state and audit history. Entries are evidence-based snapshots grounded in observed repository files and git history.

## Ledger Entries

- [Changelog](./changelog.md) — concise chronological record of verified documentation synchronization events.
- [Next.js + SQLite Migration Pass — 2026-04-25](./nextjs-sqlite-migration-2026-04-25.md) — current-state audit for the migration from Vite/React Router/Firebase runtime paths to Next.js App Router plus SQLite-backed server route handlers.
- [Production Hardening Pass — 2026-04-25](./production-hardening-pass-2026-04-25.md) — prior production-hardening audit record covering checkout authority, validation, logging, hook stability, and Firestore-rule alignment.
- [Production Hardening Pass — 2026-04-24](./production-hardening-pass-2026-04-24.md) — earlier hardening record covering lock-provider contracts, validation, repository typing, and SQLite/browser boundary cleanup.

## Current Verified Architecture Summary

- The application is currently configured as a Next.js App Router project: `package.json` scripts use `next dev`, `next build`, and `next start`; `next.config.ts` marks `better-sqlite3` as a server external package.
- UI pages remain under `src/ui/pages/*` and are mounted by App Router wrappers in `src/app/**/page.tsx`.
- Browser-facing UI service access uses `src/ui/hooks/useServices.ts` and `src/ui/apiClientServices.ts`, which call local `/api/*` endpoints instead of directly constructing SQLite repositories.
- Server-side route handlers under `src/app/api/**/route.ts` obtain Core services through `src/infrastructure/server/services.ts`, which initializes SQLite before returning `getInitialServices()` from `src/core/container.ts`.
- Domain contracts remain in `src/domain/*`; Core orchestration remains in `src/core/*`; SQLite adapters and server/session utilities remain in `src/infrastructure/*`; presentation components remain in `src/ui/*`.

## Forensic Notes

- The workspace audit observed no uncommitted source diff before this documentation synchronization pass.
- The latest git commit is `83b60a8`, described as the migration to Next.js App Router with SQLite/better-sqlite3 backing and API-backed client services.
- Generated `.next/` build artifacts are present in the latest commit file listing; these are build outputs, not source architecture contracts.