'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, ArrowLeft, LockKeyhole, ChevronRight, ShoppingBag, CreditCard, Truck, ShieldCheck } from 'lucide-react';

import { isStripeConfigured } from '../checkout/stripeClient';
import type { Address, Cart } from '@domain/models';
import { logger } from '@utils/logger';

const StripeCheckoutForm = lazy(() => import('../checkout/StripeCheckoutForm').then((module) => ({ default: module.StripeCheckoutForm })));

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CheckoutPage() {
  const { user } = useAuth();
  const services = useServices();
  
  const [step, setStep] = useState<'shipping' | 'review' | 'payment' | 'success'>('shipping');
  const [cart, setCart] = useState<Cart | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
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
  const checkoutAttemptKey = useRef(`checkout-ui:${crypto.randomUUID()}`);

  useEffect(() => {
    const loadData = async () => {
      setLoadingCart(true);
      try {
        const [currentUser, userCart] = await Promise.all([
          services.authService.getCurrentUser(),
          services.cartService.getCart(user?.id ?? ''),
        ]);
        if (currentUser) setEmail(currentUser.email);
        setCart(userCart);
      } catch (err) {
        console.error('Failed to load checkout data', err);
      } finally {
        setLoadingCart(false);
      }
    };
    if (user) void loadData();

    // Load persisted address
    const savedAddress = localStorage.getItem('checkout:address');
    if (savedAddress) {
      try {
        setAddress(JSON.parse(savedAddress));
      } catch (e) {
        logger.error('Failed to parse saved address', e);
      }
    }
  }, [services, user]);

  // Persist address changes
  useEffect(() => {
    localStorage.setItem('checkout:address', JSON.stringify(address));
  }, [address]);

  const subtotal = useMemo(() => cart?.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0) ?? 0, [cart]);
  const shipping = subtotal >= 10000 ? 0 : 599;
  const total = subtotal + shipping;

  async function handleSuccess(paymentMethodId: string) {
    if (!user) return;
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
      <div className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border bg-white shadow-xl">
          <div className="bg-primary-600 px-6 py-12 text-center text-white">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold">Order Confirmed!</h2>
            <p className="mt-2 text-primary-100 opacity-90">Thank you for your purchase, {user?.displayName}.</p>
            <p className="mt-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-mono tracking-widest text-white">
              ORDER ID: {orderId.toUpperCase()}
            </p>
          </div>

          <div className="p-8">
            <h3 className="mb-6 text-xl font-bold text-gray-900">Order Summary</h3>
            <div className="mb-8 space-y-4">
              {cart?.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-xl border bg-gray-50">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatMoney(item.priceSnapshot * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-8 border-t pt-8 md:grid-cols-2">
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Shipping To</h4>
                <address className="not-italic text-sm text-gray-600">
                  <p className="font-bold text-gray-900">{user?.displayName}</p>
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state} {address.zip}</p>
                  <p>{address.country}</p>
                </address>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-gray-900">{shipping === 0 ? 'Free' : formatMoney(shipping)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold text-gray-900">
                  <span>Total Paid</span>
                  <span className="text-primary-600">{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-4 justify-center">
              <Link href="/orders" className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-4 font-bold text-white transition hover:bg-black">
                View My Orders
              </Link>
              <Link href="/products" className="flex items-center justify-center gap-2 rounded-xl border bg-white px-8 py-4 font-bold text-gray-700 transition hover:bg-gray-50">
                Keep Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Stepper */}
      <header className="border-b bg-white py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">PlayMore<span className="text-primary-600">TCG</span></Link>
          <nav className="hidden items-center gap-4 text-sm font-medium sm:flex">
            <Link href="/cart" className="text-primary-600 hover:text-primary-700">Cart</Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button onClick={() => setStep('shipping')} className={step === 'shipping' ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}>Information</button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button onClick={() => step !== 'shipping' && setStep('review')} className={step === 'review' ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}>Review</button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className={step === 'payment' ? 'text-gray-900 font-bold' : 'text-gray-500'}>Payment</span>
          </nav>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <LockKeyhole className="h-4 w-4 text-green-600" />
            <span className="hidden sm:inline">Secure Checkout</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Form Column */}
          <main className="lg:col-span-7">
            <Link href="/cart" className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" />
              Return to cart
            </Link>

            <div className="space-y-10">
              {/* Contact Information */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
                  {!user && <Link href="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">Already have an account? Log in</Link>}
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="relative">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      readOnly={!!user}
                      autoComplete="email"
                      className="w-full rounded-lg border bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-70"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  {!user && (
                    <div className="mt-4 flex items-center gap-2">
                      <input type="checkbox" id="save-info" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <label htmlFor="save-info" className="text-xs text-gray-600">Save my information for a faster checkout next time</label>
                    </div>
                  )}
                </div>
              </section>

              {/* Shipping Address */}
              <section className={step !== 'shipping' ? 'opacity-60 grayscale pointer-events-none' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                  {step !== 'shipping' && (
                    <button 
                      onClick={() => setStep('shipping')}
                      className="text-sm font-bold text-primary-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {/* ... fields ... */}
                <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
                  {/* ... fields ... */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Street Address</label>
                      <input
                        placeholder="123 TCG Lane"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        autoComplete="shipping street-address"
                        className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>
                    {/* ... other fields ... */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">City</label>
                        <input
                          placeholder="Pallet Town"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          autoComplete="shipping address-level2"
                          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">State / Province</label>
                        <input
                          placeholder="Kanto"
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          autoComplete="shipping address-level1"
                          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">ZIP / Postal Code</label>
                        <input
                          placeholder="12345"
                          value={address.zip}
                          onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                          autoComplete="shipping postal-code"
                          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Country</label>
                        <input
                          placeholder="US"
                          value={address.country}
                          onChange={(e) => setAddress({ ...address, country: e.target.value.toUpperCase() })}
                          autoComplete="shipping country"
                          className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {step === 'shipping' && (
                    <button
                      onClick={() => setStep('review')}
                      disabled={!address.street || !address.city || !address.state || !address.zip}
                      className="mt-6 w-full rounded-xl bg-gray-900 py-4 font-bold text-white transition hover:bg-black disabled:opacity-50"
                    >
                      Continue to Review
                    </button>
                  )}
                </div>
              </section>

              {/* Order Review Section */}
              {step !== 'shipping' && (
                <section className={step === 'review' ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : 'opacity-60 grayscale pointer-events-none'}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Review Your Order</h2>
                  </div>
                  <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                      Please verify your shipping details and order summary. Once confirmed, you can proceed to secure payment.
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Items ({cart?.items.length})</span>
                        <span className="font-bold">{formatMoney(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shipping</span>
                        <span className="font-bold">{shipping === 0 ? 'Free' : formatMoney(shipping)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 text-base font-extrabold">
                        <span>Grand Total</span>
                        <span className="text-primary-600">{formatMoney(total)}</span>
                      </div>
                    </div>
                    
                    {step === 'review' && (
                      <button
                        onClick={() => setStep('payment')}
                        className="mt-6 w-full rounded-xl bg-primary-600 py-4 font-bold text-white shadow-lg shadow-primary-200 transition hover:bg-primary-700"
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
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <LockKeyhole className="h-3 w-3" /> Encrypted by Stripe
                    </div>
                  </div>
                  
                  <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    {!isStripeConfigured && (
                      <div className="bg-amber-50 p-4 text-sm text-amber-800 border-b border-amber-100 flex gap-2">
                        <CreditCard className="h-5 w-5 shrink-0" />
                        <span>Checkout is temporarily unavailable because Stripe is not configured.</span>
                      </div>
                    )}

                    {isStripeConfigured && (
                      <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading secure payment form...</div>}>
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
                    <div id="checkout-error" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex gap-2 animate-bounce">
                      <span className="font-bold">Error:</span> {checkoutError}
                    </div>
                  )}

                  {checkoutStatus === 'finalizing' && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 flex items-center gap-3">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Securely finalizing your order... Please do not refresh.
                    </div>
                  )}
                </section>
              )}
            </div>
          </main>

          {/* Sticky Summary Column */}
          <aside className="lg:col-span-5">
            <div className="rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-8">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Order Summary</h2>
              
              {loadingCart ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="h-16 w-16 rounded-lg bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-100" />
                        <div className="h-4 w-1/4 rounded bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cart && cart.items.length > 0 ? (
                <div className="max-h-[40vh] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-gray-50">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white shadow-lg ring-2 ring-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-gray-500">Unit price {formatMoney(item.priceSnapshot)}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatMoney(item.priceSnapshot * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <ShoppingBag className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              )}

              <div className="mt-8 space-y-4 border-t pt-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'font-bold text-green-600' : 'font-medium text-gray-900'}>
                    {shipping === 0 ? 'Free' : formatMoney(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Estimated taxes</span>
                  <span className="font-medium text-gray-900">$0.00</span>
                </div>
                <div className="flex justify-between border-t pt-4 text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-2xl text-primary-600">{formatMoney(total)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <Truck className="h-4 w-4 text-primary-600" />
                  <span>Ships within 24 hours via Trusted Logistics</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <LockKeyhole className="h-4 w-4 text-green-600" />
                  <span>Secure 256-bit SSL encrypted checkout</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <ShieldCheck className="h-4 w-4 text-primary-600" />
                  <span>30-Day Money-Back Guarantee</span>
                </div>
                <div className="flex items-center justify-center gap-4 pt-4 opacity-30 grayscale filter">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                   <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                   <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}