'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useState } from 'react';
import { useServices } from '../../hooks/useServices';
import type { AdminDashboardSummary } from '@domain/models';
import Link from 'next/link';
import { ShoppingBag, AlertTriangle, DollarSign, Activity, TrendingUp, ArrowRight, Boxes } from 'lucide-react';
import { formatCurrency, formatShortDate, humanizeOrderStatus } from '@utils/formatters';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function AdminDashboard() {
  const services = useServices();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setSummary(await services.orderService.getAdminDashboardSummary());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [services]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!summary) return null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary-600">Admin command center</p>
        <h1 className="text-3xl font-bold text-gray-900">Today&apos;s work</h1>
        <p className="mt-1 text-sm text-gray-500">Start here: review what needs attention, then jump straight into the right workflow.</p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Needs attention</h2>
            <p className="text-sm text-gray-500">Action cards are prioritized for daily store staff.</p>
          </div>
          <Link href="/admin/orders" className="hidden text-sm font-medium text-primary-700 hover:underline sm:inline-flex">Open orders</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {summary.attentionItems.map((item) => (
            <Link key={item.id} href={item.href} className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${item.priority === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{item.label}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-500" />
              </div>
            </Link>
          ))}
          {summary.attentionItems.length === 0 && (
            <div className="rounded-xl border bg-green-50 p-4 text-sm text-green-800 md:col-span-3">Nothing urgent right now. Orders and inventory look healthy.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <Boxes className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-500">Out of stock</p>
              <p className="text-2xl font-bold">{summary.outOfStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Ready to ship</p>
              <p className="text-2xl font-bold">{summary.fulfillmentCounts.ready_to_ship}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-500">Average Order</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.averageOrderValue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-3">
          <h2 className="mb-4 font-semibold text-gray-900">Fulfillment pipeline</h2>
          <div className="grid gap-3 md:grid-cols-5">
            {Object.entries(summary.fulfillmentCounts).map(([bucket, count]) => (
              <div key={bucket} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">{bucket.replaceAll('_', ' ')}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Recent order activity</h2>
          </div>
          <div className="space-y-3">
            {summary.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-mono text-xs text-gray-500">{order.id.slice(0, 12)}...</p>
                  <p className="text-sm text-gray-700">{order.items.length} item groups • {formatShortDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {humanizeOrderStatus(order.status)}
                  </span>
                </div>
              </div>
            ))}
            {summary.recentOrders.length === 0 && <p className="text-sm text-gray-400">No orders yet.</p>}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-gray-900">Low stock watchlist</h2>
          </div>
          <div className="space-y-3">
            {summary.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
                <span className="font-medium text-amber-900">{product.name}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-amber-700">{product.stock} left</span>
              </div>
            ))}
            {summary.lowStockProducts.length === 0 && <p className="text-sm text-gray-400">Inventory levels are healthy.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}