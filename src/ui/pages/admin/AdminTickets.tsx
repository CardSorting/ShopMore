import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, Search, CheckCircle2, Clock, AlertCircle, Inbox, Filter, 
  ChevronRight, User, Users, Star, Archive, BarChart3, Tag, HelpCircle,
  AlertTriangle, History, CheckSquare, Square, MoreHorizontal, UserPlus,
  ArrowRightCircle, Mail, RotateCw, X
} from 'lucide-react';
import { useServices } from '../../hooks/useServices';
import { useAuth } from '../../hooks/useAuth';
import type { SupportTicket, TicketStatus, TicketPriority } from '@domain/models';
import { formatShortDate, normalizeSearch } from '@utils/formatters';
import {
  AdminPageHeader,
  AdminEmptyState,
  SkeletonRow,
  useToast,
  useAdminPageTitle,
} from '../../components/admin/AdminComponents';

interface TicketView {
  id: string;
  label: string;
  icon: any;
  filter: (t: SupportTicket) => boolean;
  color: string;
}

export function AdminTickets() {
  useAdminPageTitle('Support Tickets');
  const services = useServices();
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeView, setActiveView] = useState('unsolved');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const VIEWS: TicketView[] = [
    { id: 'unsolved', label: 'Unsolved Tickets', icon: Inbox, color: 'text-blue-600', filter: (t) => t.status !== 'solved' && t.status !== 'closed' },
    { id: 'new', label: 'New Tickets', icon: AlertCircle, color: 'text-red-600', filter: (t) => t.status === 'new' },
    { id: 'pending', label: 'Pending Tickets', icon: Clock, color: 'text-amber-600', filter: (t) => t.status === 'pending' },
    { id: 'solved', label: 'Recently Solved', icon: CheckCircle2, color: 'text-green-600', filter: (t) => t.status === 'solved' },
    { id: 'unassigned', label: 'Unassigned', icon: Users, color: 'text-gray-600', filter: (t) => !t.assigneeId && t.status !== 'closed' },
    { id: 'high-priority', label: 'High Priority', icon: AlertTriangle, color: 'text-purple-600', filter: (t) => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'closed' },
    { id: 'all', label: 'All Tickets', icon: History, color: 'text-gray-400', filter: () => true },
  ];

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const result = await services.ticketService.listTickets();
      setTickets(result || []);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [services.ticketService, toast]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const viewCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    VIEWS.forEach(v => {
      counts[v.id] = tickets.filter(v.filter).length;
    });
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const view = VIEWS.find(v => v.id === activeView);
    let result = tickets.filter(view?.filter || (() => true));
    
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
  }, [tickets, activeView, query]);

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTickets.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkUpdate = async (updates: Partial<SupportTicket>) => {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      await services.ticketService.batchUpdateTickets(Array.from(selectedIds), updates);
      toast('success', `Updated ${selectedIds.size} tickets`);
      setSelectedIds(new Set());
      await loadTickets();
    } catch (err) {
      toast('error', 'Failed to update tickets');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleAcceptNext = async () => {
    const unassigned = tickets.find(t => !t.assigneeId && t.status !== 'solved' && t.status !== 'closed');
    if (!unassigned || !currentUser) {
      toast('error', 'No unassigned tickets found');
      return;
    }
    try {
      await services.ticketService.updateTicketProperties(unassigned.id, {
        assigneeId: currentUser.id,
        assigneeName: currentUser.displayName || 'Admin',
        status: unassigned.status === 'new' ? 'open' : unassigned.status
      });
      router.push(`/admin/tickets/${unassigned.id}`);
    } catch (err) {
      toast('error', 'Failed to assign ticket');
    }
  };

  const getSLAInfo = (ticket: SupportTicket) => {
    if (ticket.status === 'solved' || ticket.status === 'closed') {
      return { label: 'Achieved', color: 'text-green-500', bg: 'bg-green-50', percent: 100 };
    }
    
    // Fallback if no deadline exists (should be calculated on create)
    const deadline = ticket.slaDeadline || new Date(ticket.createdAt.getTime() + (24 * 60 * 60 * 1000));
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const totalSLA = 24 * 60 * 60 * 1000; // 24h default
    const elapsed = totalSLA - Math.max(0, diff);
    const percent = Math.min(100, (elapsed / totalSLA) * 100);

    if (diff < 0) {
      const hours = Math.abs(Math.floor(diff / (60 * 60 * 1000)));
      return { label: `${hours}h Overdue`, color: 'text-red-500', bg: 'bg-red-50', percent: 100 };
    }

    const hoursLeft = Math.floor(diff / (60 * 60 * 1000));
    const color = hoursLeft < 4 ? 'text-red-500' : hoursLeft < 12 ? 'text-amber-500' : 'text-blue-500';
    return { label: `${hoursLeft}h left`, color, bg: color.replace('text', 'bg').replace('500', '50'), percent };
  };

  const getStatusBadge = (status: TicketStatus) => {
    const map: Record<TicketStatus, { bg: string, border: string, text: string, label: string }> = {
      new: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-white', label: 'New' },
      open: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white', label: 'Open' },
      pending: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white', label: 'Pending' },
      on_hold: { bg: 'bg-gray-600', border: 'border-gray-700', text: 'text-white', label: 'Hold' },
      solved: { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-500', label: 'Solved' },
      closed: { bg: 'bg-black', border: 'border-black', text: 'text-white', label: 'Closed' }
    };
    const mapped = map[status] || map.open;
    return (
      <span className={`inline-flex items-center justify-center min-w-[55px] rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest border shadow-sm ${mapped.bg} ${mapped.border} ${mapped.text}`}>
        {mapped.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
      <AdminPageHeader
        title="Support Dashboard"
        subtitle="Industrial-grade ticket queue management"
      />

      <div className="mt-8 flex flex-1 gap-8 overflow-hidden">
        {/* ── Left Sidebar (Views) ── */}
        <aside className="w-64 flex flex-col gap-1 overflow-y-auto pr-4 border-r border-gray-100">
          <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Ticket Views</h3>
          {VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => {
                setActiveView(view.id);
                setSelectedIds(new Set());
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                activeView === view.id 
                  ? 'bg-primary-50 text-primary-700 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <view.icon className={`h-4 w-4 ${activeView === view.id ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="text-xs font-bold">{view.label}</span>
              </div>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                activeView === view.id ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-400'
              }`}>
                {viewCounts[view.id] || 0}
              </span>
            </button>
          ))}
          
          <div className="mt-8 pt-8 border-t border-gray-50">
             <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Operations</h3>
             <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-primary-600 transition-colors">
               <BarChart3 className="h-4 w-4" />
               <span className="text-xs font-bold">Reporting</span>
             </button>
             <button 
                onClick={() => router.push('/admin/support/macros')}
                className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-primary-600 transition-colors"
             >
               <Tag className="h-4 w-4" />
               <span className="text-xs font-bold">Manage Macros</span>
             </button>
          </div>
        </aside>

        {/* ── Main Content (Queue Table) ── */}
        <main className="flex-1 flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 relative">
          
          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                <span className="text-xs font-black uppercase tracking-widest">{selectedIds.size} Selected</span>
                <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleBulkUpdate({ status: 'solved' })}
                  disabled={isBulkLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  Solve
                </button>
                <button 
                  onClick={() => currentUser && handleBulkUpdate({ assigneeId: currentUser.id, assigneeName: currentUser.displayName || 'Admin' })}
                  disabled={isBulkLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5 text-blue-400" />
                  Assign to Me
                </button>
                <div className="relative group/bulk">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    More
                  </button>
                  <div className="absolute bottom-full mb-2 right-0 w-48 bg-white rounded-xl shadow-xl border p-1 opacity-0 invisible group-hover/bulk:opacity-100 group-hover/bulk:visible transition-all">
                    <button 
                      onClick={() => handleBulkUpdate({ priority: 'urgent' })}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Mark Urgent
                    </button>
                    <button 
                      onClick={() => handleBulkUpdate({ status: 'pending' })}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      Set to Pending
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
             <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search in ${VIEWS.find(v => v.id === activeView)?.label}...`}
                  className="w-full rounded-xl border bg-white py-2 pl-9 pr-3 text-xs focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition"
                />
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => loadTickets()} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-gray-900">
                  <RotateCw className="h-4 w-4" />
                </button>
                <button 
                  onClick={handleAcceptNext}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                  <ArrowRightCircle className="h-3.5 w-3.5" />
                  Accept Next
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white border-b z-10 shadow-sm">
                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                       {selectedIds.size === filteredTickets.length && filteredTickets.length > 0 ? (
                         <CheckSquare className="h-4 w-4 text-primary-600" />
                       ) : (
                         <Square className="h-4 w-4 text-gray-300" />
                       )}
                    </button>
                  </th>
                  <th className="px-4 py-4 w-12 text-center">Status</th>
                  <th className="px-6 py-4">Subject & Context</th>
                  <th className="px-6 py-4">Requester</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4">SLA Deadline</th>
                  <th className="px-6 py-4 text-right">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && [1, 2, 3, 4, 5, 6, 7].map(i => <SkeletonRow key={i} columns={7} />)}
                {!loading && filteredTickets.map((t) => {
                  const isSelected = selectedIds.has(t.id);
                  const sla = getSLAInfo(t);
                  
                  return (
                    <tr
                      key={t.id}
                      className={`group cursor-pointer transition hover:bg-primary-50/30 ${isSelected ? 'bg-primary-50/50' : ''}`}
                    >
                      <td className="px-6 py-5 align-top" onClick={(e) => { e.stopPropagation(); toggleSelect(t.id); }}>
                        <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                           {isSelected ? (
                             <CheckSquare className="h-4 w-4 text-primary-600" />
                           ) : (
                             <Square className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                           )}
                        </button>
                      </td>
                      <td className="px-4 py-5 align-top text-center" onClick={() => router.push(`/admin/tickets/${t.id}`)}>
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="px-6 py-5 align-top" onClick={() => router.push(`/admin/tickets/${t.id}`)}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-black group-hover:text-primary-600 transition-colors ${
                            t.priority === 'urgent' ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {t.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-300 uppercase">#{t.id.slice(0, 8)}</span>
                          {t.type && (
                            <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {t.type}
                            </span>
                          )}
                          {t.tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9px] font-bold text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top" onClick={() => router.push(`/admin/tickets/${t.id}`)}>
                        <div className="flex items-center gap-2">
                           <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                             {t.customerName?.[0] || <Mail className="h-3 w-3" />}
                           </div>
                           <div>
                             <p className="text-xs font-black text-gray-800">{t.customerName || 'Customer'}</p>
                             <p className="text-[10px] text-gray-400 font-medium">{t.customerEmail}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top" onClick={() => router.push(`/admin/tickets/${t.id}`)}>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-[8px] font-black text-primary-600">
                            {t.assigneeName ? t.assigneeName[0].toUpperCase() : '-'}
                          </div>
                          <span className={`text-[11px] font-bold ${t.assigneeId ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                            {t.assigneeName || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top" onClick={() => router.push(`/admin/tickets/${t.id}`)}>
                         <div className="flex flex-col gap-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${sla.color}`}>{sla.label}</span>
                            <div className="w-20 h-1 rounded-full bg-gray-100 overflow-hidden">
                               <div 
                                 className={`h-full transition-all duration-1000 ${sla.color.replace('text', 'bg')}`} 
                                 style={{ width: `${sla.percent}%` }} 
                               />
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 align-top text-right" onClick={() => router.push(`/admin/tickets/${t.id}`)}>
                        <p className="text-[11px] font-black text-gray-900">{formatShortDate(t.updatedAt.toString())}</p>
                        <p className="text-[10px] text-gray-400 font-medium">by {t.messages[t.messages.length - 1]?.senderType || 'system'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && filteredTickets.length === 0 && (
              <AdminEmptyState
                title="Queue Clear"
                description="No tickets match this filter. Take a break!"
                icon={CheckCircle2}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
