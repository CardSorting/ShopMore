'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Package, ClipboardList, LayoutDashboard, Boxes, BarChart3, HelpCircle } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Home', description: 'Today at a glance', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', description: 'Review and fulfill', icon: ClipboardList },
  { href: '/admin/inventory', label: 'Inventory', description: 'Restock priorities', icon: Boxes },
  { href: '/admin/products', label: 'Products', description: 'Catalog setup', icon: Package },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">PlayMoreTCG Admin</p>
        <h1 className="text-xl font-bold text-gray-900">Store manager</h1>
        <p className="text-sm text-gray-500">Use the left menu like a daily checklist: review orders, check inventory, then update products.</p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="lg:w-72 lg:shrink-0">
          <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {NAV_ITEMS.map(({ href, label, description, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm text-gray-700 shadow-sm hover:border-primary-200 hover:bg-primary-50">
                <Icon className="h-5 w-5 text-primary-600" />
                <span><span className="block font-semibold text-gray-900">{label}</span><span className="text-xs text-gray-500">{description}</span></span>
              </Link>
            ))}
            <div className="rounded-xl border border-dashed bg-gray-50 px-4 py-3 text-sm text-gray-500">
              <div className="flex items-center gap-2 font-medium text-gray-700"><BarChart3 className="h-4 w-4" />Insights</div>
              <p className="mt-1 text-xs">Sales reports coming soon.</p>
            </div>
            <div className="rounded-xl border border-dashed bg-gray-50 px-4 py-3 text-sm text-gray-500">
              <div className="flex items-center gap-2 font-medium text-gray-700"><HelpCircle className="h-4 w-4" />Help</div>
              <p className="mt-1 text-xs">Use plain-language action cards on each page.</p>
            </div>
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}