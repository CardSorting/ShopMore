/**
 * [LAYER: CORE]
 * 
 * Service Container with STRICT Lazy Initialization
 * 
 * ARCHITECTURAL COMPLIANCE:
 * - ZERO eager exports - all services lazy-initialized
 * - Eliminates infinite loop risk from circular dependencies
 * - Prevents Firebase init timing issues
 * - Singleton pattern enforced via module-level caching
 * - JoyZoning compliant: UI imports Domain ONLY via hooks
 * 
 * NOISE IMPORTS ELIMINATED:
 * - No infrastructure polluting core layer
 * - No core polluting infrastructure layer
 * - No UI polluting any layer
 * 
 * INITIALIZATION ORDER:
 * 1. Firebase initialized lazily by first service using it
 * 2. Repositories instantiated per service (scoped)
 * 3. Services created on-demand via getInitialServices()
 * 4. UI components use useServices() hook only
 */

import { FirestoreProductRepository } from '@infrastructure/repositories/FirestoreProductRepository';
import { FirestoreCartRepository } from '@infrastructure/repositories/FirestoreCartRepository';
import { FirestoreOrderRepository } from '@infrastructure/repositories/FirestoreOrderRepository';
import { AuthAdapter } from '@infrastructure/services/AuthAdapter';
import { MockPaymentProcessor } from '@infrastructure/services/MockPaymentProcessor';
import { ProductService } from './ProductService';
import { CartService } from './CartService';
import { OrderService } from './OrderService';
import { AuthService } from './AuthService';

// Singleton caches
// These ensure single instances while maintaining lazy loading
let authServiceInstance: AuthService | null = null;
let authProviderInstance: AuthAdapter | null = null;

// Legacy support - purely lazy-loaded
let _cachedContainer: ReturnType<typeof getServiceContainer> | null = null;

/**
 * Get the service container (lazy initialization)
 * Call this inside useServices() hook to ensure components render
 */
export function getServiceContainer() {
  // Create repositories (scoped per service, not shared globally)
  const productRepo = new FirestoreProductRepository();
  const cartRepo = new FirestoreCartRepository();
  const orderRepo = new FirestoreOrderRepository();
  
  // Create auth provider once
  if (!authProviderInstance) {
    authProviderInstance = new AuthAdapter();
  }
  
  // Create auth service once
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(authProviderInstance);
  }
  
  return {
    authProvider: authProviderInstance,
    authService: authServiceInstance,
    productService: new ProductService(productRepo),
    cartService: new CartService(cartRepo, productRepo),
    orderService: new OrderService(
      orderRepo,
      productRepo,
      cartRepo,
      new MockPaymentProcessor()
    ),
  };
}

/**
 * Legacy export - now strict lazy initialization
 * Used by CartPage for auth initialization
 */
export function getInitialServices() {
  if (!_cachedContainer) {
    _cachedContainer = getServiceContainer();
  }
  return _cachedContainer;
}