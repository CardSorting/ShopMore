'use client';

/**
 * [LAYER: UI]
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Cart, CartItem } from '@domain/models';
import { useAuth } from './useAuth';
import { useServices } from './useServices';
import { logger } from '@utils/logger';
import { MAX_CART_QUANTITY } from '@domain/rules';

export interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = 'playmore_guest_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const services = useServices();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Helper to load guest cart from localStorage
  const getGuestCart = useCallback((): Cart | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(GUEST_CART_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, []);

  // Helper to save guest cart to localStorage
  const saveGuestCart = useCallback((updatedCart: Cart | null) => {
    if (typeof window === 'undefined') return;
    if (updatedCart) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, []);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        // Authenticated user: load from repository
        const remoteCart = await services.cartService.getCart(user.id);
        
        // Handle sync: if there's a guest cart, merge it
        const guestCart = getGuestCart();
        if (guestCart && guestCart.items.length > 0) {
          logger.info('Syncing guest cart with user cart');
          let currentCart = remoteCart;
          for (const item of guestCart.items) {
             currentCart = await services.cartService.addToCart(user.id, item.productId, item.quantity);
          }
          setCart(currentCart);
          saveGuestCart(null); // Clear guest cart after sync
        } else {
          setCart(remoteCart);
        }
      } else {
        // Guest user: load from localStorage
        setCart(getGuestCart());
      }
    } catch (err) {
      logger.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  }, [user, services.cartService, getGuestCart, saveGuestCart]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  // Handle custom events for external triggers (if any still exist)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleRefresh = () => void loadCart();
    
    window.addEventListener('cart:open', handleOpen);
    window.addEventListener('cart:refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('cart:open', handleOpen);
      window.removeEventListener('cart:refresh', handleRefresh);
    };
  }, [loadCart]);

  const subtotal = useMemo(() => 
    cart?.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0) ?? 0, 
    [cart]
  );

  const totalItems = useMemo(() => 
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0, 
    [cart]
  );

  const addItem = async (productId: string, quantity: number) => {
    try {
      if (user) {
        const updated = await services.cartService.addToCart(user.id, productId, quantity);
        setCart(updated);
      } else {
        // Guest logic: we need to mimic CartService or use it with a dummy id
        // Since CartService uses repositories which might be server-side or DB-tied,
        // we'll implement simple local logic for guest cart for now, 
        // or we could potentially use a "Guest ID" in the service if supported.
        // For production hardening, let's keep guest cart local-first.
        const product = await services.productService.getProducts({}).then(r => r.products.find(p => p.id === productId));
        if (!product) throw new Error('Product not found');

        const currentCart = getGuestCart() || { id: 'guest', userId: 'guest', items: [], updatedAt: new Date() };
        const existingIndex = currentCart.items.findIndex(i => i.productId === productId);
        
        if (existingIndex > -1) {
          currentCart.items[existingIndex].quantity = Math.min(currentCart.items[existingIndex].quantity + quantity, MAX_CART_QUANTITY);
        } else {
          currentCart.items.push({
            productId,
            name: product.name,
            priceSnapshot: product.price,
            imageUrl: product.imageUrl,
            quantity: Math.min(quantity, MAX_CART_QUANTITY)
          });
        }
        currentCart.updatedAt = new Date();
        setCart({ ...currentCart });
        saveGuestCart(currentCart);
      }
      setIsOpen(true); // Open drawer on add
    } catch (err) {
      logger.error('Failed to add to cart', err);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.min(quantity, MAX_CART_QUANTITY));
    
    // Optimistic Update
    const prevCart = cart;
    if (cart) {
      setCart({
        ...cart,
        items: cart.items.map(i => i.productId === productId ? { ...i, quantity: safeQuantity } : i)
      });
    }

    try {
      if (user) {
        const updated = await services.cartService.updateQuantity(user.id, productId, safeQuantity);
        setCart(updated);
      } else {
        const currentCart = getGuestCart();
        if (currentCart) {
          currentCart.items = currentCart.items.map(i => i.productId === productId ? { ...i, quantity: safeQuantity } : i);
          currentCart.updatedAt = new Date();
          setCart({ ...currentCart });
          saveGuestCart(currentCart);
        }
      }
    } catch (err) {
      logger.error('Failed to update quantity', err);
      setCart(prevCart);
    }
  };

  const removeItem = async (productId: string) => {
    // Optimistic Update
    const prevCart = cart;
    if (cart) {
      setCart({
        ...cart,
        items: cart.items.filter(i => i.productId !== productId)
      });
    }

    try {
      if (user) {
        const updated = await services.cartService.removeFromCart(user.id, productId);
        setCart(updated);
      } else {
        const currentCart = getGuestCart();
        if (currentCart) {
          currentCart.items = currentCart.items.filter(i => i.productId !== productId);
          currentCart.updatedAt = new Date();
          setCart({ ...currentCart });
          saveGuestCart(currentCart);
        }
      }
    } catch (err) {
      logger.error('Failed to remove item', err);
      setCart(prevCart);
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        await services.cartService.clearCart(user.id);
      }
      setCart(null);
      saveGuestCart(null);
    } catch (err) {
      logger.error('Failed to clear cart', err);
    }
  };

  const value: CartContextValue = {
    cart,
    loading,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
