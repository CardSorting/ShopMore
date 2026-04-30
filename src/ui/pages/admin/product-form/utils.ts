export function csvToList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function listToCsv(value: string[] | undefined) {
  return value?.join(', ') ?? '';
}

export function centsFromInput(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

export function integerFromInput(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function previewHandle(name: string, handle: string) {
  if (handle.trim()) return handle.trim();
  return (name || 'product-handle')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product-handle';
}
