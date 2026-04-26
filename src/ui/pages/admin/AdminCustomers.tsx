'use client';

/**
 * [LAYER: UI]
 * Admin customer management — CRM-style list with lifetime value (LTV) and
 * order frequency metrics. Inspired by Shopify's Customers module.
 */
import { useMemo, useState } from 'react';
import { 
  Search, 
  User, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  MoreHorizontal,
  Filter,
  Download,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatShortDate, normalizeSearch } from '@utils/formatters';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonPage, 
  useToast, 
  useAdminPageTitle 
} from '../../components/admin/AdminComponents';

// Mock customer data
const MOCK_CUSTOMERS = [
  { id: 'u1', name: 'Ash Ketchum', email: 'ash@pallet.town', orders: 12, spent: 45000, lastOrder: new Date('2026-04-25'), joined: new Date('2026-01-10') },
  { id: 'u2', name: 'Misty Waterflower', email: 'misty@cerulean.gym', orders: 8, spent: 28000, lastOrder: new Date('2026-04-20'), joined: new Date('2026-01-15') },
  { id: 'u3', name: 'Brock Harrison', email: 'brock@pewter.gym', orders: 5, spent: 15000, lastOrder: new Date('2026-03-12'), joined: new Date('2026-02-01') },
  { id: 'u4', name: 'Gary Oak', email: 'gary@profoak.com', orders: 25, spent: 120000, lastOrder: new Date('2026-04-26'), joined: new Date('2025-12-20') },
  { id: 'u5', name: 'Professor Oak', email: 'samuel@profoak.com', orders: 3, spent: 9000, lastOrder: new Date('2026-02-28'), joined: new Date('2026-02-15') },
  { id: 'u6', name: 'Team Rocket', email: 'meowth@giovanni.biz', orders: 0, spent: 0, lastOrder: null, joined: new Date('2026-04-01') },
];

export function AdminCustomers() {
  useAdminPageTitle('Customers');
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    return MOCK_CUSTOMERS.filter(c => 
      !needle || 
      c.name.toLowerCase().includes(needle) || 
      c.email.toLowerCase().includes(needle)
    ).sort((a, b) => b.spent - a.spent); // Default sort by LTV
  }, [query]);

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AdminPageHeader 
        title="Customers" 
        subtitle="Manage your customer base and track lifetime value."
        actions={
          <button 
            onClick={() => toast('info', 'Exporting customer data...')}
            className="flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Download className="h-4 w-4 text-gray-400" />
            Export
          </button>
        }
      />

      {/* ── Filters & Search ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search customers by name or email…" 
            className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
            <Filter className="h-4 w-4 text-gray-400" />
            More filters
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto styled-scrollbar">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Total Spent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Last Order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr key={customer.id} className="group transition hover:bg-gray-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{customer.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-gray-900">
                      <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium">{customer.orders}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                      <DollarSign className="h-3.5 w-3.5 text-green-500" />
                      {formatCurrency(customer.spent)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {customer.lastOrder ? (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatShortDate(customer.lastOrder)}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <AdminEmptyState 
            title="No customers found" 
            description="Adjust your search to find other customers." 
            icon={User} 
          />
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Customers</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{MOCK_CUSTOMERS.length}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-green-600 font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50">↑</span>
            +15% this month
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg. Lifetime Value</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(MOCK_CUSTOMERS.reduce((a, b) => a + b.spent, 0) / MOCK_CUSTOMERS.length)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-medium">
            Consistent with last quarter
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">New This Week</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">2</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 font-medium cursor-pointer hover:underline">
            View new customers <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
