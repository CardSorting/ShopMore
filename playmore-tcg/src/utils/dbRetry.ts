/**
 * [LAYER: PLUMBING]
 * 
 * Database Retry Logic
 * 
 * Implements exponential backoff for Firestore operations.
 * Handles network errors and transient failures.
 */

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors: readonly Error[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 3000,
  backoffFactor: 2,
  retryableErrors: [
    'failed to fetch',
    'network error',
    'ECONNRESET',
    'ETIMEDOUT',
  ] as Error[],
};

/**
 * Checks if an error should be retried
 */
function shouldRetry(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  return DEFAULT_RETRY_OPTIONS.retryableErrors.some(
    (retryable) => error.message.includes(retryable)
  );
}

/**
 * Implements exponential backoff with jitter
 */
function getDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    DEFAULT_RETRY_OPTIONS.initialDelayMs * 
    Math.pow(DEFAULT_RETRY_OPTIONS.backoffFactor, attempt - 1),
    DEFAULT_RETRY_OPTIONS.maxDelayMs
  );
  
  // Add jitter (±50% variance) to prevent thundering herd problem
  const jitter = exponentialDelay * 0.5 * (2 * Math.random() - 1);
  
  return Math.max(0, exponentialDelay + jitter);
}

/**
 * Wraps Firestore operations with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry non-retryable errors
      if (!shouldRetry(error) || attempt === config.maxAttempts) {
        throw error;
      }
      
      const delay = getDelay(attempt);
      
      // Log retry attempt
      console.warn(
        `Operation failed (attempt ${attempt}/${config.maxAttempts}). ` +
        `Retrying in ${Math.round(delay)}ms...`,
        error
      );
      
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  // Should never reach here, but just in case
  throw lastError;
}

/**
 * Creates a retry wrapper for Firestore fetch operations
 */
export function withEntityRetry<T>(
  fetchOperation: () => Promise<T>,
  entityName: string
): Promise<T> {
  return withRetry(
    fetchOperation,
    {
      maxAttempts: 5,
      initialDelayMs: 200,
      maxDelayMs: 5000,
      backoffFactor: 1.5,
      retryableErrors: ['failed to fetch', 'network error'] as Error[],
    }
  ).catch((error) => {
    throw new Error(
      `Failed to fetch ${entityName} after multiple attempts. ` +
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  });
}

/**
 * Batch operation with retry per item
 */
export async function withBatchRetry<T>(
  items: T[],
  operation: (item: T) => Promise<void>,
  options?: Partial<RetryOptions>
): Promise<void> {
  const results = await Promise.allSettled(
    items.map(async (item) => {
      await withRetry(() => operation(item), options);
    })
  );
  
  const failures = results.filter(
    (result) => result.status === 'rejected'
  );
  
  if (failures.length > 0) {
    throw new Error(
      `Batch operation completed with ${failures.length}/${results.length} failures`
    );
  }
}

/**
 * Wraps transaction operations with retry logic
 */
export async function withTransactionRetry<T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 8000,
    backoffFactor: 2,
    retryableErrors: [
      'already-exists',
      'not-found',
      'failed to fetch',
      'network error',
    ] as Error[],
    ...options,
  });
}