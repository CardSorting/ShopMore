'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { Product, ProductCategory, CardRarity } from '@domain/models';
import { Save, ArrowLeft } from 'lucide-react';
import { validatePriceCents, validateStock } from '@utils/validators';
import { formatCurrency } from '@utils/formatters';

const CATEGORIES: ProductCategory[] = ['booster', 'single', 'deck', 'accessory', 'box'];
const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'holo', 'secret'];

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const services = useServices();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'booster' as ProductCategory,
    stock: '',
    imageUrl: '',
    set: '',
    rarity: '' as CardRarity | '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    const p: Product = await services.productService.getProduct(id);
      setForm({
        name: p.name,
        description: p.description,
        price: (p.price / 100).toFixed(2),
        category: p.category,
        stock: String(p.stock),
        imageUrl: p.imageUrl,
        set: p.set ?? '',
        rarity: p.rarity ?? '',
      });
  }, [id, services.productService]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const parsedPrice = Number(form.price);
    const price = Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) : NaN;
    const stock = Number(form.stock);
    const priceValidation = validatePriceCents(price);
    const stockValidation = validateStock(stock);

    if (!priceValidation.valid || !stockValidation.valid) {
      setError(priceValidation.message ?? stockValidation.message ?? 'Product values are invalid');
      setSaving(false);
      return;
    }

    const data = {
      name: form.name,
      description: form.description,
      price,
      category: form.category,
      stock,
      imageUrl: form.imageUrl || 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
      set: form.set || undefined,
      rarity: (form.rarity as CardRarity) || undefined,
    };

    try {
      if (isEdit && id) {
        await services.productService.updateProduct(id, data);
      } else {
        await services.productService.createProduct(data);
      }
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => router.push('/admin/products')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>
      <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Catalog setup</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {isEdit ? 'Edit Product' : 'New Product'}
      </h1>
      <p className="mb-6 text-sm text-gray-500">Use the guided sections below. Required fields are marked by the browser before saving.</p>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Basic details</h2>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price customers pay ($)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units available</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
            <select
              name="rarity"
              value={form.rarity}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">None</option>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Set</label>
          <input
            name="set"
            value={form.set}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Customer preview</h2>
            <div className="mt-4 overflow-hidden rounded-lg border">
              <img src={form.imageUrl || 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400'} alt="Product preview" className="h-40 w-full object-cover" />
              <div className="p-3">
                <p className="font-semibold text-gray-900">{form.name || 'Product name'}</p>
                <p className="mt-1 text-sm text-gray-500">{form.category}</p>
                <p className="mt-2 font-bold text-primary-700">{formatCurrency(Number.isFinite(Number(form.price)) ? Math.round(Number(form.price) * 100) : 0)}</p>
                <p className="mt-1 text-xs text-gray-500">{form.stock || 0} units available</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-primary-50 p-4 text-sm text-primary-900">
            <p className="font-semibold">Staff tip</p>
            <p className="mt-1">Keep names short, prices in dollars, and stock accurate so checkout availability stays reliable.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}