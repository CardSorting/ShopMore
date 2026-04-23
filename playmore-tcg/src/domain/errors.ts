/**
 * [LAYER: DOMAIN]
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
    this.name = 'ProductNotFoundError';
  }
}

export class InsufficientStockError extends DomainError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for ${productId}: requested ${requested}, available ${available}`
    );
    this.name = 'InsufficientStockError';
  }
}

export class CartEmptyError extends DomainError {
  constructor() {
    super('Cart is empty');
    this.name = 'CartEmptyError';
  }
}

export class AuthError extends DomainError {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Admin access required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}