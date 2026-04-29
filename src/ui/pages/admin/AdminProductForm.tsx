'use client';

/**
 * [LAYER: UI]
 * Admin product editor — guided merchant product setup.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { CardRarity, Product, ProductCategory, ProductSalesChannel } from '@domain/models';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Package,
  Save,
  Search,
  Settings,
  Tag,
  Truck,
} from 'lucide-react';
import { validatePriceCents, validateStock } from '@utils/validators';
import { formatCurrency, humanizeCategory } from '@utils/formatters';
import { SkeletonPage, useToast } from '../../components/admin/AdminComponents';

const CATEGORIES: ProductCategory[] = [
  'booster',
  'single',
  'deck',
  'accessory',
  'box',
  'elite_trainer_box',
  'sealed_case',
  'graded_card',
  'supplies',
  'other',
];
const RARITIES: CardRarity[] = ['common', 'uncommon', 'rare', 'holo', 'secret'];
const SALES_CHANNELS: Array<{ value: ProductSalesChannel; label: string }> = [
  { value: 'online_store', label: 'Online store' },
  { value: 'pos', label: 'Point of sale' },
  { value: 'draft_order', label: 'Draft orders' },
];

function csvToList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function listToCsv(value: string[] | undefined) {
  return value?.join(', ') ?? '';
}

function centsFromInput(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

function integerFromInput(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function previewHandle(name: string, handle: string) {
  if (handle.trim()) return handle.trim();
  return (name || 'product-handle')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product-handle';
}

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const services = useServices();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: '',
    compareAtPrice: '',
    cost: '',
    stock: '',
    sku: '',
    barcode: '',
    trackQuantity: true,
    continueSellingWhenOutOfStock: false,
    reorderPoint: '',
    reorderQuantity: '',
    physicalItem: true,
    weightGrams: '',
    status: 'active' as 'active' | 'draft' | 'archived',
    salesChannels: ['online_store'] as ProductSalesChannel[],
    category: 'booster' as ProductCategory,
    productType: '',
    vendor: '',
    collections: '',
    tags: '',
    handle: '',
    seoTitle: '',
    seoDescription: '',
    manufacturer: '',
    supplier: '',
    manufacturerSku: '',
    set: '',
    rarity: '' as CardRarity | '',
    adminNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState(false);

  useEffect(() => {
    const title = isEdit ? `${form.name || 'Edit product'} · PlayMoreTCG Admin` : 'Add product · PlayMoreTCG Admin';
    document.title = title;
    return () => { document.title = 'PlayMoreTCG'; };
  }, [isEdit, form.name]);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoadingProduct(true);
    try {
      const product: Product = await services.productService.getProduct(id);
      setForm({
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: (product.price / 100).toFixed(2),
        compareAtPrice: product.compareAtPrice !== undefined ? (product.compareAtPrice / 100).toFixed(2) : '',
        cost: product.cost !== undefined ? (product.cost / 100).toFixed(2) : '',
        stock: String(product.stock),
        sku: product.sku ?? '',
        barcode: product.barcode ?? '',
        trackQuantity: product.trackQuantity ?? true,
        continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock ?? false,
        reorderPoint: product.reorderPoint !== undefined ? String(product.reorderPoint) : '',
        reorderQuantity: product.reorderQuantity !== undefined ? String(product.reorderQuantity) : '',
        physicalItem: product.physicalItem ?? true,
        weightGrams: product.weightGrams !== undefined ? String(product.weightGrams) : '',
        status: product.status,
        salesChannels: product.salesChannels ?? ['online_store'],
        category: product.category,
        productType: product.productType ?? '',
        vendor: product.vendor ?? '',
        collections: listToCsv(product.collections),
        tags: listToCsv(product.tags),
        handle: product.handle ?? '',
        seoTitle: product.seoTitle ?? '',
        seoDescription: product.seoDescription ?? '',
        manufacturer: product.manufacturer ?? '',
        supplier: product.supplier ?? '',
        manufacturerSku: product.manufacturerSku ?? '',
        set: product.set ?? '',
        rarity: product.rarity ?? '',
        adminNotes: '',
      });
    } catch {
      setError('Failed to load product for editing.');
    } finally {
      setLoadingProduct(false);
    }
  }, [id, services.productService]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setUnsaved(true);
  }

  function handleCheckbox(name: 'trackQuantity' | 'continueSellingWhenOutOfStock' | 'physicalItem', checked: boolean) {
    setForm((current) => ({ ...current, [name]: checked }));
    setUnsaved(true);
  }

  function toggleSalesChannel(channel: ProductSalesChannel) {
    setForm((current) => {
      const next = current.salesChannels.includes(channel)
        ? current.salesChannels.filter((item) => item !== channel)
        : [...current.salesChannels, channel];
      return { ...current, salesChannels: next };
    });
    setUnsaved(true);
  }

  const priceCents = centsFromInput(form.price) ?? 0;
  const costCents = centsFromInput(form.cost);
  const marginPercent = useMemo(() => {
    if (!costCents || priceCents <= 0) return null;
    return Math.round(((priceCents - costCents) / priceCents) * 1000) / 10;
  }, [costCents, priceCents]);

  const setupChecklist = [
    { label: 'Has image', done: Boolean(form.imageUrl.trim()) },
    { label: 'Has SKU', done: Boolean(form.sku.trim()) },
    { label: 'Has price', done: priceCents > 0 },
    { label: 'Has cost', done: costCents !== undefined },
    { label: 'Published to online store', done: form.status === 'active' && form.salesChannels.includes('online_store') },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const price = centsFromInput(form.price) ?? NaN;
    const compareAtPrice = centsFromInput(form.compareAtPrice);
    const cost = centsFromInput(form.cost);
    const stock = Number(form.stock);
    const priceValidation = validatePriceCents(price);
    const compareAtPriceValidation = compareAtPrice !== undefined ? validatePriceCents(compareAtPrice) : { valid: true };
    const costValidation = cost !== undefined ? validatePriceCents(cost) : { valid: true };
    const stockValidation = validateStock(stock);

    if (!priceValidation.valid || !compareAtPriceValidation.valid || !costValidation.valid || !stockValidation.valid) {
      setError(priceValidation.message ?? compareAtPriceValidation.message ?? costValidation.message ?? stockValidation.message ?? 'Product values are invalid');
      setSaving(false);
      return;
    }

    const data = {
      name: form.name,
      description: form.description,
      price,
      compareAtPrice,
      cost,
      category: form.category,
      productType: form.productType || undefined,
      vendor: form.vendor || undefined,
      tags: csvToList(form.tags),
      collections: csvToList(form.collections),
      handle: form.handle || undefined,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      salesChannels: form.salesChannels,
      stock,
      trackQuantity: form.trackQuantity,
      continueSellingWhenOutOfStock: form.continueSellingWhenOutOfStock,
      reorderPoint: integerFromInput(form.reorderPoint),
      reorderQuantity: integerFromInput(form.reorderQuantity),
      physicalItem: form.physicalItem,
      weightGrams: integerFromInput(form.weightGrams),
      sku: form.sku || undefined,
      manufacturer: form.manufacturer || undefined,
      supplier: form.supplier || undefined,
      manufacturerSku: form.manufacturerSku || undefined,
      barcode: form.barcode || undefined,
      imageUrl: form.imageUrl || 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
      status: form.status,
      set: form.set || undefined,
      rarity: (form.rarity as CardRarity) || undefined,
    };

    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      if (isEdit && id) {
        await services.productService.updateProduct(id, data, actor);
        toast('success', 'Product updated successfully');
      } else {
        await services.productService.createProduct(data, actor);
        toast('success', 'Product created successfully');
      }
      setUnsaved(false);
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (loadingProduct) return <SkeletonPage />;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/products')} className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-gray-500 shadow-sm transition hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">{isEdit ? form.name || 'Edit product' : 'New product'}</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">Guided merchant setup</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unsaved && <span className="hidden rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600 sm:inline-flex">Unsaved</span>}
          <button onClick={() => router.push('/admin/products')} className="rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50">Cancel</button>
          <button form="product-form" type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <form id="product-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Title + description</h2>
            <div className="space-y-4">
              <input name="name" value={form.name} onChange={handleChange} required placeholder="Product title" className="w-full rounded-lg border bg-gray-50 px-4 py-3 text-lg font-bold outline-none transition focus:ring-2 focus:ring-primary-500" />
              <textarea name="description" value={form.description} onChange={handleChange} required rows={6} placeholder="Describe condition, edition, contents, and sales details." className="w-full rounded-lg border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500" />
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><ImageIcon className="h-4 w-4" /> Media gallery</h2>
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image URL" className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500" />
            <p className="mt-2 text-xs text-gray-500">Phase 1 stores the primary image; full media arrays can land in the media/variants phase.</p>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Pricing</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <MoneyInput label="Price" name="price" value={form.price} onChange={handleChange} required />
              <MoneyInput label="Compare-at price" name="compareAtPrice" value={form.compareAtPrice} onChange={handleChange} />
              <MoneyInput label="Unit cost" name="cost" value={form.cost} onChange={handleChange} />
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
              <span className="font-bold text-gray-900">Margin preview: </span>
              <span className={marginPercent !== null && marginPercent < 15 ? 'font-bold text-red-600' : 'font-bold text-green-700'}>{marginPercent === null ? 'Add cost to calculate margin' : `${marginPercent}% gross margin`}</span>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Inventory</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput label="SKU" name="sku" value={form.sku} onChange={handleChange} placeholder="PM-1024-BS" />
              <TextInput label="Barcode / UPC" name="barcode" value={form.barcode} onChange={handleChange} />
              <TextInput label="Quantity available" name="stock" value={form.stock} onChange={handleChange} type="number" required />
              <TextInput label="Reorder point" name="reorderPoint" value={form.reorderPoint} onChange={handleChange} type="number" />
              <TextInput label="Reorder quantity" name="reorderQuantity" value={form.reorderQuantity} onChange={handleChange} type="number" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Checkbox label="Track quantity" checked={form.trackQuantity} onChange={(checked) => handleCheckbox('trackQuantity', checked)} />
              <Checkbox label="Continue selling when out of stock" checked={form.continueSellingWhenOutOfStock} onChange={(checked) => handleCheckbox('continueSellingWhenOutOfStock', checked)} />
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Truck className="h-4 w-4" /> Shipping / physical item</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Checkbox label="This is a physical item" checked={form.physicalItem} onChange={(checked) => handleCheckbox('physicalItem', checked)} />
              <TextInput label="Weight (grams)" name="weightGrams" value={form.weightGrams} onChange={handleChange} type="number" />
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Supplier & intake</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput label="Manufacturer" name="manufacturer" value={form.manufacturer} onChange={handleChange} placeholder="Pokémon, Ultra PRO…" />
              <TextInput label="Supplier / wholesaler" name="supplier" value={form.supplier} onChange={handleChange} />
              <TextInput label="Manufacturer SKU" name="manufacturerSku" value={form.manufacturerSku} onChange={handleChange} />
            </div>
            <textarea name="adminNotes" value={form.adminNotes} onChange={handleChange} rows={3} placeholder="Admin notes/history placeholder: invoice notes, supplier terms, receiving context…" className="mt-4 w-full rounded-lg border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500" />
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Variants / options</h2>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">Placeholder</span>
            </div>
            <p className="rounded-lg border-2 border-dashed bg-gray-50 p-6 text-center text-xs font-medium text-gray-500">Future variants can model condition, language, edition, finish, and grading details.</p>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Search className="h-4 w-4" /> SEO / handle</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="URL handle" name="handle" value={form.handle} onChange={handleChange} placeholder={previewHandle(form.name, '')} />
              <TextInput label="SEO title" name="seoTitle" value={form.seoTitle} onChange={handleChange} />
              <div className="md:col-span-2"><TextArea label="SEO description" name="seoDescription" value={form.seoDescription} onChange={handleChange} rows={3} /></div>
            </div>
            <div className="mt-4 rounded-lg border bg-gray-50 p-4">
              <p className="truncate text-sm font-medium text-[#1a0dab]">{form.seoTitle || form.name || 'Your Product Title'} | PlayMoreTCG</p>
              <p className="truncate text-xs text-[#006621]">https://playmoretcg.com/products/{previewHandle(form.name, form.handle)}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#4d5156]">{form.seoDescription || form.description || 'Add SEO details to preview how this product could appear in search results.'}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Globe className="h-4 w-4" /> Publishing</h2>
            <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none transition focus:ring-2 focus:ring-primary-500">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <div className="mt-4 space-y-2">
              {SALES_CHANNELS.map((channel) => <Checkbox key={channel.value} label={channel.label} checked={form.salesChannels.includes(channel.value)} onChange={() => toggleSalesChannel(channel.value)} />)}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Settings className="h-4 w-4" /> Product organization</h2>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</label><select name="category" value={form.category} onChange={handleChange} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500">{CATEGORIES.map((category) => <option key={category} value={category}>{humanizeCategory(category)}</option>)}</select></div>
              <TextInput label="Product type" name="productType" value={form.productType} onChange={handleChange} placeholder="Sealed booster box" />
              <TextInput label="Vendor / brand" name="vendor" value={form.vendor} onChange={handleChange} placeholder="Pokémon" />
              <TextInput label="Collections" name="collections" value={form.collections} onChange={handleChange} placeholder="Featured, Scarlet & Violet" />
              <TextInput label="Tags" name="tags" value={form.tags} onChange={handleChange} placeholder="Vintage, holo, sealed" />
              <TextInput label="Set / TCG collection" name="set" value={form.set} onChange={handleChange} placeholder="Base Set" />
              <div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Rarity</label><select name="rarity" value={form.rarity} onChange={handleChange} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500"><option value="">None</option>{RARITIES.map((rarity) => <option key={rarity} value={rarity}>{rarity.charAt(0).toUpperCase() + rarity.slice(1)}</option>)}</select></div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><CheckCircle2 className="h-4 w-4" /> Setup checklist</h2>
            <div className="space-y-3">
              {setupChecklist.map((item) => <div key={item.label} className="flex items-center justify-between text-xs font-bold"><span className={item.done ? 'text-gray-900' : 'text-gray-500'}>{item.label}</span><span className={item.done ? 'text-green-600' : 'text-amber-600'}>{item.done ? 'Done' : 'Needs work'}</span></div>)}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><BarChart3 className="h-4 w-4" /> Pricing insight</h2>
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-gray-500">Price</span><span>{formatCurrency(priceCents)}</span></div>
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-gray-500">Cost</span><span>{costCents !== undefined ? formatCurrency(costCents) : '—'}</span></div>
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-gray-500">Margin</span><span>{marginPercent === null ? 'Unknown' : `${marginPercent}%`}</span></div>
          </section>
        </aside>
      </form>
    </div>
  );
}

function TextInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label><input {...props} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm font-bold outline-none transition focus:ring-2 focus:ring-primary-500" /></div>;
}

function MoneyInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span><input {...props} type="number" step="0.01" className="w-full rounded-lg border bg-gray-50 py-2.5 pl-8 pr-4 text-sm font-bold outline-none transition focus:ring-2 focus:ring-primary-500" /></div></div>;
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label><textarea {...props} className="w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary-500" /></div>;
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />{label}</label>;
}
