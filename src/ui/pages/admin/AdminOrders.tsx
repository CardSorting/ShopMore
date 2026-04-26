'use client';

/**
 * [LAYER: UI]
 */
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useServices } from '../../hooks/useServices';
import type { Order, OrderStatus } from '@domain/models';
import { ChevronDown, PackageCheck, Search } from 'lucide-react';
import { formatCurrency, formatShortDate, humanizeOrderStatus, normalizeSearch } from '@utils/formatters';
import { nextOrderActionLabel } from '@domain/rules';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ORDER_STATUSES: Array<OrderStatus | 'all'> = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'shipped', 'cancelled'],
  shipped: ['shipped', 'delivered'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
};

export function AdminOrders() {
  const services = useServices();
  const [orders, setOrders] = useState<Order[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [cursor, setCursor] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await services.orderService.getAllOrders({
        limit: 25,
        cursor,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setOrders(result.orders);
      setNextCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [cursor, services.orderService, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function handleStatusChange(id: string, status: OrderStatus) {
    setUpdating(id);
    setError(null);
    try {
      await services.orderService.updateOrderStatus(id, status);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const needle = normalizeSearch(query);
    if (!needle) return true;
    return [
      order.id,
      order.userId,
      order.paymentTransactionId ?? '',
      ...order.items.map((item) => item.name),
    ].some((value) => normalizeSearch(value).includes(needle));
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Order operations</p>
        <h1 className="text-3xl font-bold text-gray-900">Order Processing</h1>
        <p className="mt-1 text-sm text-gray-500">Triage, inspect, and advance customer orders through fulfillment.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as OrderStatus | 'all');
              setCursor(undefined);
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{status === 'all' ? 'All statuses' : humanizeOrderStatus(status)}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order ID, customer ID, transaction, or item"
              className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? <div className="p-4">Loading...</div> : null}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Order ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Items</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Next action</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <Fragment key={o.id}>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button className="font-mono text-xs text-primary-700 hover:underline" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>
                      {o.id.slice(0, 12)}...
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="space-y-0.5">
                      {o.items.slice(0, 3).map((item) => (
                        <li key={item.productId} className="text-xs text-gray-600">
                          {item.name} x{item.quantity}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                        disabled={updating === o.id || NEXT_STATUSES[o.status].length === 1}
                        className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium border-0 cursor-pointer disabled:cursor-not-allowed ${STATUS_COLORS[o.status]}`}
                      >
                        {NEXT_STATUSES[o.status].map((status) => <option key={status} value={status}>{status === o.status ? nextOrderActionLabel(status) : nextOrderActionLabel(o.status)}</option>)}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatShortDate(o.createdAt)}
                  </td>
                </tr>
                {expandedOrderId === o.id && (
                  <tr className="border-b bg-gray-50">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900"><PackageCheck className="h-4 w-4" /> Fulfillment</h3>
                          <p className="text-xs text-gray-600">Customer: {o.userId}</p>
                          <p className="text-xs text-gray-600">Payment: {o.paymentTransactionId ?? 'Not captured'}</p>
                          <p className="text-xs text-gray-600">Updated: {formatShortDate(o.updatedAt)}</p>
                        </div>
                        <div>
                          <h3 className="mb-2 font-semibold text-gray-900">Shipping address</h3>
                          <p className="text-xs text-gray-600">{o.shippingAddress.street}</p>
                          <p className="text-xs text-gray-600">{o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.zip}</p>
                          <p className="text-xs text-gray-600">{o.shippingAddress.country}</p>
                        </div>
                        <div>
                          <h3 className="mb-2 font-semibold text-gray-900">Items</h3>
                          {o.items.map((item) => (
                            <p key={item.productId} className="text-xs text-gray-600">{item.name} — {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button className="rounded-md border px-4 py-2 text-sm disabled:opacity-50" disabled={!cursor} onClick={() => setCursor(undefined)}>First page</button>
        <button className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={!nextCursor} onClick={() => setCursor(nextCursor)}>Next page</button>
      </div>
    </div>
  );
}