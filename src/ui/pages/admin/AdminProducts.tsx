'use client';

/**
 * [LAYER: UI]
 * Admin product catalog — saved-view product operations for merchants.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type {
  ProductCategory,
  ProductManagementOverview,
  ProductManagementProduct,
  ProductSavedView,
  ProductStatus,
  ProductUpdate,
} from '@domain/models';
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronDown,
  DollarSign,
  Filter,
  ImageOff,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { formatCurrency, humanizeCategory, normalizeSearch } from '@utils/formatters';
import {
  AdminPageHeader,
  AdminMetricCard,
  AdminEmptyState,
  AdminStatusBadge,
  BulkActionBar,
  AdminConfirmDialog,
  SkeletonRow,
  useToast,
  useAdminPageTitle,
  AdminTab,
} from '../../components/admin/AdminComponents';

const PRODUCT_CATEGORIES: Array<ProductCategory | 'all'> = [
  'all',
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

const SAVED_VIEWS: Array<{ label: string; value: ProductSavedView; icon: typeof Package }> = [
  { label: 'All', value: 'all', icon: Package },
  { label: 'Active', value: 'active', icon: ArrowUpRight },
  { label: 'Drafts', value: 'drafts', icon: Pencil },
  { label: 'Low stock', value: 'low_stock', icon: AlertTriangle },
  { label: 'Missing SKU', value: 'missing_sku', icon: Tag },
  { label: 'No cost', value: 'missing_cost', icon: DollarSign },
  { label: 'Needs photos', value: 'needs_photos', icon: ImageOff },
  { label: 'Archived', value: 'archived', icon: Archive },
];

type ViewMode = 'list' | 'grid';
type InventoryFilter = 'all' | 'healthy' | 'low_stock' | 'out_of_stock';
type SetupFilter = 'all' | 'ready' | 'needs_attention' | 'missing_sku' | 'missing_cost' | 'missing_image';

type BulkPatch = {
  status?: ProductStatus | 'none';
  category?: ProductCategory | 'none';
  productType?: string;
  vendor?: string;
  supplier?: string;
  tags?: string;
  cost?: string;
  compareAtPrice?: string;
};

const EMPTY_BULK_PATCH: BulkPatch = {
  status: 'none',
  category: 'none',
  productType: '',
  vendor: '',
  supplier: '',
  tags: '',
  cost: '',
  compareAtPrice: '',
};

function issueLabel(issue: string) {
  return issue.replace(/^missing_/, 'Missing ').replace(/_/g, ' ');
}

function vendorLabel(product: ProductManagementProduct) {
  return product.vendor || product.supplier || product.manufacturer || '—';
}

function parseOptionalCents(value?: string) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

export function AdminProducts() {
  useAdminPageTitle('Products');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<ProductManagementProduct[]>([]);
  const [overview, setOverview] = useState<ProductManagementOverview | null>(null);
  const [activeView, setActiveView] = useState<ProductSavedView>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all');
  const [setupFilter, setSetupFilter] = useState<SetupFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteCandidate, setDeleteCandidate] = useState<ProductManagementProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkPatch, setBulkPatch] = useState<BulkPatch>(EMPTY_BULK_PATCH);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextOverview, savedView] = await Promise.all([
        services.productService.getProductManagementOverview(),
        services.productService.getProductSavedView(activeView, {
          limit: 500,
          query: query.trim() || undefined,
        }),
      ]);
      setOverview(nextOverview);
      setProducts(savedView.products);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [activeView, query, services.productService]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const vendorOptions = useMemo(() => {
    const values = new Set<string>();
    for (const product of products) {
      const label = vendorLabel(product);
      if (label !== '—') values.add(label);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const needle = normalizeSearch(query);
    return products.filter((product) => {
      const matchesSearch = !needle || [
        product.name,
        product.description,
        product.sku ?? '',
        product.barcode ?? '',
        product.vendor ?? '',
        product.supplier ?? '',
        product.manufacturer ?? '',
        product.productType ?? '',
        ...(product.tags ?? []),
        ...(product.collections ?? []),
      ].some((value) => normalizeSearch(value).includes(needle));
      const matchesCategory = category === 'all' || product.category === category;
      const matchesVendor = vendorFilter === 'all' || vendorLabel(product) === vendorFilter;
      const matchesInventory = inventoryFilter === 'all' || product.inventoryHealth === inventoryFilter;
      const matchesSetup = setupFilter === 'all'
        || product.setupStatus === setupFilter
        || product.setupIssues.includes(setupFilter as never);
      return matchesSearch && matchesCategory && matchesVendor && matchesInventory && matchesSetup;
    });
  }, [products, query, category, vendorFilter, inventoryFilter, setupFilter]);

  const viewCounts = useMemo(() => ({
    all: overview?.totalProducts ?? products.length,
    active: overview?.statusCounts.active ?? 0,
    drafts: overview?.statusCounts.draft ?? 0,
    low_stock: overview?.lowStockCount ?? 0,
    missing_sku: overview?.setupIssueCounts.missing_sku ?? 0,
    missing_cost: overview?.setupIssueCounts.missing_cost ?? 0,
    needs_photos: overview?.setupIssueCounts.missing_image ?? 0,
    archived: overview?.statusCounts.archived ?? 0,
  }), [overview, products.length]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const product of products) counts[product.category] = (counts[product.category] ?? 0) + 1;
    return counts;
  }, [products]);

  const needsAttentionCount = overview
    ? Object.values(overview.setupIssueCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.size === filteredProducts.length
      ? new Set()
      : new Set(filteredProducts.map((product) => product.id)));
  };

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      const user = await services.authService.getCurrentUser();
      await services.productService.deleteProduct(deleteCandidate.id, { id: user?.id || 'unknown', email: user?.email || 'system' });
      toast('success', `"${deleteCandidate.name}" deleted`);
      setDeleteCandidate(null);
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  async function applyBulkUpdate(override?: ProductUpdate) {
    if (selectedIds.size === 0) return;
    const updates: ProductUpdate = override ?? {};

    if (!override) {
      if (bulkPatch.status && bulkPatch.status !== 'none') updates.status = bulkPatch.status;
      if (bulkPatch.category && bulkPatch.category !== 'none') updates.category = bulkPatch.category;
      if (bulkPatch.productType?.trim()) updates.productType = bulkPatch.productType.trim();
      if (bulkPatch.vendor?.trim()) updates.vendor = bulkPatch.vendor.trim();
      if (bulkPatch.supplier?.trim()) updates.supplier = bulkPatch.supplier.trim();
      if (bulkPatch.tags?.trim()) updates.tags = bulkPatch.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
      const cost = parseOptionalCents(bulkPatch.cost);
      const compareAtPrice = parseOptionalCents(bulkPatch.compareAtPrice);
      if (cost !== undefined) updates.cost = cost;
      if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice;
    }

    if (Object.keys(updates).length === 0) {
      toast('info', 'Choose at least one bulk field to update');
      return;
    }

    setSavingBulk(true);
    try {
      const user = await services.authService.getCurrentUser();
      const actor = { id: user?.id || 'unknown', email: user?.email || 'system' };
      await services.productService.batchUpdateProducts(
        Array.from(selectedIds).map((id) => ({ id, updates })),
        actor,
      );
      toast('success', `Updated ${selectedIds.size} products`);
      setBulkPatch(EMPTY_BULK_PATCH);
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setSavingBulk(false);
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const user = await services.authService.getCurrentUser();
      await services.productService.batchDeleteProducts(Array.from(selectedIds), { id: user?.id || 'unknown', email: user?.email || 'system' });
      toast('success', `${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''} deleted`);
      await loadProducts();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to delete products');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <AdminPageHeader
        title="Products"
        subtitle="Manage listings, saved views, setup issues, margins, and bulk catalog operations"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/products/bulk-edit" className="hidden rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:inline-flex">
              Bulk editor
            </Link>
            <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </div>
        }
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard label="Total products" value={overview?.totalProducts ?? '—'} icon={Package} color="info" onClick={() => setActiveView('all')} />
        <AdminMetricCard label="Active" value={overview?.statusCounts.active ?? '—'} icon={ArrowUpRight} color="success" onClick={() => setActiveView('active')} />
        <AdminMetricCard label="Needs attention" value={needsAttentionCount} icon={AlertTriangle} color={needsAttentionCount > 0 ? 'warning' : 'success'} description="Setup issue signals" />
        <AdminMetricCard label="Low stock" value={overview?.lowStockCount ?? '—'} icon={Boxes} color={(overview?.lowStockCount ?? 0) > 0 ? 'warning' : 'success'} onClick={() => setActiveView('low_stock')} />
        <AdminMetricCard label="Missing SKU / cost" value={`${overview?.setupIssueCounts.missing_sku ?? 0} / ${overview?.setupIssueCounts.missing_cost ?? 0}`} icon={Tag} color="danger" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-4">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {SAVED_VIEWS.map((view) => (
              <AdminTab
                key={view.value}
                label={view.label}
                count={viewCounts[view.value]}
                active={activeView === view.value}
                icon={view.icon}
                onClick={() => setActiveView(view.value)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 border-b bg-gray-50/40 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products by name, SKU, barcode, supplier, tag…"
                className="w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory | 'all')} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                {PRODUCT_CATEGORIES.map((item) => <option key={item} value={item}>{item === 'all' ? 'All categories' : humanizeCategory(item)} ({categoryCounts[item] ?? 0})</option>)}
              </select>
              <select value={vendorFilter} onChange={(event) => setVendorFilter(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Any vendor/supplier</option>
                {vendorOptions.map((vendor) => <option key={vendor} value={vendor}>{vendor}</option>)}
              </select>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <select value={inventoryFilter} onChange={(event) => setInventoryFilter(event.target.value as InventoryFilter)} className="appearance-none rounded-lg border bg-white py-2 pl-9 pr-8 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="all">Any inventory</option>
                  <option value="healthy">Healthy</option>
                  <option value="low_stock">Low stock</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              </div>
              <select value={setupFilter} onChange={(event) => setSetupFilter(event.target.value as SetupFilter)} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500">
                <option value="all">Any setup</option>
                <option value="ready">Ready</option>
                <option value="needs_attention">Needs attention</option>
                <option value="missing_sku">Missing SKU</option>
                <option value="missing_cost">No cost</option>
                <option value="missing_image">Needs photos</option>
              </select>
              <div className="flex rounded-lg border bg-white p-0.5">
                <button onClick={() => setViewMode('list')} className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><List className="h-3.5 w-3.5" /></button>
                <button onClick={() => setViewMode('grid')} className={`rounded-md p-1.5 transition ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-12 px-4 py-3"><input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === filteredProducts.length} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /></th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Product</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Inventory</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Category / type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Vendor / supplier</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">SKU</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Price</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Cost / margin</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} columns={10} />)}
                {!loading && filteredProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  return (
                    <tr key={product.id} className={`group transition hover:bg-gray-50 ${isSelected ? 'bg-primary-50/40' : ''}`}>
                      <td className="px-4 py-3.5"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt="" className="h-10 w-10 rounded border object-cover bg-gray-50" />
                          <div className="min-w-0">
                            <Link href={`/admin/products/${product.id}/edit`} className="block font-bold text-gray-900 truncate hover:text-primary-600 transition-colors">{product.name}</Link>
                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{product.setupIssues.length ? product.setupIssues.slice(0, 2).map(issueLabel).join(' · ') : 'Ready to sell'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><AdminStatusBadge status={product.status} type="order" /></td>
                      <td className="px-4 py-3.5"><div className="flex items-center gap-2"><AdminStatusBadge status={product.inventoryHealth} type="inventory" /><span className="text-xs font-bold text-gray-900">{product.stock}</span></div></td>
                      <td className="px-4 py-3.5"><div className="text-xs font-bold text-gray-900">{humanizeCategory(product.category)}</div><div className="text-[10px] text-gray-500">{product.productType || 'No type'}</div></td>
                      <td className="px-4 py-3.5 text-xs font-bold text-gray-700">{vendorLabel(product)}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-gray-600">{product.sku || '—'}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3.5 text-right"><div className="font-bold text-gray-900">{product.cost !== undefined ? formatCurrency(product.cost) : '—'}</div><div className="text-[10px] uppercase tracking-wider text-gray-500">{product.grossMarginPercent === null ? product.marginHealth : `${product.grossMarginPercent}%`}</div></td>
                      <td className="px-4 py-3.5 text-right"><button onClick={() => setDeleteCandidate(product)} className="p-2 text-gray-400 transition hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 border-t">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.has(product.id);
              return (
                <div key={product.id} onClick={() => toggleSelect(product.id)} className={`group relative bg-white p-4 transition hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-primary-50/40' : ''}`}>
                  <div className="aspect-square w-full overflow-hidden rounded-lg border bg-gray-50 mb-3"><img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{humanizeCategory(product.category)} · {product.status}</p>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-[10px] font-medium text-gray-500 truncate">{product.sku ? `SKU ${product.sku}` : vendorLabel(product)}</p>
                    <div className="flex items-center justify-between pt-1"><span className="text-sm font-bold text-primary-600">{formatCurrency(product.price)}</span><span className={`text-[10px] font-bold ${product.inventoryHealth !== 'healthy' ? 'text-amber-600' : 'text-gray-400'}`}>{product.stock} units</span></div>
                  </div>
                  <div className={`absolute top-2 right-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}><div className="h-5 w-5 rounded-full bg-primary-600 flex items-center justify-center border-2 border-white shadow-sm"><Check className="h-3 w-3 text-white stroke-[3px]" /></div></div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && <AdminEmptyState title="No products found" description="Try another saved view, search term, or filter combination." icon={Package} />}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={
          <>
            <button onClick={() => router.push(`/admin/products/bulk-edit?ids=${Array.from(selectedIds).join(',')}`)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Spreadsheet edit</button>
            <button onClick={() => void applyBulkUpdate({ status: 'active' })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Set active</button>
            <button onClick={() => void applyBulkUpdate({ status: 'archived' })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition">Archive</button>
            <button onClick={bulkDelete} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/30 transition border border-red-500/30">Delete</button>
          </>
        }
      />

      {selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 z-40 w-[min(920px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Bulk edit selected products</h3><span className="text-xs font-bold text-gray-400">{selectedIds.size} selected</span></div>
          <div className="grid gap-2 md:grid-cols-4">
            <select value={bulkPatch.status} onChange={(event) => setBulkPatch((patch) => ({ ...patch, status: event.target.value as BulkPatch['status'] }))} className="rounded-lg border px-3 py-2 text-xs font-bold"><option value="none">Status unchanged</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
            <select value={bulkPatch.category} onChange={(event) => setBulkPatch((patch) => ({ ...patch, category: event.target.value as BulkPatch['category'] }))} className="rounded-lg border px-3 py-2 text-xs font-bold"><option value="none">Category unchanged</option>{PRODUCT_CATEGORIES.filter((item) => item !== 'all').map((item) => <option key={item} value={item}>{humanizeCategory(item)}</option>)}</select>
            <input value={bulkPatch.productType} onChange={(event) => setBulkPatch((patch) => ({ ...patch, productType: event.target.value }))} placeholder="Product type" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.vendor} onChange={(event) => setBulkPatch((patch) => ({ ...patch, vendor: event.target.value }))} placeholder="Vendor / brand" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.supplier} onChange={(event) => setBulkPatch((patch) => ({ ...patch, supplier: event.target.value }))} placeholder="Supplier" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.tags} onChange={(event) => setBulkPatch((patch) => ({ ...patch, tags: event.target.value }))} placeholder="Tags, comma separated" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.cost} onChange={(event) => setBulkPatch((patch) => ({ ...patch, cost: event.target.value }))} placeholder="Cost" type="number" step="0.01" className="rounded-lg border px-3 py-2 text-xs font-bold" />
            <input value={bulkPatch.compareAtPrice} onChange={(event) => setBulkPatch((patch) => ({ ...patch, compareAtPrice: event.target.value }))} placeholder="Compare-at price" type="number" step="0.01" className="rounded-lg border px-3 py-2 text-xs font-bold" />
          </div>
          <div className="mt-3 flex justify-end"><button disabled={savingBulk} onClick={() => void applyBulkUpdate()} className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{savingBulk ? 'Applying…' : 'Apply bulk changes'}</button></div>
        </div>
      )}

      <AdminConfirmDialog open={!!deleteCandidate} onClose={() => setDeleteCandidate(null)} onConfirm={confirmDelete} title="Delete product?" description={`"${deleteCandidate?.name}" will be permanently removed from your catalog. This cannot be undone.`} confirmLabel="Delete" loading={deleting} variant="danger" />
    </div>
  );
}
