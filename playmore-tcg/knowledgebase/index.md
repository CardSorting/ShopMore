# PlayMoreTCG Architecture Wiki

Welcome to the PlayMoreTCG knowledgebase. This wiki breaks down the high-performance, deterministic Local-First architecture, deeply hardened using BroccoliQ paradigms.

## Table of Contents

1. [System Overview & Tech Stack](./01-system-overview.md)
   * High-level technologies and the dual-provider paradigm.
2. [Domain-Driven Design (DDD) Layout](./02-ddd-layout.md)
   * Detailed breakdown of `src/domain`, `src/core`, and `src/infrastructure`.
3. [BroccoliQ Local-First Hardening (The 7 Pillars)](./03-broccolq-hardening.md)
   * Deep dive into 0ms buffering, Sovereign Locking, Sagas, and memory backpressure.
4. [The Autonomous Data Flow](./04-data-flow.md)
   * Step-by-step example of a heavily hardened checkout process.
5. [Database Schema & Tables](./05-database-schema.md)
   * Kysely schemas, Core Tables, and BroccoliQ Sovereign Tables.
6. [Testing Strategies (Factory Pattern)](./06-testing-strategies.md)
   * Utilizing the container for test isolation and state destruction.
