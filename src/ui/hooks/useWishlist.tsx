'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useServices } from './useServices';
import type { Wishlist, Product } from '@domain/models';

interface WishlistContextType {
  wishlists: Wishlist[];
  loading: boolean;
  error: string | null;
  refreshWishlists: () => Promise<void>;
  addToWishlist: (productId: string, wishlistId?: string) => Promise<void>;
  removeFromWishlist: (productId: string, wishlistId?: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  createCollection: (name: string) => Promise<Wishlist>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const services = useServices();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [itemMap, setItemMap] = useState<Record<string, Set<string>>>({}); // wishlistId -> Set<productId>
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWishlists = useCallback(async () => {
    if (!user) {
      setWishlists([]);
      setItemMap({});
      return;
    }

    setLoading(true);
    try {
      const lists = await services.wishlistService.getWishlists();
      setWishlists(lists);
      
      // Pre-populate items for each wishlist to make isInWishlist fast
      const map: Record<string, Set<string>> = {};
      for (const list of lists) {
        const detail = await services.wishlistService.getWishlist(list.id);
        map[list.id] = new Set(detail.items.map(p => p.id));
      }
      setItemMap(map);
    } catch (err) {
      console.error('Failed to load wishlists', err);
      setError('Failed to load wishlists');
    } finally {
      setLoading(false);
    }
  }, [user, services.wishlistService]);

  useEffect(() => {
    void refreshWishlists();
  }, [refreshWishlists]);

  const addToWishlist = async (productId: string, wishlistId?: string) => {
    if (!user) throw new Error('Must be logged in');
    
    // Use default wishlist if none provided
    const targetId = wishlistId || wishlists.find(w => w.isDefault)?.id;
    if (!targetId) throw new Error('No wishlist found');

    await services.wishlistService.addItem(targetId, productId);
    
    // Optimistic update
    setItemMap(prev => ({
      ...prev,
      [targetId]: new Set([...(prev[targetId] || []), productId])
    }));
  };

  const removeFromWishlist = async (productId: string, wishlistId?: string) => {
    if (!user) throw new Error('Must be logged in');

    // If wishlistId not provided, remove from all wishlists (standard "unfavorite" behavior)
    if (!wishlistId) {
      const listsWithItem = Object.entries(itemMap)
        .filter(([_, items]) => items.has(productId))
        .map(([id]) => id);
      
      for (const id of listsWithItem) {
        await services.wishlistService.removeItem(id, productId);
      }
      
      setItemMap(prev => {
        const next = { ...prev };
        for (const id of listsWithItem) {
          const newSet = new Set(next[id]);
          newSet.delete(productId);
          next[id] = newSet;
        }
        return next;
      });
    } else {
      await services.wishlistService.removeItem(wishlistId, productId);
      setItemMap(prev => {
        const newSet = new Set(prev[wishlistId]);
        newSet.delete(productId);
        return { ...prev, [wishlistId]: newSet };
      });
    }
  };

  const isInWishlist = (productId: string) => {
    return Object.values(itemMap).some(items => items.has(productId));
  };

  const createCollection = async (name: string) => {
    if (!user) throw new Error('Must be logged in');
    const newList = await services.wishlistService.createWishlist(name);
    setWishlists(prev => [...prev, newList]);
    setItemMap(prev => ({ ...prev, [newList.id]: new Set() }));
    return newList;
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlists, 
      loading, 
      error, 
      refreshWishlists, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist,
      createCollection
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
