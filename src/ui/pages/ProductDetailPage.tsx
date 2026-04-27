'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import type { Product } from '@domain/models';
import { ShoppingCart, ArrowLeft, Check, ShieldCheck, Truck, LifeBuoy, PackageCheck, ChevronRight, AlertCircle } from 'lucide-react';

import { MAX_CART_QUANTITY } from '@domain/rules';
import { logger } from '@utils/logger';

function toFriendlyError(err: unknown): string {
  if (err instanceof Error && err.message) {
    if (/insufficient stock/i.test(err.message)) {
      const available = err.message.match(/available\s+(\d+)/i)?.[1];
      return available
        ? `Only ${available} available right now. Please choose a lower quantity.`
        : 'This item has limited availability. Please choose a lower quantity.';
    }
    return err.message;
  }
  return 'Unable to add this item to your cart right now.';
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addItem } = useCart();
  const services = useServices();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const loaded = await services.productService.getProduct(id);
      setProduct(loaded);
      
      // Load related products
      setLoadingRelated(true);
      try {
        const related = await services.productService.getProducts({ category: loaded.category, limit: 5 });
        setRelatedProducts(related.products.filter(p => p.id !== id).slice(0, 4));
      } catch (err) {
        logger.error('Failed to load related products', err);
      } finally {
        setLoadingRelated(false);
      }
    } catch (err) {
      logger.error('Failed to load product', err);
      setError('Product not found.');
    } finally {
      setLoading(false);
    }
  }, [id, services.productService]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const maxSelectableQuantity = product ? Math.max(1, Math.min(product.stock, MAX_CART_QUANTITY)) : 1;

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    setError(null);
    try {
      await addItem(product.id, Math.min(quantity, maxSelectableQuantity));
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setAdding(false);
    }
  }

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-6">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-3/4 bg-gray-200 rounded" />
            <div className="h-8 w-1/4 bg-gray-200 rounded" />
            <div className="h-32 w-full bg-gray-100 rounded" />
            <div className="h-12 w-full bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-gray-900">Products</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gray-50 border shadow-inner">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="flex flex-col">
            <div className="mb-6">
              <p className="text-sm text-primary-600 font-bold uppercase tracking-widest mb-2">{product.category}</p>
              <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4">{product.name}</h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {product.set && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    {product.set}
                  </span>
                )}
                {product.rarity && (
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 ring-1 ring-inset ring-primary-700/10">
                    {product.rarity}
                  </span>
                )}
              </div>

              <p className="text-3xl font-black text-gray-900">${(product.price / 100).toFixed(2)}</p>
            </div>

            <div className="prose prose-sm text-gray-600 mb-8 max-w-none">
              <p className="leading-relaxed">{product.description}</p>
            </div>

            <div className="mb-8 space-y-4 border-t border-b py-6">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-sm font-bold ${product.stock < 10 && product.stock > 0 ? 'text-amber-600' : product.stock === 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {product.stock > 10 ? 'In stock and ready to ship' : product.stock > 0 ? (
                    <span className="flex items-center gap-1.5">
                      Only {product.stock} left in stock - order soon!
                      <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    </span>
                  ) : 'Out of stock'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Quantity</p>
                  <div className="inline-flex items-center rounded-xl border bg-white shadow-sm overflow-hidden h-14">
                    <button
                      type="button"
                      aria-label={`Decrease quantity for ${product.name}`}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || adding}
                      className="px-5 py-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-14 border-x px-3 py-2 text-center text-base font-bold text-gray-900" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity for ${product.name}`}
                      onClick={() => setQuantity(Math.min(maxSelectableQuantity, quantity + 1))}
                      disabled={quantity >= maxSelectableQuantity || adding}
                      className="px-5 py-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={adding || product.stock === 0}
                  className="flex-1 sm:flex-2 h-14 flex items-center justify-center gap-3 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {added ? <Check className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
                  {adding ? 'Adding...' : added ? 'Added to Cart!' : 'Add to Cart'}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                  <AlertCircle className="h-5 w-5" />
                  {error}
                </div>
              )}

              {added && (
                <div className="flex items-center justify-between gap-4 bg-green-50 border border-green-100 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <Check className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-green-800">Added to your cart!</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('cart:open'))}
                      className="text-sm font-bold text-green-700 underline underline-offset-4 hover:text-green-900"
                    >
                      View cart
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Trust Badges Section */}
            <div className="mt-12 grid grid-cols-2 gap-4 border-t pt-10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Secure Checkout</p>
                  <p className="text-[10px] text-gray-500">100% Encrypted Payment</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Fast Shipping</p>
                  <p className="text-[10px] text-gray-500">Dispatched in 24h</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Authentic Cards</p>
                  <p className="text-[10px] text-gray-500">Verified TCG Quality</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-50 text-gray-600">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Expert Support</p>
                  <p className="text-[10px] text-gray-500">We love TCG collectors</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {(relatedProducts.length > 0 || loadingRelated) && (
          <section className="mt-20 border-t pt-20 pb-12">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">You might also like</h2>
              <Link href="/products" className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            {loadingRelated ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="aspect-square rounded-2xl bg-gray-100" />
                    <div className="h-4 w-2/3 bg-gray-100 rounded" />
                    <div className="h-4 w-1/3 bg-gray-50 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((p) => (
                  <article key={p.id} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100 border shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1">
                      <Link href={`/products/${p.id}`}>
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      </Link>
                    </div>
                    <div className="mt-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mb-1">{p.category}</p>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                        <Link href={`/products/${p.id}`}>{p.name}</Link>
                      </h3>
                      <p className="mt-2 text-lg font-black text-gray-900">${(p.price / 100).toFixed(2)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Mobile Sticky Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-t p-4 lg:hidden transition-transform duration-300 shadow-[0_-8px_30px_rgb(0,0,0,0.1)]">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <div className="hidden sm:flex flex-col">
            <p className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[120px]">{product.name}</p>
            <p className="text-sm font-black text-gray-900">${(product.price / 100).toFixed(2)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-100 disabled:opacity-50"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {adding ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}