'use client';

/**
 * [LAYER: UI]
 * Admin customer management — CRM-style list with segments and LTV.
 * Patterns modeled after Shopify Customers for high-velocity management.
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
  ExternalLink,
  Users,
  Star,
  Clock,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { formatCurrency, formatShortDate, normalizeSearch } from '@utils/formatters';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonPage, 
  useToast, 
  useAdminPageTitle,
  AdminTab,
  AdminMetricCard
} from '../../components/admin/AdminComponents';

// Mock customer data
const MOCK_CUSTOMERS = [
  { id: 'u1', name: 'Ash Ketchum', email: 'ash@pallet.town', orders: 12, spent: 45000, lastOrder: new Date('2026-04-25'), joined: new Date('2026-01-10'), segment: 'big_spender' },
  { id: 'u2', name: 'Misty Waterflower', email: 'misty@cerulean.gym', orders: 8, spent: 28000, lastOrder: new Date('2026-04-20'), joined: new Date('2026-01-15'), segment: 'active' },
  { id: 'u3', name: 'Brock Harrison', email: 'brock@pewter.gym', orders: 5, spent: 15000, lastOrder: new Date('2026-03-12'), joined: new Date('2026-02-01'), segment: 'active' },
  { id: 'u4', name: 'Gary Oak', email: 'gary@profoak.com', orders: 25, spent: 120000, lastOrder: new Date('2026-04-26'), joined: new Date('2025-12-20'), segment: 'big_spender' },
  { id: 'u5', name: 'Professor Oak', email: 'samuel@profoak.com', orders: 3, spent: 9000, lastOrder: new Date('2026-02-28'), joined: new Date('2026-02-15'), segment: 'inactive' },
  { id: 'u6', name: 'Team Rocket', email: 'meowth@giovanni.biz', orders: 0, spent: 0, lastOrder: null, joined: new Date('2026-04-01'), segment: 'new' },
];

const SEGMENT_TABS = [
  { label: 'All', value: 'all', icon: Users },
  { label: 'Big Spenders', value: 'big_spender', icon: Star },
  { label: 'New', value: 'new', icon: UserPlus },
  { label: 'Inactive', value: 'inactive', icon: Clock },
];

export function AdminCustomers() {
  useAdminPageTitle('Customers');
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('all');
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    return MOCK_CUSTOMERS.filter(c => {
      const matchesSearch = !needle || c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle);
      const matchesSegment = segment === 'all' || c.segment === segment;
      return matchesSearch && matchesSegment;
    }).sort((a, b) => b.spent - a.spent);
  }, [query, segment]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: MOCK_CUSTOMERS.length };
    MOCK_CUSTOMERS.forEach(c => {
      map[c.segment] = (map[c.segment] || 0) + 1;
    });
    return map;
  }, []);

  if (loading) return <SkeletonPage />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <AdminPageHeader 
        title="Customers" 
        subtitle="Manage your customer base and track lifetime value"
        actions={
          <button 
            onClick={() => toast('info', 'Exporting customers...')}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5 text-gray-400" />
            Export CSV
          </button>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminMetricCard label="Total customers" value={MOCK_CUSTOMERS.length} icon={Users} color="info" />
        <AdminMetricCard 
          label="Avg. LTV" 
          value={formatCurrency(MOCK_CUSTOMERS.reduce((a, b) => a + b.spent, 0) / MOCK_CUSTOMERS.length)} 
          icon={DollarSign} 
          color="success" 
        />
        <AdminMetricCard label="New this week" value={1} icon={UserPlus} color="primary" />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* ── Tabs ── */}
        <div className="flex items-center border-b px-2 overflow-x-auto scrollbar-hide">
          {SEGMENT_TABS.map((tab) => (
            <AdminTab
              key={tab.value}
              label={tab.label}
              count={tab.value === 'all' ? MOCK_CUSTOMERS.length : (counts[tab.value] || 0)}
              active={segment === tab.value}
              onClick={() => setSegment(tab.value)}
            />
          ))}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search by name or email…" 
              className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition" 
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            Advanced
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Orders</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Spent</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className="group cursor-pointer transition hover:bg-gray-50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs uppercase">
                        {customer.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{customer.name}</p>
                        <p className="truncate text-[10px] font-medium text-gray-500 uppercase tracking-wider">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      customer.segment === 'big_spender' ? 'bg-purple-100 text-purple-700' :
                      customer.segment === 'active' ? 'bg-green-100 text-green-700' :
                      customer.segment === 'new' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {customer.segment.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-gray-900">
                    {customer.orders}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-gray-900 tracking-tight">
                    {formatCurrency(customer.spent)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-gray-500">
                    <div className="flex items-center justify-end gap-2">
                      <span>{customer.lastOrder ? formatShortDate(customer.lastOrder) : 'Never'}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <AdminEmptyState 
              title="No customers found" 
              description="Adjust your search or segment to find other customers." 
              icon={User} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
