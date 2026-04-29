/**
 * [LAYER: UI]
 * Purchase Orders — merchant-friendly inbound inventory and receiving workspace
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  Package,
  Plus,
  Search,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import {
  centsToDecimalInput,
  formatCurrency,
  normalizeSearch,
  parseCurrencyToCents,
} from '@utils/formatters';
import { purchaseOrderRules } from '@domain/rules';
import {
  AdminPageHeader,
  AdminMetricCard,
  AdminEmptyState,
  SkeletonPage,
  useToast,
  useAdminPageTitle,
} from '../../components/admin/AdminComponents';
import type {
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderLineReceivingSummary,
  PurchaseOrderReceivingSummary,
  PurchaseOrderSavedView,
  PurchaseOrderWorkflowStep,
} from '@domain/models';

type Services = ReturnType<typeof useServices>;
type StatusFilter = PurchaseOrderSavedView;
type ReceiveCondition = 'new' | 'damaged' | 'defective';

interface WorkspaceOrder {
  order: PurchaseOrder;
  summary: PurchaseOrderReceivingSummary;
  workflow: PurchaseOrderWorkflowStep[];
  lineSummaries: PurchaseOrderLineReceivingSummary[];
  attentionRequired: boolean;
}

interface PurchaseOrderWorkspace {
  countsByView: Record<PurchaseOrderSavedView, number>;
  orders: WorkspaceOrder[];
}

const SAVED_VIEWS: Array<{ value: StatusFilter; label: string; description: string; icon: LucideIcon }> = [
  { value: 'all', label: 'All', description: 'Every supplier order', icon: ClipboardList },
  { value: 'drafts', label: 'Draft', description: 'Not sent yet', icon: Clock },
  { value: 'incoming', label: 'Incoming', description: 'Ordered from suppliers', icon: Truck },
  { value: 'partially_received', label: 'Partial', description: 'Some stock arrived', icon: Package },
  { value: 'exceptions', label: 'Exceptions', description: 'Needs reconciliation', icon: AlertTriangle },
  { value: 'ready_to_close', label: 'Ready to close', description: 'Fully received', icon: CheckCircle2 },
  { value: 'closed', label: 'Closed', description: 'Completed records', icon: ClipboardCheck },
];

function emptyCounts(): Record<PurchaseOrderSavedView, number> {
  return {
    all: 0,
    drafts: 0,
    incoming: 0,
    partially_received: 0,
    ready_to_close: 0,
    exceptions: 0,
    closed: 0,
  };
}

function buildWorkspaceFromOrders(orders: PurchaseOrder[]): PurchaseOrderWorkspace {
  const workspaceOrders = orders.map((order) => {
    const lineSummaries = purchaseOrderRules.calculateLineReceivingSummaries(order);
    return {
      order,
      summary: purchaseOrderRules.calculateReceivingSummary(order),
      workflow: purchaseOrderRules.buildWorkflowSteps(order),
      lineSummaries,
      attentionRequired: lineSummaries.some((line) => line.attentionRequired),
    };
  });
  const countsByView = SAVED_VIEWS.reduce((acc, view) => {
    acc[view.value] = orders.filter((order) => purchaseOrderRules.matchesSavedView(order, view.value)).length;
    return acc;
  }, emptyCounts());
  return { countsByView, orders: workspaceOrders };
}

export function AdminPurchaseOrders() {
  useAdminPageTitle('Receiving');
  const services = useServices();
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<PurchaseOrderWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('incoming');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<WorkspaceOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<WorkspaceOrder | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const nextWorkspace = await services.purchaseOrderService.getWorkspace?.();
      setWorkspace(nextWorkspace ?? buildWorkspaceFromOrders(await services.purchaseOrderService.list({ limit: 100 })));
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to load receiving workspace');
    } finally {
      setLoading(false);
    }
  }, [services, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    const needle = normalizeSearch(query);
    return (workspace?.orders ?? []).filter(({ order }) => {
      const matchesView = purchaseOrderRules.matchesSavedView(order, statusFilter);
      const matchesSearch =
        !needle ||
        [order.supplier, order.referenceNumber ?? '', order.id, ...order.items.flatMap((item) => [item.productName, item.sku])]
          .some((value) => normalizeSearch(value).includes(needle));
      return matchesView && matchesSearch;
    });
  }, [workspace, statusFilter, query]);

  const counts = workspace?.countsByView ?? emptyCounts();
  const totalValue = (workspace?.orders ?? []).reduce((sum, { order }) => sum + order.totalCost, 0);
  const receivingCount = counts.incoming + counts.partially_received;

  const handleSubmit = async (id: string) => {
    try {
      await services.purchaseOrderService.submit(id);
      toast('success', 'Purchase order marked as incoming');
      await loadData();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Submit failed');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this purchase order? This keeps the record but stops receiving.')) return;
    try {
      await services.purchaseOrderService.cancel(id);
      toast('success', 'Purchase order cancelled');
      await loadData();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  const handleReceive = async (workspaceOrder: WorkspaceOrder) => {
    try {
      const guided = await services.purchaseOrderService.getGuided?.(workspaceOrder.order.id).catch(() => null);
      setReceivingOrder(guided ? {
        order: guided.order,
        summary: guided.summary,
        workflow: guided.workflow,
        lineSummaries: guided.lineSummaries ?? purchaseOrderRules.calculateLineReceivingSummaries(guided.order),
        attentionRequired: Boolean(guided.summary?.discrepancyCount),
      } : workspaceOrder);
    } catch {
      toast('error', 'Failed to load receiving details');
    }
  };

  const handleClose = async (workspaceOrder: WorkspaceOrder) => {
    const hasVariance = workspaceOrder.summary.openQty > 0 || workspaceOrder.attentionRequired;
    const reason = hasVariance
      ? prompt('Why are you closing with an exception? Example: supplier short-shipped, cancelled backorder, damaged on arrival.')
      : undefined;
    if (hasVariance && !reason?.trim()) return;
    try {
      await services.purchaseOrderService.close(workspaceOrder.order.id, {
        discrepancyReason: hasVariance ? 'missing_items' : undefined,
        notes: reason || undefined,
      });
      toast('success', 'Purchase order closed');
      await loadData();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Close failed');
    }
  };

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Receiving"
        subtitle="Create purchase orders, receive inbound stock, reconcile exceptions, and close supplier records with a familiar merchant workflow."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setStatusFilter('exceptions')} className="rounded-lg border px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50">
              Review exceptions
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95">
              <Plus className="h-3.5 w-3.5" /> Create purchase order
            </button>
          </div>
        }
      />

      <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><ClipboardCheck className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-bold text-gray-900">Inbound workflow</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">Shopify-style saved views keep non-technical users oriented: draft the supplier order, mark it incoming, count what arrived, resolve exceptions, then close the record.</p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          {['Draft', 'Incoming', 'Count', 'Reconcile', 'Close'].map((step, index) => (
            <div key={step} className="rounded-lg bg-gray-50 px-2 py-2"><div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-500 ring-1 ring-gray-200">{index + 1}</div>{step}</div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminMetricCard label="Drafts" value={counts.drafts} icon={Clock} color="primary" />
        <AdminMetricCard label="Needs receiving" value={receivingCount} icon={Truck} color="info" />
        <AdminMetricCard label="Exceptions" value={counts.exceptions} icon={AlertTriangle} color="warning" />
        <AdminMetricCard label="Ready to close" value={counts.ready_to_close} icon={CheckCircle2} color="success" />
        <AdminMetricCard label="Inbound value" value={formatCurrency(totalValue)} icon={DollarSign} color="primary" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center border-b px-2 overflow-x-auto scrollbar-hide">
          {SAVED_VIEWS.map((tab) => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)} className={`relative flex min-w-fit items-center gap-2 px-4 py-3 text-sm font-bold transition ${statusFilter === tab.value ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'}`} title={tab.description}>
              <tab.icon className="h-4 w-4" />{tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusFilter === tab.value ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>{counts[tab.value]}</span>
              {statusFilter === tab.value && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search supplier, PO, SKU, or product..." className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500" />
          </div>
          <p className="text-xs font-medium text-gray-500">Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> orders in <span className="font-bold text-gray-900">{SAVED_VIEWS.find((view) => view.value === statusFilter)?.label}</span></p>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredOrders.map((workspaceOrder) => (
            <PurchaseOrderCard
              key={workspaceOrder.order.id}
              workspaceOrder={workspaceOrder}
              onOpen={() => setDetail(workspaceOrder)}
              onSubmit={() => handleSubmit(workspaceOrder.order.id)}
              onCancel={() => handleCancel(workspaceOrder.order.id)}
              onReceive={() => handleReceive(workspaceOrder)}
              onClose={() => handleClose(workspaceOrder)}
            />
          ))}
        </div>
        {filteredOrders.length === 0 && <AdminEmptyState title="No purchase orders in this view" description="Create a purchase order or switch saved views to find supplier records." icon={Truck} />}
      </div>

      {showCreate && <CreatePurchaseOrderModal services={services} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void loadData(); }} />}
      {receivingOrder && <ReceiveItemsModal workspaceOrder={receivingOrder} services={services} onClose={() => setReceivingOrder(null)} onReceived={() => { setReceivingOrder(null); void loadData(); }} />}
      {detail && !receivingOrder && <DetailDrawer workspaceOrder={detail} onClose={() => setDetail(null)} onReceive={() => handleReceive(detail)} />}
    </div>
  );
}

function PurchaseOrderCard({ workspaceOrder, onOpen, onSubmit, onCancel, onReceive, onClose }: {
  workspaceOrder: WorkspaceOrder;
  onOpen: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  onReceive: () => void;
  onClose: () => void;
}) {
  const { order, summary, attentionRequired } = workspaceOrder;
  return (
    <div className="grid gap-4 p-4 transition hover:bg-gray-50 lg:grid-cols-[1.4fr_0.9fr_1fr_auto] lg:items-center">
      <button onClick={onOpen} className="text-left">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-gray-900 tracking-tight">PO {order.id.slice(0, 8)}</p>
          <PurchaseOrderStatusBadge status={order.status} />
          {attentionRequired && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-700">Exception</span>}
        </div>
        <p className="mt-1 text-sm font-medium text-gray-700">{order.supplier}</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{order.referenceNumber ? `Ref ${order.referenceNumber} · ` : ''}{order.items.length} SKUs · {summary.orderedQty} units</p>
      </button>
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-gray-500"><span>{summary.receivedQty} / {summary.orderedQty} received</span><span>{summary.progressPercent}%</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary-600" style={{ width: `${Math.min(100, summary.progressPercent)}%` }} /></div>
      </div>
      <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100"><p className="text-xs font-bold text-gray-900">{summary.nextActionLabel}</p><p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{summary.nextActionDescription}</p></div>
      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
        <span className="flex items-center rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700">{formatCurrency(order.totalCost)}</span>
        {order.status === 'draft' && <button onClick={onSubmit} className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700">Mark incoming</button>}
        {order.status === 'draft' && <button onClick={onCancel} className="rounded-lg border px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Cancel</button>}
        {purchaseOrderRules.canReceive(order) && <button onClick={onReceive} className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800">Receive</button>}
        {purchaseOrderRules.canClose(order) && <button onClick={onClose} className="rounded-lg border px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Close</button>}
      </div>
    </div>
  );
}

function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrder['status'] }) {
  const config: Record<PurchaseOrder['status'], { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
    ordered: { label: 'Incoming', className: 'bg-blue-50 text-blue-700' },
    partially_received: { label: 'Partial', className: 'bg-amber-50 text-amber-700' },
    received: { label: 'Ready to close', className: 'bg-green-50 text-green-700' },
    closed: { label: 'Closed', className: 'bg-slate-100 text-slate-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
  };
  const cfg = config[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cfg.className}`}>{cfg.label}</span>;
}

function CreatePurchaseOrderModal({ services, onClose, onCreated }: { services: Services; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [supplier, setSupplier] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Array<{ product: Product; orderedQty: number; unitCostInput: string; notes?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const loadProducts = useCallback(async (query: string) => {
    setSearching(true);
    try {
      const result = await services.productService.getProducts({ query, limit: 20 });
      setProducts(result.products);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Product search failed');
    } finally {
      setSearching(false);
    }
  }, [services, toast]);

  useEffect(() => {
    void loadProducts('');
  }, [loadProducts]);

  const addProduct = (product: Product) => {
    if (items.some((item) => item.product.id === product.id)) {
      toast('info', 'Product already added to this purchase order');
      return;
    }
    setItems([...items, { product, orderedQty: 1, unitCostInput: centsToDecimalInput(product.cost ?? 0) }]);
  };

  const updateItem = (index: number, updates: Partial<{ orderedQty: number; unitCostInput: string; notes: string }>) => {
    setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item));
  };

  const totalCost = items.reduce((sum, item) => sum + item.orderedQty * parseCurrencyToCents(item.unitCostInput), 0);

  const handleCreate = async () => {
    if (!supplier.trim()) { toast('error', 'Supplier name is required'); return; }
    if (items.length === 0) { toast('error', 'Add at least one product'); return; }
    if (items.some((item) => item.orderedQty <= 0)) { toast('error', 'Quantities must be greater than zero'); return; }
    setLoading(true);
    try {
      await services.purchaseOrderService.create({
        supplier,
        referenceNumber: reference || undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          orderedQty: item.orderedQty,
          unitCost: parseCurrencyToCents(item.unitCostInput),
          notes: item.notes || undefined,
        })),
      });
      toast('success', 'Purchase order created');
      onCreated();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-t-xl bg-white p-6 shadow-2xl sm:rounded-xl animate-in slide-in-from-bottom-4">
        <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-gray-900">Create purchase order</h2><p className="mt-1 text-xs text-gray-500">Search products by familiar names, SKU, or supplier fields—no raw IDs required.</p></div><button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button></div>
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2"><div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Supplier</label><input value={supplier} onChange={(event) => setSupplier(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Southern Hobby" /></div><div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Supplier reference</label><input value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Invoice or PO #" /></div></div>
            <div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Find products</label><div className="mt-1 flex gap-2"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void loadProducts(productQuery); }} className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Search name, SKU, set, supplier..." /></div><button onClick={() => void loadProducts(productQuery)} className="rounded-lg border px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Search</button></div></div>
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border bg-gray-50 p-2">
              {products.map((product) => <button key={product.id} onClick={() => addProduct(product)} className="w-full rounded-lg bg-white p-3 text-left ring-1 ring-gray-100 transition hover:ring-primary-200"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-gray-900">{product.name}</p><p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">SKU {product.sku || '—'} · Stock {product.stock}</p></div><span className="text-xs font-bold text-gray-700">{formatCurrency(product.cost ?? 0)}</span></div></button>)}
              {searching && <p className="p-3 text-xs font-bold text-gray-400">Searching products…</p>}
              {!searching && products.length === 0 && <p className="p-3 text-xs font-bold text-gray-400">No products found.</p>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-gray-900">Selected products</h3><p className="text-xs text-gray-500">Enter unit costs in dollars, like Stripe and Shopify forms.</p></div><span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">{formatCurrency(totalCost)}</span></div>
            <div className="space-y-2">
              {items.map((item, index) => <div key={item.product.id} className="rounded-xl border p-3"><div className="mb-3 flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-gray-900">{item.product.name}</p><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU {item.product.sku || '—'}</p></div><button onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} className="text-gray-400 hover:text-red-500"><XCircle className="h-4 w-4" /></button></div><div className="grid gap-2 sm:grid-cols-[90px_120px_1fr]"><div><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Qty</label><input type="number" min={1} value={item.orderedQty} onChange={(event) => updateItem(index, { orderedQty: parseInt(event.target.value, 10) || 0 })} className="mt-1 w-full rounded border px-2 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-500" /></div><div><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Unit cost</label><input value={item.unitCostInput} onChange={(event) => updateItem(index, { unitCostInput: event.target.value })} className="mt-1 w-full rounded border px-2 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-500" placeholder="0.00" /></div><div><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Line note</label><input value={item.notes ?? ''} onChange={(event) => updateItem(index, { notes: event.target.value })} className="mt-1 w-full rounded border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary-500" placeholder="Optional" /></div></div></div>)}
              {items.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm font-bold text-gray-400">Add products from search results to build this PO.</div>}
            </div>
            <div><label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Internal notes</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Payment terms, expected delivery, supplier contact..." /></div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4"><button onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100">Cancel</button><button onClick={handleCreate} disabled={loading} className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50">{loading ? 'Creating…' : 'Create purchase order'}</button></div>
      </div>
    </div>
  );
}

function ReceiveItemsModal({ workspaceOrder, services, onClose, onReceived }: { workspaceOrder: WorkspaceOrder; services: Services; onClose: () => void; onReceived: () => void }) {
  const { toast } = useToast();
  const { order } = workspaceOrder;
  const [items, setItems] = useState(order.items.map((item: PurchaseOrderItem) => ({ purchaseOrderItemId: item.id, productName: item.productName, sku: item.sku, orderedQty: item.orderedQty, alreadyReceived: item.receivedQty, toReceive: 0, condition: 'new' as ReceiveCondition, damagedQty: 0, discrepancyReason: 'damaged_items', disposition: 'add_to_stock', notes: '' })));
  const [sessionNotes, setSessionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const totalToReceive = items.reduce((sum, item) => sum + item.toReceive, 0);
  const receiveAllRemaining = () => setItems(items.map((item) => ({ ...item, toReceive: Math.max(0, item.orderedQty - item.alreadyReceived) })));

  const handleReceive = async () => {
    if (totalToReceive <= 0) { toast('error', 'Enter quantities to receive'); return; }
    setLoading(true);
    try {
      await services.purchaseOrderService.receive(order.id, { receivedBy: 'admin', idempotencyKey: crypto.randomUUID(), notes: sessionNotes || undefined, items: items.filter((item) => item.toReceive > 0).map((item) => ({ purchaseOrderItemId: item.purchaseOrderItemId, receivedQty: item.toReceive, damagedQty: item.condition === 'new' ? item.damagedQty : Math.max(item.damagedQty, item.toReceive), condition: item.condition, discrepancyReason: (item.condition !== 'new' || item.damagedQty > 0) ? item.discrepancyReason : undefined, disposition: item.disposition, notes: item.notes || undefined })) });
      toast('success', `Received ${totalToReceive} units`);
      onReceived();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Receive failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-t-xl bg-white p-6 shadow-2xl sm:rounded-xl animate-in slide-in-from-bottom-4">
        <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-gray-900">Receive inventory</h2><p className="mt-1 text-xs text-gray-500">PO {order.id.slice(0, 8)} · {order.supplier}</p></div><button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button></div>
        <div className="mb-4 grid gap-3 rounded-xl bg-gray-50 p-3 sm:grid-cols-4"><ReceivingStat label="Ordered" value={workspaceOrder.summary.orderedQty} /><ReceivingStat label="Received" value={workspaceOrder.summary.receivedQty} /><ReceivingStat label="Remaining" value={workspaceOrder.summary.openQty} /><button onClick={receiveAllRemaining} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary-700 ring-1 ring-primary-100 hover:bg-primary-50">Receive all remaining</button></div>
        <div className="space-y-3">
          {items.map((item, index) => {
            const remaining = Math.max(0, item.orderedQty - item.alreadyReceived);
            const needsReason = item.toReceive > 0 && (item.condition !== 'new' || item.damagedQty > 0);
            return <div key={item.purchaseOrderItemId} className="rounded-xl border p-4"><div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-bold text-gray-900">{item.productName}</p><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU {item.sku} · {item.alreadyReceived} received · {remaining} remaining</p></div>{remaining === 0 && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-green-700">Complete</span>}</div><div className="grid gap-2 md:grid-cols-[90px_140px_90px_140px_1fr]"><div><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Receive</label><input type="number" min={0} max={remaining} value={item.toReceive} onChange={(event) => { const next = [...items]; next[index] = { ...next[index], toReceive: Math.min(parseInt(event.target.value, 10) || 0, remaining) }; setItems(next); }} className="mt-1 w-full rounded border px-2 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-500" /></div><div><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Condition</label><select value={item.condition} onChange={(event) => { const next = [...items]; next[index] = { ...next[index], condition: event.target.value as ReceiveCondition }; setItems(next); }} className="mt-1 w-full rounded border bg-white px-2 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-500"><option value="new">Sellable</option><option value="damaged">Damaged</option><option value="defective">Defective</option></select></div><div><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Damaged</label><input type="number" min={0} max={item.toReceive} value={item.damagedQty} onChange={(event) => { const next = [...items]; next[index] = { ...next[index], damagedQty: Math.min(parseInt(event.target.value, 10) || 0, item.toReceive) }; setItems(next); }} className="mt-1 w-full rounded border px-2 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-500" /></div><div><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Disposition</label><select value={item.disposition} onChange={(event) => { const next = [...items]; next[index] = { ...next[index], disposition: event.target.value }; setItems(next); }} className="mt-1 w-full rounded border bg-white px-2 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-500"><option value="add_to_stock">Add to stock</option><option value="quarantine">Quarantine</option><option value="return_to_supplier">Return</option><option value="write_off">Write off</option></select></div><div><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Note</label><input value={item.notes} onChange={(event) => { const next = [...items]; next[index] = { ...next[index], notes: event.target.value }; setItems(next); }} className="mt-1 w-full rounded border px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary-500" placeholder="Optional" /></div></div>{needsReason && <div className="mt-3 rounded-lg bg-amber-50 p-3"><label className="text-[9px] font-black uppercase tracking-widest text-amber-700">Exception reason</label><select value={item.discrepancyReason} onChange={(event) => { const next = [...items]; next[index] = { ...next[index], discrepancyReason: event.target.value }; setItems(next); }} className="mt-1 w-full rounded border bg-white px-2 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-500"><option value="damaged_items">Damaged items</option><option value="missing_items">Missing items</option><option value="wrong_item">Wrong item</option><option value="overage">Extra quantity</option><option value="cost_mismatch">Cost mismatch</option><option value="other">Other</option></select></div>}</div>;
          })}
        </div>
        <div className="mt-4"><label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Receiving session notes</label><textarea value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="Carrier, box count, exception context..." /></div>
        <div className="mt-5 flex items-center justify-between border-t pt-4"><div><p className="text-sm font-bold text-gray-900">{totalToReceive} units selected</p><p className="text-xs text-gray-500">Only sellable stock with “Add to stock” updates inventory.</p></div><div className="flex gap-2"><button onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100">Cancel</button><button onClick={handleReceive} disabled={loading || totalToReceive <= 0} className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50">{loading ? 'Receiving…' : 'Confirm receive'}</button></div></div>
      </div>
    </div>
  );
}

function ReceivingStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-white p-3 text-center ring-1 ring-gray-100"><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p></div>;
}

function DetailDrawer({ workspaceOrder, onClose, onReceive }: { workspaceOrder: WorkspaceOrder; onClose: () => void; onReceive: () => void }) {
  const { order, summary, workflow, lineSummaries } = workspaceOrder;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-lg overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right-4">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6"><div><h2 className="text-lg font-bold text-gray-900">PO {order.id.slice(0, 8)}</h2><p className="text-xs text-gray-500">{order.supplier}</p></div><button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button></div>
        <div className="space-y-6 p-6">
          <div className="rounded-xl bg-primary-50 p-4"><p className="text-xs font-bold uppercase tracking-widest text-primary-700">Next action</p><p className="mt-1 text-lg font-bold text-gray-900">{summary.nextActionLabel}</p><p className="mt-1 text-sm text-gray-600">{summary.nextActionDescription}</p>{purchaseOrderRules.canReceive(order) && <button onClick={onReceive} className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700">Receive inventory</button>}</div>
          <div className="grid grid-cols-3 gap-3"><ReceivingStat label="Ordered" value={summary.orderedQty} /><ReceivingStat label="Received" value={summary.receivedQty} /><ReceivingStat label="Open" value={summary.openQty} /></div>
          <div><h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Workflow</h3><div className="space-y-2">{workflow.map((step) => <div key={step.id} className="flex items-center gap-3 rounded-lg border p-3"><div className={`h-3 w-3 rounded-full ${step.status === 'complete' ? 'bg-green-500' : step.status === 'current' ? 'bg-primary-600' : step.status === 'blocked' ? 'bg-red-400' : 'bg-gray-200'}`} /><div><p className="text-sm font-bold text-gray-900">{step.label}</p><p className="text-xs text-gray-500">{step.description}</p></div></div>)}</div></div>
          <div><h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Products</h3><div className="space-y-2">{lineSummaries.map((line) => <div key={line.purchaseOrderItemId} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-gray-900">{line.productName}</p><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU {line.sku}</p></div><div className="text-right"><p className="text-sm font-bold text-gray-900">{line.receivedQty} / {line.orderedQty}</p><p className="text-[10px] font-bold uppercase text-gray-400">{line.nextActionLabel}</p></div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${line.attentionRequired ? 'bg-amber-500' : 'bg-primary-600'}`} style={{ width: `${line.progressPercent}%` }} /></div></div>)}</div></div>
          <div className="flex items-center justify-between border-t pt-4"><span className="text-sm font-bold text-gray-500">Total cost</span><span className="text-xl font-bold text-gray-900">{formatCurrency(order.totalCost)}</span></div>
        </div>
      </div>
    </div>
  );
}
