/**
 * [LAYER: PLUMBING]
 * 
 * Input Validation Utilities
 * 
 * Pure, stateless validation functions used across the application.
 * No dependencies on other layers.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Email Pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL Pattern
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
    return { valid: false, errors };
  }

  if (email.length > 254) {
    errors.push('Email exceeds maximum length');
  }

  if (!EMAIL_REGEX.test(email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates password strength
 * Minimum requirements: 8 chars, 1 uppercase, 1 lowercase, 1 number
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || password.trim().length === 0) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (password.length > 128) {
    errors.push('Password exceeds maximum length');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates display name length
 */
export function validateDisplayName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Display name is required');
    return { valid: false, errors };
  }

  if (name.trim().length > 50) {
    errors.push('Display name must not exceed 50 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates cart item quantity
 */
export function validateCartItemQuantity(quantity: number, maxQuantity: number = 99): ValidationResult {
  const errors: string[] = [];

  if (quantity === undefined || quantity === null || isNaN(quantity)) {
    errors.push('Quantity must be a number');
    return { valid: false, errors };
  }

  const numQuantity = parseInt(String(quantity), 10);

  if (numQuantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (numQuantity > maxQuantity) {
    errors.push(`Quantity must not exceed ${maxQuantity}`);
  }

  if (numQuantity > 1000) {
    errors.push('Quantity too large');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates shipping address
 */
export function validateAddress(address: {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!address.street || address.street.trim().length === 0) {
    errors.push('Street address is required');
  }

  if (address.street.length > 200) {
    errors.push('Street address too long');
  }

  if (!address.city || address.city.trim().length === 0) {
    errors.push('City is required');
  }

  if (address.city.length > 100) {
    errors.push('City too long');
  }

  if (!address.state || address.state.trim().length === 0) {
    errors.push('State is required');
  }

  if (address.state.length > 100) {
    errors.push('State too long');
  }

  if (!address.zip || address.zip.trim().length === 0) {
    errors.push('ZIP code is required');
  }

  if (address.zip.length > 20) {
    errors.push('ZIP code too long');
  }

  if (!address.country || address.country.trim().length === 0) {
    errors.push('Country is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a string field (for non-required fields)
 */
export function validateOptionalString(
  value: string,
  minLength: number = 0,
  maxLength: number = 1000
): ValidationResult {
  const errors: string[] = [];

  if (value && value.length > maxLength) {
    errors.push(`Field exceeds maximum length of ${maxLength}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates name fields (for products, etc.)
 */
export function validateRequiredName(name: string, maxLength: number = 200): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
    return { valid: false, errors };
  }

  if (name.trim().length > maxLength) {
    errors.push(`Name must not exceed ${maxLength} characters`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates price (in cents, must be positive)
 */
export function validatePrice(price: number): ValidationResult {
  const errors: string[] = [];

  if (typeof price !== 'number' || isNaN(price)) {
    errors.push('Price must be a number');
    return { valid: false, errors };
  }

  if (price < 0) {
    errors.push('Price cannot be negative');
  }

  if (price > 9999999) {
    errors.push('Price超出最大值限制');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates stock quantity
 */
export function validateStock(stock: number): ValidationResult {
  const errors: string[] = [];

  if (typeof stock !== 'number' || isNaN(stock)) {
    errors.push('Stock must be a number');
    return { valid: false, errors };
  }

  if (stock < 0) {
    errors.push('Stock cannot be negative');
  }

  if (stock > 999999) {
    errors.push('Stock超出最大值限制');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generic validation helper for async operations
 */
export async function validateField<T>(
  validator: (value: T) => ValidationResult,
  value: T
): Promise<{ valid: boolean; error: string | null }> {
  const result = validator(value);
  return {
    valid: result.valid,
    error: result.valid ? null : result.errors[0],
  };
}