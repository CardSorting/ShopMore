# 3. BroccoliQ Local-First Hardening (The 7 Pillars)

The SQLite local-first infrastructure is heavily fortified using the `BroccoliDB` substrate paradigms:

### Level 3: Dual-Buffering (0ms Write Latency)
**File:** `infrastructure/repositories/sqlite/SQLiteCartRepository.ts`
* **Concept:** Instead of writing directly to disk, cart mutations are captured instantly in a RAM `Map` (`activeBuffer`). 
* **Result:** 0ms IO latency for users modifying their shopping carts.

### Level 4: Atomic Flush Synchronization
**File:** `infrastructure/repositories/sqlite/SQLiteCartRepository.ts`
* **Concept:** A background event loop runs every 1,000ms, atomically swapping the `activeBuffer` into an `inFlightBuffer` (Protected Swap), then flushing it via a bulk Kysely transaction.
* **Safety:** If a disk lock (`SQLITE_BUSY`) occurs, the un-flushed ops intelligently merge back into the main buffer without overwriting newer state mutations.

### Level 5: Sovereign Locking (Re-entrant RAM Mutex)
**File:** `infrastructure/sqlite/SovereignLocker.ts`
* **Concept:** Mutual Exclusion (Mutex) to prevent race conditions during concurrent checkouts.
* **Hardening:** Uses `node:async_hooks` for a **Re-entrant Memory Mutex**. If multiple requests hit the same Node process, they queue sequentially in RAM (0ms overhead). Only the active request interacts with the physical `hive_claims` table, completely shielding the DB from lock-contention spam.

### Level 6: Builder's Punch (Coalesced Batching)
**File:** `core/OrderService.ts`, `SQLiteProductRepository.ts`
* **Concept:** Coalesces multiple product inventory deductions (from a cart) into a single, highly optimized `batchUpdateStock` atomic query.

### Level 7: Memory-First Auth-Index
**File:** `infrastructure/repositories/sqlite/SQLiteProductRepository.ts`
* **Concept:** The product catalog is mirrored directly into an `authIndex` `Map`. 
* **Result:** `O(1)` time complexity lookups in RAM. The index selectively invalidates upon admin mutation to guarantee eventual consistency.

### Level 9: Sovereign Boot & Final Flush (Lifecycle Integrity)
**Files:** `core/container.ts`, `infrastructure/dbProvider.ts`
* **Sovereign Warmup:** The Dependency Injection container explicitly fires `productRepo.warmup()` when the backend initializes, pre-loading the Level 7 Product Index into RAM before the first user connects.
* **Final Sovereign Flush:** A global Graceful Shutdown Registry intercepts Node `SIGTERM`/`SIGINT` and Browser `beforeunload` signals. It forcefully halts the `IntegrityWorker` and explicitly flushes pending memory buffers to disk *before* allowing the process to die.

### Level 11: Axiomatic Reliability (Sagas & Backpressure)
**Files:** `core/OrderService.ts`, `SQLiteCartRepository.ts`
* **Agent Shadow Rollbacks (Sagas):** `OrderService` treats checkout as a localized transaction. It eagerly deducts stock, processes the Stripe payment, and if the payment declines, immediately runs an inverted database write (Compensating Transaction) to fully restore the inventory, ensuring 0% inventory bleed.
* **Memory Backpressure:** Hard boundaries (`MAX_BUFFER_SIZE = 5000` carts, `MAX_INDEX_SIZE = 10000` products) prevent Out-Of-Memory (OOM) crashes by selectively throttling writes or dynamically falling back to disk reads if the node's physical resources are exhausted.
