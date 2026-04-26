'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useServices } from '../../hooks/useServices';
import type { Product, ProductCategory } from '@domain/models';
import { Plus, Pencil, Search, Trash2 } from 'lucide-react';
import { formatCurrency, humanizeCategory, normalizeSearch } from '@utils/formatters';

const CATEGORIES: Array<ProductCategory | 'all'> = ['all', 'booster', 'single', 'deck', 'accessory', 'box'];
type StockFilter = 'all' | 'low' | 'healthy';

export function AdminProducts() {
  const services = useServices();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await services.productService.getProducts({
        limit: 100,
        category: category === 'all' ? undefined : category,
      });
      setProducts(result.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [category, services.productService]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await services.productService.deleteProduct(deleteCandidate.id);
      setDeleteCandidate(null);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const needle = normalizeSearch(query);
    return products.filter((product) => {
      const matchesSearch = !needle || [product.name, product.description, product.set ?? '', product.rarity ?? '']
        .some((value) => normalizeSearch(value).includes(needle));
      const matchesStock = stockFilter === 'all'
        || (stockFilter === 'low' && product.stock < 5)
        || (stockFilter === 'healthy' && product.stock >= 5);
      return matchesSearch && matchesStock;
    });
  }, [products, query, stockFilter]);

  const lowStockCount = products.filter((product) => product.stock < 5).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Catalog operations</p>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="mt-1 text-sm text-gray-500">Maintain sellable inventory, pricing, and merchandising data.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Loaded products</p><p className="text-2xl font-bold">{products.length}</p></div>
        <div className="rounded-lg border bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Low stock</p><p className="text-2xl font-bold text-amber-700">{lowStockCount}</p></div>
        <div className="rounded-lg border bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">Filtered view</p><p className="text-2xl font-bold">{filteredProducts.length}</p></div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, set, rarity, or description" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory | 'all')} className="rounded-md border px-3 py-2 text-sm">
            {CATEGORIES.map((value) => <option key={value} value={value}>{value === 'all' ? 'All categories' : humanizeCategory(value)}</option>)}
          </select>
          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)} className="rounded-md border px-3 py-2 text-sm">
            <option value="all">All stock</option>
            <option value="low">Low stock</option>
            <option value="healthy">Healthy stock</option>
          </select>
        </div>
      </div>

      {loading && <div className="p-4">Loading...</div>}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.set && <p className="text-xs text-gray-500">{p.set}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{humanizeCategory(p.category)}</td>
                <td className="px-4 py-3">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                      p.stock < 5
                        ? 'bg-red-100 text-red-700'
                        : p.stock < 20
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-gray-500 hover:text-primary-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteCandidate(p)}
                      className="text-gray-500 hover:text-red-600"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400 text-sm">No products match the current filters</div>
        )}
      </div>

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Delete product?</h2>
            <p className="mt-2 text-sm text-gray-600">
              This permanently removes <span className="font-medium">{deleteCandidate.name}</span> from the catalog.
              Customers will no longer be able to view or purchase it.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
                className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}