'use client';

/**
 * [LAYER: UI]
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Info,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Truck,
} from 'lucide-react';
import type { Address, Order } from '@domain/models';
import { logger } from '@utils/logger';
import { isStripeConfigured } from '../checkout/stripeClient';
import { OrderConfirmation } from '../checkout/OrderConfirmation';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useServices } from '../hooks/useServices';

const StripeCheckoutForm = lazy(() => import('../checkout/StripeCheckoutForm').then((module) => ({ default: module.StripeCheckoutForm })));

type CheckoutStep = 'information' | 'shipping' | 'payment';

type CheckoutFieldErrors = Partial<Record<'email' | 'street' | 'city' | 'state' | 'zip', string>>;

const CHECKOUT_STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: 'information', label: 'Information' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
];

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateCheckoutDetails(email: string, address: Address): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  if (!validateEmail(email)) errors.email = 'Enter a valid email address for your receipt and delivery updates.';
  if (!address.street.trim()) errors.street = 'Enter the street address where your order should ship.';
  if (!address.city.trim()) errors.city = 'Enter a city.';
  if (!address.state.trim()) errors.state = 'Enter a state or region.';
  if (!address.zip.trim()) errors.zip = 'Enter a ZIP or postal code.';
  return errors;
}

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading: loadingCart, subtotal, totalItems } = useCart();
  const services = useServices();

  const [step, setStep] = useState<CheckoutStep>('information');
  const [isSuccess, setIsSuccess] = useState(false);
  const [finalOrder, setFinalOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<Address>({ street: '', city: '', state: '', zip: '', country: 'US' });
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'authorizing' | 'finalizing'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [discountCode, setDiscountCode] = useState('');
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const checkoutAttemptKey = useRef(`checkout-ui:${crypto.randomUUID()}`);

  useEffect(() => {
    if (user) setEmail(user.email);
    const savedAddress = localStorage.getItem('checkout:address');
    if (savedAddress) {
      try {
        setAddress(JSON.parse(savedAddress));
      } catch (e) {
        logger.error('Failed to parse saved address', e);
      }
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('checkout:address', JSON.stringify(address));
  }, [address]);

  const shipping = subtotal >= 10000 ? 0 : 599;
  const discountAmount = appliedDiscount?.amount ?? 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);
  const freeShippingRemaining = Math.max(0, 10000 - subtotal);
  const detailsValid = Object.keys(validateCheckoutDetails(email, address)).length === 0;
  const currentStepIndex = CHECKOUT_STEPS.findIndex((item) => item.id === step);

  const summaryRows = useMemo(() => [
    ['Subtotal', formatMoney(subtotal)],
    ['Shipping', shipping === 0 ? 'Free' : formatMoney(shipping)],
    ...(appliedDiscount ? [['Discount', `-${formatMoney(appliedDiscount.amount)}`]] : []),
  ], [appliedDiscount, shipping, subtotal]);

  function goToStep(nextStep: CheckoutStep) {
    if (nextStep === 'payment' || nextStep === 'shipping') {
      const errors = validateCheckoutDetails(email, address);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        setStep('information');
        return;
      }
    }
    setStep(nextStep);
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsApplying(true);
    setDiscountMessage(null);
    setTimeout(() => {
      const code = discountCode.trim().toUpperCase();
      if (code === 'WELCOME10') {
        setAppliedDiscount({ code, amount: Math.floor(subtotal * 0.1) });
        setDiscountMessage('WELCOME10 applied. Your discount is reflected below.');
      } else if (code === 'SAVE5') {
        setAppliedDiscount({ code, amount: 500 });
        setDiscountMessage('SAVE5 applied. Your discount is reflected below.');
      } else {
        setDiscountMessage('That code is not available. Check the spelling or try another code.');
      }
      setIsApplying(false);
      setDiscountCode('');
    }, 500);
  };

  async function handleSuccess(paymentMethodId: string) {
    if (!user) {
      setCheckoutError('Please sign in to complete your order. Your cart and checkout details have been saved.');
      return;
    }
    const errors = validateCheckoutDetails(email, address);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setCheckoutError('Review the highlighted checkout details before payment.');
      setStep('information');
      return;
    }
    setCheckoutError(null);
    setCheckoutStatus('finalizing');
    try {
      const normalizedAddress = { ...address, country: address.country.trim().toUpperCase() || 'US' };
      const order = await services.orderService.finalizeTrustedCheckout(user.id, normalizedAddress, paymentMethodId, checkoutAttemptKey.current);
      setFinalOrder(order);
      checkoutAttemptKey.current = `checkout-ui:${crypto.randomUUID()}`;
      setIsSuccess(true);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout could not be finalized. Please try again.');
    } finally {
      setPlacing(false);
      setCheckoutStatus('idle');
    }
  }

  useEffect(() => {
    if (checkoutError) document.getElementById('checkout-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [checkoutError]);

  if (isSuccess && finalOrder) return <OrderConfirmation order={finalOrder} userEmail={email} userName={user?.displayName} />;

  const cartItems = cart?.items ?? [];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-black tracking-tighter text-gray-900">PlayMore<span className="text-primary-600">TCG</span></Link>
          <div className="hidden items-center gap-3 rounded-full border border-green-100 bg-green-50 px-4 py-2 md:flex">
            <LockKeyhole className="h-3.5 w-3.5 text-green-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Secure checkout powered by Stripe patterns</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12">
        <main className="px-4 py-10 sm:px-6 lg:col-span-7 lg:px-8 lg:pr-16">
          <nav aria-label="Checkout progress" className="mb-10 flex items-center gap-2 overflow-x-auto text-sm font-bold">
            <Link href="/cart" className="flex items-center gap-1 text-primary-600 hover:underline">Cart <ChevronRight className="h-4 w-4 text-gray-300" /></Link>
            {CHECKOUT_STEPS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-current={step === item.id ? 'step' : undefined}
                disabled={index > currentStepIndex + 1}
                onClick={() => goToStep(item.id)}
                className={`flex items-center gap-1 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${step === item.id ? 'text-gray-950' : index < currentStepIndex ? 'text-primary-600' : 'text-gray-400 hover:text-gray-700'}`}
              >
                {index < currentStepIndex && <CheckCircle2 className="h-4 w-4" />}
                {item.label}{index < CHECKOUT_STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
              </button>
            ))}
          </nav>

          <div className="max-w-xl">
            {checkoutError && (
              <div id="checkout-error" role="alert" className="mb-6 flex gap-3 rounded-2xl border-2 border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div><p className="font-black">Checkout needs attention</p><p className="mt-1 text-xs opacity-80">{checkoutError}</p></div>
              </div>
            )}

            {step === 'information' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-5 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Express checkout</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {['Apple Pay', 'Google Pay'].map((label) => (
                      <button key={label} type="button" disabled title="Wallet checkout is not enabled yet" className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 py-4 text-sm font-black text-gray-400">
                        <Smartphone className="h-4 w-4" /> {label} unavailable
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-xs font-medium text-gray-500">Continue below for secure card checkout.</p>
                </section>

                <section>
                  <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">Contact</h1>
                    {!user && <Link href="/login" className="text-sm font-bold text-primary-600 hover:underline">Log in for faster checkout</Link>}
                  </div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!!user} placeholder="you@example.com" className={`w-full rounded-2xl border-2 bg-white py-4 pl-11 pr-4 text-sm font-bold text-gray-900 outline-none transition focus:ring-4 focus:ring-primary-50 ${fieldErrors.email ? 'border-red-300' : 'border-gray-100 focus:border-primary-500'}`} />
                  </div>
                  {fieldErrors.email && <p className="mt-2 text-xs font-bold text-red-600">{fieldErrors.email}</p>}
                  <label className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-600"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600" /> Email me order updates and collector offers.</label>
                </section>

                <section>
                  <h2 className="mb-6 text-2xl font-black tracking-tight text-gray-900">Shipping address</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">Address</label>
                      <input autoComplete="shipping street-address" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="Street address or PO box" className={`w-full rounded-2xl border-2 px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-50 ${fieldErrors.street ? 'border-red-300' : 'border-gray-100 focus:border-primary-500'}`} />
                      {fieldErrors.street && <p className="mt-2 text-xs font-bold text-red-600">{fieldErrors.street}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div><label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">City</label><input autoComplete="shipping address-level2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className={`w-full rounded-2xl border-2 px-4 py-4 text-sm font-bold outline-none ${fieldErrors.city ? 'border-red-300' : 'border-gray-100'}`} />{fieldErrors.city && <p className="mt-2 text-xs font-bold text-red-600">{fieldErrors.city}</p>}</div>
                      <div><label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">State</label><input autoComplete="shipping address-level1" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className={`w-full rounded-2xl border-2 px-4 py-4 text-sm font-bold outline-none ${fieldErrors.state ? 'border-red-300' : 'border-gray-100'}`} />{fieldErrors.state && <p className="mt-2 text-xs font-bold text-red-600">{fieldErrors.state}</p>}</div>
                      <div><label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">ZIP</label><input autoComplete="shipping postal-code" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} className={`w-full rounded-2xl border-2 px-4 py-4 text-sm font-bold outline-none ${fieldErrors.zip ? 'border-red-300' : 'border-gray-100'}`} />{fieldErrors.zip && <p className="mt-2 text-xs font-bold text-red-600">{fieldErrors.zip}</p>}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div><label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">Country</label><input autoComplete="shipping country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="w-full rounded-2xl border-2 border-gray-100 px-4 py-4 text-sm font-bold outline-none" /></div>
                      <div><label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">Phone optional</label><input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="For carrier delivery questions" className="w-full rounded-2xl border-2 border-gray-100 px-4 py-4 text-sm font-bold outline-none" /></div>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col-reverse gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:underline"><ArrowLeft className="h-4 w-4" /> Return to cart</Link>
                  <button onClick={() => goToStep('shipping')} className="rounded-2xl bg-gray-900 px-8 py-5 text-sm font-black text-white shadow-xl transition hover:bg-black">Continue to shipping</button>
                </div>
              </div>
            )}

            {step === 'shipping' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-3 duration-300">
                <ReviewCard email={email} address={address} shipping={shipping} onChange={setStep} />
                <section>
                  <h1 className="mb-6 text-2xl font-black tracking-tight text-gray-900">Shipping method</h1>
                  <div className="rounded-3xl border-2 border-primary-500 bg-primary-50/30 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4"><span className="flex h-5 w-5 items-center justify-center rounded-full border-4 border-primary-600 bg-white" /><div><p className="text-sm font-black text-gray-900">Standard insured shipping</p><p className="mt-1 text-xs font-medium text-gray-500">Tracked, protected packaging • estimated 3–5 business days</p></div></div>
                      <span className="text-sm font-black text-gray-900">{shipping === 0 ? 'FREE' : formatMoney(shipping)}</span>
                    </div>
                  </div>
                </section>
                <div className="rounded-2xl bg-blue-50 p-5 text-sm text-blue-800"><div className="flex gap-3"><Info className="h-5 w-5 shrink-0" /><p><span className="font-black">Shopify-style review:</span> you can still change your contact and address before payment.</p></div></div>
                <div className="flex flex-col-reverse gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <button onClick={() => setStep('information')} className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:underline"><ArrowLeft className="h-4 w-4" /> Return to information</button>
                  <button onClick={() => goToStep('payment')} className="rounded-2xl bg-gray-900 px-8 py-5 text-sm font-black text-white shadow-xl transition hover:bg-black">Continue to payment</button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-3 duration-300">
                <ReviewCard email={email} address={address} shipping={shipping} onChange={setStep} />
                <section>
                  <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-black tracking-tight text-gray-900">Payment</h1><span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-700"><ShieldCheck className="h-3.5 w-3.5" /> Secure</span></div>
                  <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs font-medium text-gray-600">Your payment details are entered in Stripe Elements. PlayMoreTCG never stores your full card number.</div>
                  <div className="overflow-hidden rounded-3xl border-2 border-gray-900 shadow-xl shadow-gray-200/50">
                    {isStripeConfigured ? (
                      <Suspense fallback={<div className="p-16 text-center text-sm font-bold text-gray-400 animate-pulse">Initializing secure gateway...</div>}>
                        <StripeCheckoutForm address={address} onSuccess={handleSuccess} onPlaceOrder={(isPlacing) => { setPlacing(isPlacing); setCheckoutStatus(isPlacing ? 'authorizing' : 'idle'); }} isPlacing={placing || checkoutStatus !== 'idle'} />
                      </Suspense>
                    ) : (
                      <div className="bg-amber-50 p-8 text-center"><AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-500" /><p className="text-sm font-black text-amber-900">Payment gateway unavailable</p><p className="mt-2 text-xs font-medium text-amber-700">Stripe is not configured for this environment. Please contact support or try again later.</p></div>
                    )}
                  </div>
                </section>
                <button onClick={() => setStep('shipping')} className="inline-flex items-center gap-2 border-t border-gray-100 pt-6 text-sm font-bold text-primary-600 hover:underline"><ArrowLeft className="h-4 w-4" /> Return to shipping</button>
              </div>
            )}

            <footer className="mt-16 border-t border-gray-100 pt-8"><div className="flex flex-wrap gap-5 text-[10px] font-black uppercase tracking-widest text-gray-400"><Link href="/refund-policy" className="hover:text-gray-900">Refund policy</Link><Link href="/shipping-policy" className="hover:text-gray-900">Shipping policy</Link><Link href="/privacy-policy" className="hover:text-gray-900">Privacy policy</Link><Link href="/terms" className="hover:text-gray-900">Terms</Link></div></footer>
          </div>
        </main>

        <aside className="border-t border-gray-100 bg-gray-50/70 px-4 py-8 sm:px-6 lg:sticky lg:top-[73px] lg:col-span-5 lg:h-[calc(100vh-73px)] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-12">
          <div className="mx-auto max-w-md">
            <button onClick={() => setSummaryOpen(!summaryOpen)} className="mb-6 flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 lg:hidden"><span className="flex items-center gap-2 text-sm font-black text-gray-800"><ShoppingBag className="h-4 w-4" /> {summaryOpen ? 'Hide' : 'Show'} order summary</span><span className="flex items-center gap-2 font-black">{formatMoney(total)} <ChevronDown className={`h-4 w-4 transition ${summaryOpen ? 'rotate-180' : ''}`} /></span></button>
            <div className={`${summaryOpen ? 'block' : 'hidden'} lg:block`}>
              <div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-black text-gray-900">Order summary</h2><span className="text-xs font-bold text-gray-500">{totalItems} item{totalItems === 1 ? '' : 's'}</span></div>
              <div className="max-h-72 space-y-4 overflow-y-auto pr-2">
                {loadingCart ? [1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />) : cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"><img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /><span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-[10px] font-black text-white ring-2 ring-white">{item.quantity}</span></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-gray-900">{item.name}</p><p className="mt-1 text-[10px] font-bold text-gray-400">{formatMoney(item.priceSnapshot)} each</p></div><p className="text-xs font-black text-gray-900">{formatMoney(item.priceSnapshot * item.quantity)}</p></div>
                ))}
              </div>
              <div className="mt-8 border-t border-gray-200 pt-6"><div className="flex gap-2"><input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Discount code" className="min-w-0 flex-1 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-primary-500" /><button onClick={handleApplyDiscount} disabled={isApplying || !discountCode.trim()} className="rounded-2xl bg-gray-200 px-5 py-3 text-xs font-black text-gray-700 disabled:opacity-50">{isApplying ? <RefreshCcw className="h-4 w-4 animate-spin" /> : 'Apply'}</button></div>{discountMessage && <p className={`mt-3 text-xs font-bold ${appliedDiscount ? 'text-green-700' : 'text-amber-700'}`}>{discountMessage}</p>}{appliedDiscount && <div className="mt-3 flex items-center justify-between rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-700"><span className="flex items-center gap-2"><Tag className="h-3.5 w-3.5" /> {appliedDiscount.code}</span><button onClick={() => { setAppliedDiscount(null); setDiscountMessage(null); }} className="opacity-60 hover:opacity-100">Remove</button></div>}</div>
              <div className="mt-8 space-y-3 border-t border-gray-200 pt-6">{summaryRows.map(([label, value]) => <div key={label} className={`flex justify-between text-sm font-bold ${label === 'Discount' ? 'text-green-600' : 'text-gray-500'}`}><span>{label}</span><span className="text-gray-900">{value}</span></div>)}<div className="flex items-end justify-between border-t border-gray-200 pt-5"><span className="text-lg font-black text-gray-900">Total</span><span className="text-right"><span className="mr-2 text-[10px] font-black uppercase text-gray-400">USD</span><span className="text-3xl font-black tracking-tighter text-gray-900">{formatMoney(total)}</span></span></div></div>
              {freeShippingRemaining > 0 ? <div className="mt-6 rounded-2xl bg-white p-4 text-xs font-bold text-gray-600 shadow-sm"><Truck className="mb-2 h-4 w-4 text-primary-600" /> Add {formatMoney(freeShippingRemaining)} more for free standard shipping.</div> : <div className="mt-6 rounded-2xl bg-green-50 p-4 text-xs font-bold text-green-700"><Truck className="mb-2 h-4 w-4" /> Free standard shipping unlocked.</div>}
              <div className="mt-8 grid gap-4"><TrustItem icon={<ShieldCheck className="h-4 w-4" />} title="Buyer protection" text="Authenticity-backed singles and sealed products." /><TrustItem icon={<PackageCheck className="h-4 w-4" />} title="Protected packaging" text="Sleeved, packed, and boxed for collectors." /><TrustItem icon={<HelpCircle className="h-4 w-4" />} title="Support after purchase" text="Order help, returns guidance, and delivery questions." /></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ReviewCard({ email, address, shipping, onChange }: { email: string; address: Address; shipping: number; onChange: (step: CheckoutStep) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white text-sm shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b p-4"><span className="w-20 text-xs font-black uppercase tracking-widest text-gray-400">Contact</span><span className="min-w-0 flex-1 truncate font-bold text-gray-700">{email}</span><button onClick={() => onChange('information')} className="text-xs font-black text-primary-600 hover:underline">Change</button></div>
      <div className="flex items-center justify-between gap-4 border-b p-4"><span className="w-20 text-xs font-black uppercase tracking-widest text-gray-400">Ship to</span><span className="min-w-0 flex-1 truncate font-bold text-gray-700">{address.street}, {address.city}, {address.state} {address.zip}</span><button onClick={() => onChange('information')} className="text-xs font-black text-primary-600 hover:underline">Change</button></div>
      <div className="flex items-center justify-between gap-4 p-4"><span className="w-20 text-xs font-black uppercase tracking-widest text-gray-400">Method</span><span className="min-w-0 flex-1 truncate font-bold text-gray-700">Standard insured • {shipping === 0 ? 'Free' : formatMoney(shipping)}</span><button onClick={() => onChange('shipping')} className="text-xs font-black text-primary-600 hover:underline">Change</button></div>
    </div>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-primary-600 shadow-sm">{icon}</div><div><p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{title}</p><p className="mt-1 text-[10px] font-bold text-gray-400">{text}</p></div></div>;
}
