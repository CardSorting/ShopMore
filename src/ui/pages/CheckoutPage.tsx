'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { 
  CheckCircle, ArrowLeft, LockKeyhole, ChevronRight, ShoppingBag, 
  CreditCard, Truck, ShieldCheck, Tag, RefreshCcw, Info, Shield, AlertCircle
} from 'lucide-react';

import { isStripeConfigured } from '../checkout/stripeClient';
import type { Address } from '@domain/models';
import { logger } from '@utils/logger';

const StripeCheckoutForm = lazy(() => import('../checkout/StripeCheckoutForm').then((module) => ({ default: module.StripeCheckoutForm })));

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading: loadingCart, subtotal, totalItems } = useCart();
  const services = useServices();
  
  const [step, setStep] = useState<'shipping' | 'review' | 'payment' | 'success'>('shipping');
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });
  const [email, setEmail] = useState('');
  const [placing, setPlacing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'authorizing' | 'finalizing'>('idle');
  const [orderId, setOrderId] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const checkoutAttemptKey = useRef(`checkout-ui:${crypto.randomUUID()}`);

  useEffect(() => {
    if (user) setEmail(user.email);
    
    // Load persisted address
    const savedAddress = localStorage.getItem('checkout:address');
    if (savedAddress) {
      try {
        setAddress(JSON.parse(savedAddress));
      } catch (e) {
        logger.error('Failed to parse saved address', e);
      }
    }
  }, [user]);

  // Persist address changes
  useEffect(() => {
    localStorage.setItem('checkout:address', JSON.stringify(address));
  }, [address]);

  const shipping = subtotal >= 10000 ? 0 : 599;
  const discountAmount = appliedDiscount?.amount ?? 0;
  const total = subtotal + shipping - discountAmount;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsApplying(true);
    // Mock discount logic
    setTimeout(() => {
      const code = discountCode.toUpperCase();
      if (code === 'WELCOME10') {
        setAppliedDiscount({ code: 'WELCOME10', amount: Math.floor(subtotal * 0.1) });
      } else if (code === 'SAVE5') {
        setAppliedDiscount({ code: 'SAVE5', amount: 500 });
      } else {
        alert('Invalid discount code');
      }
      setIsApplying(false);
      setDiscountCode('');
    }, 800);
  };

  async function handleSuccess(paymentMethodId: string) {
    if (!user) {
      setCheckoutError('Please sign in to complete your order. Your cart and details have been saved.');
      return;
    }
    setCheckoutError(null);
    setCheckoutStatus('finalizing');
    try {
      const normalizedAddress = { ...address, country: address.country.trim().toUpperCase() };
      const order = await services.orderService.finalizeTrustedCheckout(
        user.id,
        normalizedAddress,
        paymentMethodId,
        checkoutAttemptKey.current
      );
      setOrderId(order.id);
      checkoutAttemptKey.current = `checkout-ui:${crypto.randomUUID()}`;
      setStep('success');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout could not be finalized. Please try again.');
    } finally {
      setPlacing(false);
      setCheckoutStatus('idle');
    }
  }

  useEffect(() => {
    if (checkoutError) {
      const errorEl = document.getElementById('checkout-error');
      if (errorEl) errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [checkoutError]);

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-16 animate-in fade-in duration-700">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-4xl border-0 bg-white shadow-2xl">
          <div className="bg-primary-600 px-6 py-16 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
               <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl ring-8 ring-white/10 shadow-2xl">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-4xl font-black tracking-tight">Order Confirmed!</h2>
              <p className="mt-3 text-primary-100 font-medium text-lg opacity-90">Thank you for your purchase, {user?.displayName || 'Collector'}.</p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-md px-6 py-2 text-xs font-black tracking-[0.2em] text-white uppercase border border-white/10">
                ORDER ID: {orderId.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="p-10 lg:p-16">
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
               <h3 className="text-xl font-black text-gray-900 tracking-tight">Purchase Summary</h3>
               <p className="text-sm font-bold text-gray-400">{totalItems} Items</p>
            </div>
            <div className="mb-12 space-y-6">
              {cart?.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-6">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-gray-50 shadow-sm">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500 font-medium">Quantity: {item.quantity}</p>
                  </div>
                  <p className="text-base font-black text-gray-900">{formatMoney(item.priceSnapshot * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-12 pt-10 border-t md:grid-cols-2">
              <div>
                <h4 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Shipping Details</h4>
                <address className="not-italic text-sm text-gray-600 bg-gray-50 p-6 rounded-2xl border border-gray-100 leading-relaxed font-medium">
                  <p className="font-black text-gray-900 mb-1">{user?.displayName || 'Customer'}</p>
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state} {address.zip}</p>
                  <p className="uppercase tracking-widest text-[10px] mt-2 font-black text-gray-400">{address.country}</p>
                </address>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex justify-between text-base font-medium text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-black">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-black">{shipping === 0 ? 'FREE' : formatMoney(shipping)}</span>
                </div>
                <div className="flex justify-between pt-4 border-t-2 border-gray-50 items-end">
                   <span className="text-xl font-black text-gray-900">Total Paid</span>
                   <span className="text-3xl font-black text-primary-600 tracking-tighter">{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-16 flex flex-wrap gap-4 justify-center">
              <Link href="/orders" className="flex items-center justify-center gap-3 rounded-2xl bg-gray-900 px-10 py-5 font-black text-white transition hover:bg-black shadow-xl hover:-translate-y-1">
                Track Your Order
              </Link>
              <Link href="/products" className="flex items-center justify-center gap-3 rounded-2xl border-2 border-gray-100 bg-white px-10 py-5 font-black text-gray-700 transition hover:bg-gray-50 hover:border-gray-200">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Premium Slim Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-black tracking-tighter text-gray-900 group">
            PlayMore<span className="text-primary-600 group-hover:text-primary-500 transition-colors">TCG</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6">
             <div className="flex items-center gap-3">
               <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${step === 'shipping' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'bg-gray-100 text-gray-400'}`}>1</div>
               <span className={`text-xs font-black uppercase tracking-widest ${step === 'shipping' ? 'text-gray-900' : 'text-gray-400'}`}>Shipping</span>
             </div>
             <ChevronRight className="h-4 w-4 text-gray-200" />
             <div className="flex items-center gap-3">
               <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${step === 'review' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'bg-gray-100 text-gray-400'}`}>2</div>
               <span className={`text-xs font-black uppercase tracking-widest ${step === 'review' ? 'text-gray-900' : 'text-gray-400'}`}>Review</span>
             </div>
             <ChevronRight className="h-4 w-4 text-gray-200" />
             <div className="flex items-center gap-3">
               <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${step === 'payment' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'bg-gray-100 text-gray-400'}`}>3</div>
               <span className={`text-xs font-black uppercase tracking-widest ${step === 'payment' ? 'text-gray-900' : 'text-gray-400'}`}>Payment</span>
             </div>
          </nav>

          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-50 border border-green-100">
            <LockKeyhole className="h-4 w-4 text-green-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Secure 256-bit SSL</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 items-start">
          {/* Main Form Column */}
          <main className="lg:col-span-7">
            <Link href="/cart" className="mb-10 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary-600 transition-colors group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to shopping bag
            </Link>

            <div className="space-y-12">
              {/* Login Incentive for Guests */}
              {!user && step === 'shipping' && (
                 <div className="bg-primary-50 border-2 border-primary-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                       <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                          <ShoppingBag className="h-8 w-8" />
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-gray-900">Sign in for a faster checkout</h4>
                          <p className="text-sm text-primary-700 font-medium opacity-80">Earn points and track your order in real-time.</p>
                       </div>
                    </div>
                    <Link href="/login" className="whitespace-nowrap bg-white text-primary-600 px-6 py-3 rounded-xl font-black text-sm border border-primary-100 hover:bg-primary-600 hover:text-white transition-all shadow-sm">
                       Sign In Securely
                    </Link>
                 </div>
              )}

              {/* Contact Information */}
              <section className={step !== 'shipping' ? 'opacity-40 pointer-events-none' : ''}>
                <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">1. Contact Information</h2>
                <div className="rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-sm">
                  <div className="relative">
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={!!user}
                      className="w-full rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all placeholder:text-gray-300"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className={step !== 'shipping' ? 'opacity-40' : ''}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">2. Shipping Address</h2>
                  {step !== 'shipping' && (
                    <button 
                      onClick={() => setStep('shipping')}
                      className="text-xs font-black uppercase tracking-widest text-primary-600 hover:underline"
                    >
                      Edit Details
                    </button>
                  )}
                </div>
                
                <div className={`space-y-6 rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-sm ${step !== 'shipping' ? 'pointer-events-none' : ''}`}>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">Street Address</label>
                      <input
                        placeholder="123 TCG Lane"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="w-full rounded-2xl border-2 border-gray-100 px-5 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">City</label>
                        <input
                          placeholder="Pallet Town"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full rounded-2xl border-2 border-gray-100 px-5 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">State / Prov</label>
                        <input
                          placeholder="Kanto"
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          className="w-full rounded-2xl border-2 border-gray-100 px-5 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">Postal Code</label>
                        <input
                          placeholder="12345"
                          value={address.zip}
                          onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                          className="w-full rounded-2xl border-2 border-gray-100 px-5 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-gray-400">Country</label>
                        <input
                          placeholder="US"
                          value={address.country}
                          onChange={(e) => setAddress({ ...address, country: e.target.value.toUpperCase() })}
                          className="w-full rounded-2xl border-2 border-gray-100 px-5 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {step === 'shipping' && (
                    <button
                      onClick={() => setStep('review')}
                      disabled={!address.street || !address.city || !address.state || !address.zip || !email}
                      className="mt-6 w-full rounded-2xl bg-gray-900 py-5 font-black text-white shadow-xl shadow-gray-100 transition hover:bg-black disabled:opacity-30 disabled:translate-y-0 hover:-translate-y-1 active:translate-y-0"
                    >
                      Continue to Review
                    </button>
                  )}
                </div>
              </section>

              {/* Order Review Section */}
              {step !== 'shipping' && (
                <section className={step === 'review' ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : 'opacity-40'}>
                  <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">3. Order Review</h2>
                  <div className={`rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-sm ${step !== 'review' ? 'pointer-events-none' : ''}`}>
                    <div className="flex items-start gap-4 mb-8 bg-primary-50 p-6 rounded-2xl border border-primary-100">
                      <Info className="h-5 w-5 text-primary-600 mt-0.5" />
                      <p className="text-sm font-medium text-primary-800 leading-relaxed">
                        Please verify your shipping details and order summary. Once confirmed, you can proceed to secure payment.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Shipping To</p>
                          <div className="text-sm font-bold text-gray-700 leading-relaxed">
                             <p className="text-gray-900">{address.street}</p>
                             <p>{address.city}, {address.state} {address.zip}</p>
                             <p className="uppercase tracking-widest text-[9px] mt-1">{address.country}</p>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Totals</p>
                          <div className="space-y-2">
                             <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Items</span>
                                <span>{formatMoney(subtotal)}</span>
                             </div>
                             <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>Shipping</span>
                                <span className="text-green-600">{shipping === 0 ? 'FREE' : formatMoney(shipping)}</span>
                             </div>
                             <div className="flex justify-between pt-2 border-t-2 border-gray-50 text-lg font-black text-gray-900">
                                <span>Total</span>
                                <span className="text-primary-600">{formatMoney(total)}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    {step === 'review' && (
                      <button
                        onClick={() => setStep('payment')}
                        className="mt-10 w-full rounded-2xl bg-primary-600 py-5 font-black text-white shadow-xl shadow-primary-100 transition hover:bg-primary-700 hover:-translate-y-1 active:translate-y-0"
                      >
                        Confirm & Proceed to Payment
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Payment Section */}
              {step === 'payment' && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">4. Secure Payment</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <Shield className="h-3 w-3 text-green-600" /> AES-256 Encrypted
                    </div>
                  </div>
                  
                  <div className="rounded-3xl border-2 border-gray-100 bg-white shadow-xl overflow-hidden">
                    {!isStripeConfigured && (
                      <div className="bg-amber-50 p-6 text-sm font-bold text-amber-800 border-b border-amber-100 flex gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>Payment processing is currently in maintenance mode. Please try again later.</span>
                      </div>
                    )}

                    {isStripeConfigured && (
                      <Suspense fallback={<div className="p-16 text-center text-sm font-bold text-gray-400 animate-pulse">Initializing secure gateway...</div>}>
                        <StripeCheckoutForm
                          address={address}
                          onSuccess={handleSuccess}
                          onPlaceOrder={(isPlacing) => {
                            setPlacing(isPlacing);
                            setCheckoutStatus(isPlacing ? 'authorizing' : 'idle');
                          }}
                          isPlacing={placing}
                        />
                      </Suspense>
                    )}
                  </div>

                  {checkoutError && (
                    <div id="checkout-error" className="mt-6 rounded-2xl border-2 border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700 flex gap-3 animate-in fade-in zoom-in-95">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-black mb-1">Payment Unsuccessful</p>
                        <p className="opacity-80">{checkoutError}</p>
                      </div>
                    </div>
                  )}

                  {checkoutStatus === 'finalizing' && (
                    <div className="mt-6 rounded-2xl border-2 border-blue-100 bg-blue-50 p-6 text-sm font-bold text-blue-800 flex items-center gap-4 animate-in fade-in">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Securely confirming your collection... Please do not close this window.
                    </div>
                  )}
                </section>
              )}
            </div>
          </main>

          {/* Sticky Summary Column */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="rounded-4xl border-2 border-gray-100 bg-white p-8 shadow-2xl shadow-gray-200/40">
              <h2 className="mb-8 text-2xl font-black text-gray-900 tracking-tight">Order Summary</h2>
              
              {loadingCart ? (
                <div className="space-y-6 animate-pulse">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-5">
                      <div className="h-20 w-20 rounded-2xl bg-gray-100" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-3/4 rounded bg-gray-100" />
                        <div className="h-4 w-1/4 rounded bg-gray-50" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cart && cart.items.length > 0 ? (
                <div className="max-h-[50vh] space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-5 group">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-black text-white shadow-xl ring-4 ring-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <h3 className="text-sm font-black text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{item.name}</h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">Unit {formatMoney(item.priceSnapshot)}</p>
                      </div>
                      <p className="text-sm font-black text-gray-900">{formatMoney(item.priceSnapshot * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-200">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Your bag is empty</p>
                </div>
              )}

              {/* Discount Code Section */}
              <div className="mt-10 border-t-2 border-gray-50 pt-8">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="PROMO CODE" 
                    className="flex-1 rounded-xl border-2 border-gray-100 bg-gray-50 px-5 py-4 text-xs font-black uppercase tracking-widest text-gray-900 focus:border-primary-500 focus:bg-white focus:outline-none transition-all outline-none"
                  />
                  <button 
                    onClick={handleApplyDiscount}
                    disabled={isApplying || !discountCode.trim()}
                    className="rounded-xl bg-gray-900 px-6 py-4 text-xs font-black text-white uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30"
                  >
                    {isApplying ? <RefreshCcw className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {appliedDiscount && (
                  <div className="mt-4 animate-in slide-in-from-top-2">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-700">
                      <Tag className="h-3 w-3" /> {appliedDiscount.code}
                      <button onClick={() => setAppliedDiscount(null)} className="ml-2 h-4 w-4 rounded-full hover:bg-green-100 flex items-center justify-center transition-colors">×</button>
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-10 space-y-5 border-t-2 border-gray-50 pt-8">
                <div className="flex justify-between text-sm font-bold text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-900">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-500">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-black' : 'text-gray-900'}>
                    {shipping === 0 ? 'FREE' : formatMoney(shipping)}
                  </span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm font-bold text-green-600">
                    <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                      <Tag className="h-3.5 w-3.5" /> Discount
                    </span>
                    <span>-{formatMoney(appliedDiscount.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-500">
                  <span>Tax</span>
                  <span className="text-gray-900">$0.00</span>
                </div>
                <div className="flex justify-between pt-6 border-t-2 border-gray-50 items-end">
                   <span className="text-xl font-black text-gray-900 tracking-tight">Grand Total</span>
                   <span className="text-4xl font-black text-primary-600 tracking-tighter leading-none">
                      {formatMoney(total)}
                   </span>
                </div>
              </div>

              <div className="mt-12 space-y-5">
                <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shipping</p>
                    <p className="text-xs font-bold text-gray-700 truncate">Ships within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Guarantee</p>
                    <p className="text-xs font-bold text-gray-700 truncate">30-Day Money Back</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-6 pt-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                   <CreditCard className="h-6 w-6" />
                   <Shield className="h-6 w-6" />
                   <Info className="h-6 w-6" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}