'use client';

import { useState, useEffect } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import { Heart, Trash2, ShoppingBag, Plus, MoreVertical, Edit2, ChevronRight, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '../hooks/useCart';
import type { Product, Wishlist } from '@domain/models';
import { useServices } from '../hooks/useServices';

export function WishlistPage() {
  const { wishlists, loading, removeFromWishlist, createCollection } = useWishlist();
  const services = useServices();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');

  const selectedList = wishlists.find(w => w.id === selectedListId) || wishlists.find(w => w.isDefault);

  useEffect(() => {
    if (selectedList) {
      setSelectedListId(selectedList.id);
      loadItems(selectedList.id);
    }
  }, [selectedList?.id]);

  async function loadItems(id: string) {
    setLoadingItems(true);
    try {
      const detail = await services.wishlistService.getWishlist(id);
      setItems(detail.items);
    } catch (err) {
      console.error('Failed to load wishlist items', err);
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleCreateList() {
    if (!newListName.trim()) return;
    try {
      const newList = await createCollection(newListName.trim());
      setNewListName('');
      setIsCreating(false);
      setSelectedListId(newList.id);
    } catch (err) {
      console.error('Failed to create wishlist', err);
    }
  }

  async function handleRemoveItem(productId: string) {
    if (!selectedListId) return;
    await removeFromWishlist(productId, selectedListId);
    setItems(prev => prev.filter(p => p.id !== productId));
  }

  if (loading && wishlists.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded-xl mb-12" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-gray-100 rounded-xl" />)}
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-gray-50 rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">My Wishlists</h1>
          <p className="text-gray-500 font-medium">Keep track of cards you want to add to your collection.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar: Wishlist Collections */}
          <aside className="space-y-6">
            <div className="bg-gray-50 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Collections</h2>
                <button 
                  onClick={() => setIsCreating(!isCreating)}
                  className="p-1.5 rounded-lg bg-white shadow-sm text-primary-600 hover:scale-110 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isCreating && (
                <div className="mb-6 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Collection name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    className="w-full bg-white border-2 border-primary-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-primary-500"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCreateList}
                      className="flex-1 bg-primary-600 text-white text-xs font-black py-2 rounded-lg"
                    >
                      Create
                    </button>
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="flex-1 bg-white border text-gray-500 text-xs font-black py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {wishlists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                      selectedListId === list.id 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                        : 'text-gray-600 hover:bg-white hover:text-primary-600'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Heart className={`w-4 h-4 ${list.isDefault ? 'fill-current' : ''}`} />
                      {list.name}
                    </span>
                    {list.isDefault && <span className="text-[10px] opacity-60 uppercase">Default</span>}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content: Items */}
          <main className="lg:col-span-3">
            {loadingItems ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="aspect-square bg-gray-50 rounded-3xl" />
                    <div className="h-4 w-2/3 bg-gray-50 rounded" />
                    <div className="h-4 w-1/3 bg-gray-50 rounded" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm mb-6">
                  <PackageSearch className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Empty Collection</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">This wishlist is looking a bit lonely. Go find some cards to save!</p>
                <Link 
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-8 py-4 font-black text-white shadow-xl transition hover:bg-black hover:-translate-y-0.5"
                >
                  Browse Catalog
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map(product => (
                  <WishlistItemCard 
                    key={product.id} 
                    product={product} 
                    onRemove={() => handleRemoveItem(product.id)} 
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function WishlistItemCard({ product, onRemove }: { product: Product, onRemove: () => void }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  async function handleAddToCart() {
    setAdding(true);
    try {
      await addItem(product.id, 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link href={`/products/${product.id}`}>
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </Link>
        <button 
          onClick={onRemove}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
          title="Remove from wishlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1">{product.category}</p>
        <h3 className="text-base font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-2">
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        
        <div className="flex items-center justify-between mb-6">
          <p className="text-xl font-black text-gray-900">${(product.price / 100).toFixed(2)}</p>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
          className="w-full h-12 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
        >
          <ShoppingBag className="w-4 h-4" />
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
