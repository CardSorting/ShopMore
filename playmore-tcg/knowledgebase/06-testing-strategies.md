# 6. Testing Strategies (Factory Pattern)

PlayMoreTCG's strict dependency injection allows for highly reliable and isolated unit and integration testing.

## The Factory Pattern (`getServiceContainer`)

In production, the application uses `getInitialServices()` which caches the repositories (Singletons) to preserve state (like the shopping cart buffer) across the application lifecycle.

However, for testing, you must use `getServiceContainer()`. This acts as a Factory Pattern, generating **completely fresh, isolated instances** of every service and repository on every call.

### Example Integration Test

```typescript
import { getServiceContainer } from '../src/core/container';

describe('Order Checkout Flow', () => {
  it('prevents checkout if cart is empty', async () => {
    // 1. Generate a completely isolated environment
    const { cartService, orderService } = getServiceContainer();
    const userId = 'test_user_1';

    // 2. Ensure cart is clear in this isolated scope
    await cartService.clearCart(userId);

    // 3. Attempt checkout
    await expect(
      orderService.placeOrder(userId, mockAddress)
    ).rejects.toThrow('Cart is empty');
  });
});
```

By strictly adhering to `getServiceContainer()` in test files, you completely eliminate test pollution and overlapping database buffers.
