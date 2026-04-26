'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { InventoryHealth, InventoryOverview } from '@domain/models';
import { AlertTriangle, CheckCircle2, PackageSearch, Search } from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, humanizeCategory, normalizeSearch } from '@utils/formatters';

const HEALTH_COPY: Record<InventoryHealth, { label: string; tone: string; action: string }> = {
  out_of_stock: { label: 'Out of stock', tone: 'bg-red-100 text-red-800', action: 'Unavailable — restock before promoting' },
  low_stock: { label: 'Low stock', tone: 'bg-amber-100 text-amber-800', action: 'Restock soon' },
  healthy: { label: 'Healthy', tone: 'bg-green-100 text-green-800', action: 'No action needed' },
};

type HealthFilter = InventoryHealth | 'all';

export function AdminInventory() {
  const services = useServices();
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<HealthFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setOverview(await services.productService.getInventoryOverview());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [services]);

  const products = useMemo(() => {
    const needle = normalizeSearch(query);
    return (overview?.products ?? []).filter((product) => {
      const matchesHealth = health === 'all' || product.inventoryHealth === health;
      const matchesSearch = !needle || [product.name, product.set ?? '', product.category, product.rarity ?? '']
        .some((value) => normalizeSearch(value).includes(needle));
      return matchesHealth && matchesSearch;
    });
  }, [health, overview, query]);

  if (loading) return <div className="p-4">Loading inventory...</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!overview) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Inventory control</p>
        <h1 className="text-3xl font-bold text-gray-900">Stock Room</h1>
        <p className="mt-1 text-sm text-gray-500">Plain-language restock priorities for staff running daily operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Products</p><p className="text-2xl font-bold">{overview.totalProducts}</p></div>
        <div className="rounded-lg border bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Units on hand</p><p className="text-2xl font-bold">{overview.totalUnits}</p></div>
        <div className="rounded-lg border bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Inventory value</p><p className="text-2xl font-bold">{formatCurrency(overview.inventoryValue)}</p></div>
        <div className="rounded-lg border bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Needs attention</p><p className="text-2xl font-bold text-amber-700">{overview.healthCounts.out_of_stock + overview.healthCounts.low_stock}</p></div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, set, category, or rarity" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
          </div>
          <select value={health} onChange={(event) => setHealth(event.target.value as HealthFilter)} className="rounded-md border px-3 py-2 text-sm">
            <option value="all">All stock health</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="low_stock">Low stock</option>
            <option value="healthy">Healthy</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50"><tr><th className="px-4 py-3 text-left font-medium text-gray-500">Product</th><th className="px-4 py-3 text-left font-medium text-gray-500">Stock health</th><th className="px-4 py-3 text-left font-medium text-gray-500">Action</th><th className="px-4 py-3 text-left font-medium text-gray-500">Value</th><th className="px-4 py-3 text-left font-medium text-gray-500">Edit</th></tr></thead>
          <tbody>
            {products.map((product) => {
              const copy = HEALTH_COPY[product.inventoryHealth];
              return (
                <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={product.imageUrl} alt="" className="h-10 w-10 rounded object-cover" /><div><p className="font-medium text-gray-900">{product.name}</p><p className="text-xs text-gray-500">{humanizeCategory(product.category)} • {product.stock} units</p></div></div></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${copy.tone}`}>{product.inventoryHealth === 'healthy' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}{copy.label}</span></td>
                  <td className="px-4 py-3 text-gray-700">{copy.action}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(product.stock * product.price)}</td>
                  <td className="px-4 py-3"><Link href={`/admin/products/${product.id}/edit`} className="text-primary-700 hover:underline">Edit product</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <div className="flex items-center justify-center gap-2 p-8 text-sm text-gray-400"><PackageSearch className="h-4 w-4" />No inventory matches this view.</div>}
      </div>
    </div>
  );
}