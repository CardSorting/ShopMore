/**
 * [LAYER: UI]
 */
import { Link, Outlet } from 'react-router-dom';
import { Package, ClipboardList, LayoutDashboard } from 'lucide-react';

export function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            <Link
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              <Package className="w-4 h-4" />
              Products
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              <ClipboardList className="w-4 h-4" />
              Orders
            </Link>
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}