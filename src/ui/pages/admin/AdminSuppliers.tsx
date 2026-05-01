"use client";

/**
 * [LAYER: UI]
 * Suppliers — focused wholesaler and distributor management workspace
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  MoreHorizontal,
  Building2,
} from 'lucide-react';
import { 
  AdminPageHeader, 
  AdminEmptyState, 
  SkeletonPage,
  useToast,
  useAdminPageTitle,
} from '../../components/admin/AdminComponents';
import type { Supplier } from '@domain/models';
import { useServices } from '../../hooks/useServices';
import Link from 'next/link';

export function AdminSuppliers() {
  useAdminPageTitle('Suppliers');
  const { toast } = useToast();
  const services = useServices();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const fetchSuppliers = async () => {
    try {
      const data = await services.supplierService.list({ query: query || undefined });
      setSuppliers(data);
    } catch (error) {
      toast('error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [query]);

  if (loading && suppliers.length === 0) return <SkeletonPage />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <AdminPageHeader 
        title="Suppliers" 
        subtitle="Manage your wholesalers, distributors, and manufacturers in one place."
        actions={
          <Link 
            href="/admin/suppliers/new"
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add supplier
          </Link>
        }
      />

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, contact, or email..."
              className="w-full rounded-xl border bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="group flex items-center justify-between p-4 transition hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{supplier.name}</h3>
                  <div className="mt-0.5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {supplier.email || 'No email'}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {supplier.phone || 'No phone'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 shadow-sm transition">View Details</button>
                <button className="rounded-lg p-2 text-gray-400 hover:text-gray-900 transition"><MoreHorizontal className="h-5 w-5" /></button>
              </div>
            </div>
          ))}

          {suppliers.length === 0 && !loading && (
            <AdminEmptyState 
              title="No suppliers found" 
              description="Onboard your first wholesaler to start managing purchase orders and inbound inventory." 
              icon={Building2} 
              action={
                <Link 
                  href="/admin/suppliers/new"
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Add your first supplier
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
