"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServices } from '../../hooks/useServices';
import type { SupportTicket, TicketStatus } from '@domain/models';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Inbox,
  Filter,
  ChevronRight,
  PackageSearch
} from 'lucide-react';
import { formatShortDate, normalizeSearch } from '@utils/formatters';
import {
  AdminPageHeader,
  AdminEmptyState,
  SkeletonRow,
  useToast,
  useAdminPageTitle,
  AdminTab
} from '../../components/admin/AdminComponents';

const TICKET_TABS = [
  { label: 'All', value: 'all', icon: Inbox },
  { label: 'Open', value: 'open', icon: AlertCircle },
  { label: 'In Progress', value: 'in_progress', icon: Clock },
  { label: 'Waiting on Customer', value: 'waiting_on_customer', icon: MessageSquare },
  { label: 'Resolved', value: 'resolved', icon: CheckCircle2 },
];

export function AdminTickets() {
  useAdminPageTitle('Support Tickets');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Status counts for tabs
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: tickets.length };
    tickets.forEach(t => {
      map[t.status] = (map[t.status] || 0) + 1;
    });
    return map;
  }, [tickets]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await services.ticketService.listTickets({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setTickets(result || []);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [services.ticketService, statusFilter, toast]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    const needle = normalizeSearch(query);
    if (needle) {
      result = result.filter((ticket) => {
        return [
          ticket.id,
          ticket.customerEmail,
          ticket.customerName || '',
          ticket.subject,
          ticket.orderId || ''
        ].some((value) => normalizeSearch(value).includes(needle));
      });
    }
    return result;
  }, [tickets, query]);

  const getStatusBadge = (status: TicketStatus) => {
    const map: Record<TicketStatus, { bg: string, text: string, label: string }> = {
      open: { bg: 'bg-red-50', text: 'text-red-700', label: 'Open' },
      in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In Progress' },
      waiting_on_customer: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Waiting' },
      resolved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Resolved' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' }
    };
    const mapped = map[status] || map.open;
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${mapped.bg} ${mapped.text}`}>
        {mapped.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, { bg: string, text: string }> = {
      urgent: { bg: 'bg-red-100', text: 'text-red-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      low: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    const mapped = map[priority] || map.medium;
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${mapped.bg} ${mapped.text}`}>
        {priority.toUpperCase()}
      </span>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Support Tickets"
        subtitle="Manage customer inquiries, returns, and issues"
      />

      {/* ── Metric Grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Immediate Action</span>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{counts['open'] || 0}</p>
          <p className="text-xs font-bold text-gray-500">Unresolved Open Tickets</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Reply</span>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{counts['waiting_on_customer'] || 0}</p>
          <p className="text-xs font-bold text-gray-500">Waiting on Customer</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">In Progress</span>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{counts['in_progress'] || 0}</p>
          <p className="text-xs font-bold text-gray-500">Being Handled</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Resolved</span>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{counts['resolved'] || 0}</p>
          <p className="text-xs font-bold text-gray-500">Tickets Successfully Closed</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* ── Tabs ── */}
        <div className="flex items-center border-b px-2 overflow-x-auto scrollbar-hide">
          {TICKET_TABS.map((tab) => (
            <AdminTab
              key={tab.value}
              label={tab.label}
              count={tab.value === 'all' ? tickets.length : counts[tab.value]}
              active={statusFilter === tab.value}
              onClick={() => setStatusFilter(tab.value as TicketStatus | 'all')}
            />
          ))}
        </div>

        {/* ── Search Bar ── */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by customer, email, subject, or order..."
              className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Ticket</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Subject</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Priority</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} columns={6} />)}
              {!loading && filteredTickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/admin/tickets/${t.id}`)}
                  className="group cursor-pointer transition hover:bg-gray-50"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 tracking-tight">#{t.id.slice(0, 8).toUpperCase()}</span>
                      <ChevronRight className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-gray-600">
                    {formatShortDate(t.createdAt.toString())}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-bold text-gray-900 truncate">{t.customerName || t.customerEmail}</p>
                    <p className="text-[10px] text-gray-500 truncate">{t.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-medium text-gray-900 max-w-xs truncate">{t.subject}</p>
                    {t.orderId && <p className="text-[10px] text-gray-500 mt-0.5">Order #{t.orderId.slice(0,8)}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    {getPriorityBadge(t.priority)}
                  </td>
                  <td className="px-4 py-3.5">
                    {getStatusBadge(t.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredTickets.length === 0 && (
            <AdminEmptyState
              title="No tickets found"
              description="You're all caught up on customer support!"
              icon={MessageSquare}
            />
          )}
        </div>
      </div>
    </div>
  );
}
