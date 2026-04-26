'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import { 
  Package, 
  MessageCircle, 
  Camera, 
  Users, 
  Globe, 
  Mail, 
  ArrowUp, 
  CreditCard, 
  ShieldCheck, 
  ChevronDown,
  Calendar,
  Award
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 relative">
      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all duration-300 transform ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand and Description */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2 text-primary-700 font-bold text-2xl tracking-tight">
              <Package className="w-8 h-8" />
              PlayMoreTCG
            </Link>
            <p className="text-gray-500 text-base leading-relaxed max-w-sm">
              The ultimate destination for competitive and casual TCG players. 
              We provide authentic cards, premium accessories, and a space for the community to grow.
            </p>
            
            <div className="flex items-center gap-5 pt-2">
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all duration-300 border border-gray-100">
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all duration-300 border border-gray-100">
                <Camera className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all duration-300 border border-gray-100">
                <Users className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all duration-300 border border-gray-100">
                <Globe className="w-5 h-5" />
              </Link>
            </div>

            <div className="pt-4 flex items-center gap-3 text-sm font-medium text-gray-900 bg-primary-50/50 p-3 rounded-lg border border-primary-100 w-fit">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              <span>Verified Authentic & Secure Checkout</span>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Shop Navigation */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Shop</h3>
              <ul className="space-y-3">
                <li><Link href="/products" className="group flex items-center text-gray-500 hover:text-primary-600 text-sm transition-colors">All Collections</Link></li>
                <li><Link href="/products?category=rare" className="group flex items-center text-gray-500 hover:text-primary-600 text-sm transition-colors">Rare Single Cards</Link></li>
                <li><Link href="/products?category=sealed" className="group flex items-center text-gray-500 hover:text-primary-600 text-sm transition-colors">Sealed Products</Link></li>
                <li><Link href="/products?category=bundles" className="group flex items-center text-gray-500 hover:text-primary-600 text-sm transition-colors">Value Bundles <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">HOT</span></Link></li>
              </ul>
            </div>

            {/* Community & Events */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Community</h3>
              <ul className="space-y-3">
                <li><Link href="/events" className="group flex items-center text-gray-500 hover:text-primary-600 text-sm transition-colors"><Calendar className="w-3.5 h-3.5 mr-2 opacity-50 group-hover:opacity-100" /> Local Events</Link></li>
                <li><Link href="/grading" className="group flex items-center text-gray-500 hover:text-primary-600 text-sm transition-colors"><Award className="w-3.5 h-3.5 mr-2 opacity-50 group-hover:opacity-100" /> Grading Services</Link></li>
                <li><Link href="/blog" className="group flex items-center text-gray-500 hover:text-primary-600 text-sm transition-colors">Strategy Articles</Link></li>
                <li><Link href="#" className="group flex items-center text-gray-500 hover:text-primary-600 text-sm transition-colors">Player Rewards</Link></li>
              </ul>
            </div>

            {/* Help & Support */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Support</h3>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-500 hover:text-primary-600 text-sm transition-colors">Help Center</Link></li>
                <li><Link href="/shipping" className="text-gray-500 hover:text-primary-600 text-sm transition-colors">Track Your Order</Link></li>
                <li><Link href="/contact" className="text-gray-500 hover:text-primary-600 text-sm transition-colors">Contact Support</Link></li>
                <li><Link href="/returns" className="text-gray-500 hover:text-primary-600 text-sm transition-colors">Returns Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section - Full Width CTA */}
        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 mb-16 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary-500/20 transition-all duration-500"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-white text-3xl font-bold tracking-tight">Join the Inner Circle</h2>
              <p className="text-gray-400 text-lg max-w-md">Get exclusive access to pre-orders, rare card drops, and pro-level strategy guides.</p>
            </div>
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="relative flex-1 group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-primary-400 transition-colors" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white/10 transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-500 transition-all active:scale-95 shadow-lg shadow-primary-600/20"
              >
                Sign Me Up
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4">
            <Link href="/terms" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="/cookies" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors">Cookie Preference</Link>
            <span className="text-xs text-gray-300 hidden lg:block">|</span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <Globe className="w-3 h-3" />
              <span>United States (USD)</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          
          <div className="flex items-center gap-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <CreditCard className="w-6 h-6" />
            <div className="text-xs font-bold tracking-tighter uppercase italic">Mastercard</div>
            <div className="text-xs font-bold tracking-tighter uppercase">PayPal</div>
            <div className="text-xs font-bold tracking-tighter uppercase">Stripe</div>
          </div>

          <p className="text-xs text-gray-400 font-medium">
            © {currentYear} PlayMoreTCG. Built for the community.
          </p>
        </div>
      </div>
    </footer>
  );
}
