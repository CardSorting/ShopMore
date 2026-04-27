import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import type { Order } from '@domain/models';
import { Package, Truck, CheckCircle2, Clock, AlertCircle, ChevronRight, ShoppingBag, ExternalLink, RefreshCcw, HelpCircle } from 'lucide-react';
import { logger } from '@utils/logger';

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string; step: number }> = {
  pending: { color: 'text-amber-600 bg-amber-50', icon: Clock, label: 'Pending', step: 1 },
  confirmed: { color: 'text-blue-600 bg-blue-50', icon: CheckCircle2, label: 'Confirmed', step: 2 },
  shipped: { color: 'text-purple-600 bg-purple-50', icon: Truck, label: 'In Transit', step: 3 },
  delivered: { color: 'text-green-600 bg-green-50', icon: Package, label: 'Delivered', step: 4 },
  cancelled: { color: 'text-red-600 bg-red-50', icon: AlertCircle, label: 'Cancelled', step: 0 },
};

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function OrdersPage() {
  const { user } = useAuth();
  const services = useServices();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await services.orderService.getOrders(user.id);
      // Sort by newest first
      setOrders([...result].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (err) {
      logger.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, [services.orderService, user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleReorder = async (order: Order) => {
    if (!user) return;
    setReordering(order.id);
    try {
      for (const item of order.items) {
        await services.cartService.addToCart(user.id, item.productId, item.quantity);
      }
      window.dispatchEvent(new CustomEvent('cart:open'));
    } catch (err) {
      logger.error('Failed to reorder items', err);
    } finally {
      setReordering(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        {[1, 2].map(i => (
          <div key={i} className="h-64 w-full bg-gray-100 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">No orders yet</h2>
        <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">When you place an order, it will appear here with live status updates and tracking info.</p>
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-primary-700 transition"
        >
          Explore Catalog <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Order History</h1>
        <p className="text-gray-500 mt-2 font-medium">Manage your orders and track shipments</p>
      </div>

      <div className="space-y-8">
        {orders.map((o) => {
          const config = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
          const StatusIcon = config.icon;

          return (
            <div key={o.id} className="bg-white rounded-3xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
              {/* Top Bar: Status & Meta */}
              <div className="px-6 py-4 border-b bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${config.color}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{config.label}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order #{o.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Placed On</p>
                     <p className="text-xs font-bold text-gray-900">{o.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
                     <p className="text-sm font-black text-primary-600">{formatMoney(o.total)}</p>
                   </div>
                </div>
              </div>

              <div className="p-6">
                {/* Progress Stepper */}
                {o.status !== 'cancelled' && (
                  <div className="mb-10 px-4">
                    <div className="relative flex justify-between">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2" />
                      <div 
                        className="absolute top-1/2 left-0 h-0.5 bg-primary-600 -translate-y-1/2 transition-all duration-1000" 
                        style={{ width: `${((config.step - 1) / 3) * 100}%` }}
                      />
                      {[1, 2, 3, 4].map((step) => {
                        const isDone = step <= config.step;
                        const isCurrent = step === config.step;
                        return (
                          <div key={step} className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white transition-colors duration-500 ${isDone ? 'border-primary-600 bg-primary-600' : 'border-gray-200'}`}>
                            {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>Confirmed</span>
                      <span className="translate-x-1">Processing</span>
                      <span className="-translate-x-1">Shipped</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-4 mb-8">
                  {o.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4 group">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-gray-50 group-hover:shadow-md transition">
                        <img 
                          src={item.imageUrl || 'https://via.placeholder.com/150'} 
                          alt={item.name} 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} • {formatMoney(item.unitPrice)} each</p>
                      </div>
                      <Link 
                        href={`/products/${item.productId}`}
                        className="p-2 text-gray-400 hover:text-primary-600 transition"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleReorder(o)}
                      disabled={!!reordering}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition disabled:opacity-50"
                    >
                      {reordering === o.id ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                      Buy it again
                    </button>
                    {o.status === 'shipped' && (
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl border text-gray-700 text-xs font-bold hover:bg-gray-50 transition">
                        <Truck className="w-3.5 h-3.5" />
                        Track Package
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition">
                      <HelpCircle className="w-4 h-4" />
                      Need Help?
                    </button>
                    <div className="h-4 w-px bg-gray-200" />
                    <button className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition">
                      <ExternalLink className="w-4 h-4" />
                      View Invoice
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Details Alert */}
              {o.status === 'shipped' && o.trackingNumber && (
                <div className="bg-blue-50 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                    <Truck className="w-4 h-4" />
                    Shipped via {o.shippingCarrier || 'Standard'}: {o.trackingNumber}
                  </div>
                  <Link href="#" className="text-[10px] font-black uppercase text-blue-600 hover:underline">Track on carrier site</Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}