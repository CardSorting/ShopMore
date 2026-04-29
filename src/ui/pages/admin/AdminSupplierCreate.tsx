/**
 * [LAYER: UI]
 * Dedicated full-width workspace for onboarding new wholesalers and distributors.
 * Mirrors the focused 'single-task' pattern used in Stripe and Shopify.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  Save, 
  ShieldCheck, 
  Truck 
} from 'lucide-react';
import { 
  AdminPageHeader, 
  useToast, 
  useAdminPageTitle,
  SkeletonPage
} from '../../components/admin/AdminComponents';
import { useServices } from '../../hooks/useServices';

export function AdminSupplierCreate() {
  useAdminPageTitle('Add Supplier');
  const router = useRouter();
  const { toast } = useToast();
  const services = useServices();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await services.supplierService.create(data);
      toast('success', 'Supplier successfully onboarded');
      router.push('/admin/suppliers');
      router.refresh();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Failed to onboard supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Focused Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-gray-400 shadow-sm transition hover:bg-gray-50 hover:text-gray-600 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Merchant Operations</p>
            <h1 className="text-2xl font-bold text-gray-900">Add New Supplier</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="rounded-xl px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Primary Identity */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Supplier Identity</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company Name</label>
                <input 
                  name="name" 
                  required 
                  className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                  placeholder="e.g. Southern Hobby Distribution" 
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tax ID / EIN</label>
                  <input 
                    name="taxId" 
                    className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                    placeholder="XX-XXXXXXX" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Currency</label>
                  <select className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Contact Details */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Communication & Logistics</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    name="email" 
                    className="w-full rounded-xl border bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                    placeholder="orders@supplier.com" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone Number</label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="tel" 
                    name="phone" 
                    className="w-full rounded-xl border bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Website URL</label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input 
                    name="website" 
                    className="w-full rounded-xl border bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                    placeholder="https://www.distributor.com" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Address */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Physical Location</h3>
            </div>
            <textarea 
              name="address" 
              rows={3} 
              className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
              placeholder="Full mailing address for POs and returns..." 
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Truck className="h-4 w-4 text-gray-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Procurement Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-600">Payment Terms</label>
                <select className="mt-1 w-full rounded-xl border bg-gray-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="net_30">Net 30</option>
                  <option value="net_60">Net 60</option>
                  <option value="due_on_receipt">Due on Receipt</option>
                  <option value="prepaid">Prepaid</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600">Primary Contact</label>
                <input className="mt-1 w-full rounded-xl border bg-gray-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500" placeholder="Rep name..." />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-linear-to-br from-gray-900 to-black p-6 text-white shadow-xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-5 w-5 text-primary-400" />
            </div>
            <h3 className="text-sm font-bold">Audit Trail Integrity</h3>
            <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
              All supplier onboarding events are recorded in the forensic audit log with your administrative signature. 
              Ensure all tax documentation is verified before submission.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
