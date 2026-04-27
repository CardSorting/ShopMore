'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Trash2, ChevronRight, LockKeyhole, Truck } from 'lucide-react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import type { Cart } from '@domain/models';
import { MAX_CART_QUANTITY } from '@domain/rules';
import { logger } from '@utils/logger';

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const services = useServices();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [linePending, setLinePending] = useState<Record<string, boolean>>({});

  const loadCart = useCallback(async () => {
    if (!user) return;
    try {
      const data = await services.cartService.getCart(user.id);
      setCart(data);
    } catch (err) {
      logger.error('Failed to load cart in drawer', err);
    }
  }, [services, user]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      void loadCart();
    };
    const handleRefresh = () => {
      void loadCart();
    };

    window.addEventListener('cart:open', handleOpen);
    window.addEventListener('cart:updated', handleRefresh);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('cart:open', handleOpen);
      window.removeEventListener('cart:updated', handleRefresh);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadCart]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const items = cart?.items ?? [];
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!user || !cart) return;
    setLinePending(prev => ({ ...prev, [productId]: true }));
    try {
      const updated = await services.cartService.updateQuantity(user.id, productId, Math.max(1, Math.min(quantity, MAX_CART_QUANTITY)));
      setCart(updated);
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (err) {
      logger.error('Failed to update quantity', err);
    } finally {
      setLinePending(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemove = async (productId: string) => {
    if (!user || !cart) return;
    setLinePending(prev => ({ ...prev, [productId]: true }));
    try {
      const updated = await services.cartService.removeFromCart(user.id, productId);
      setCart(updated);
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (err) {
      logger.error('Failed to remove item', err);
    } finally {
      setLinePending(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Your Cart ({totalItems})</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-4 h-12 w-12 text-gray-200" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="mt-4 text-sm font-bold text-primary-600 hover:underline"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">{formatMoney(item.priceSnapshot)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border bg-white">
                        <button 
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || linePending[item.productId]}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= MAX_CART_QUANTITY || linePending[item.productId]}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => handleRemove(item.productId)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t bg-gray-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">{formatMoney(subtotal)}</span>
            </div>
            <p className="mb-6 text-xs text-gray-500">Shipping and taxes calculated at checkout.</p>
            
            <div className="space-y-3">
              <Link 
                href="/checkout" 
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-4 font-bold text-white shadow-lg transition hover:bg-primary-700"
              >
                Checkout securely <LockKeyhole className="h-4 w-4" />
              </Link>
              <Link 
                href="/cart" 
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                View full cart
              </Link>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Fast Shipping</span>
              <span className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Easy Returns</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
