# 2. Domain-Driven Design (DDD) Layout

The workspace strictly enforces bounded contexts to prevent architectural decay and infrastructure leakage.

## `src/domain/` (The Core Contract)
Contains zero implementation details. Pure TypeScript interfaces (`ICartRepository`), error definitions (`CartEmptyError`), business rules (`canPlaceOrder`), and core schemas.

## `src/core/` (Business Logic & Orchestration)
Contains the raw business logic. Services (`OrderService`, `CartService`) orchestrate the domain models. 

### Strict Lazy Initialization Container (`container.ts`)
Acts as the definitive service locator. It provides both `getInitialServices()` (Singleton) and `getServiceContainer()` (Factory) to completely prevent circular dependency deadlocks and lazy-load infrastructure providers.

```typescript
// Example of strict boundary injection:
// The Service only knows about the Interface, never the SQLite implementation.
export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private payment: IPaymentProcessor
  ) {}
}
```

## `src/infrastructure/` (Concrete Reality)
The physical execution layer. This directory houses the `SQLite` and `Firestore` repository implementations, the Stripe payment processors, and the physical `dbProvider.ts` orchestrator.
