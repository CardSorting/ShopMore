/**
 * [LAYER: PLUMBING]
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function humanizeOrderStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function humanizeCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}