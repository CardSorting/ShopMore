'use client';

import { useAuth } from '../hooks/useAuth';
import { Package, Heart, MapPin, Settings, Star, ChevronRight, LogOut, ShieldCheck, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@utils/formatters';

export function AccountPage() {
  const { user, signOut } = useAuth();

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-5xl p-12 text-center shadow-xl border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Welcome Back</h1>
        <p className="text-gray-500 mb-10 font-medium leading-relaxed">Sign in to track your orders, view your wishlist, and manage your collection vault.</p>
        <Link href="/login" className="block w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200">
          Sign In to Account
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4">Account Dashboard</h1>
            <p className="text-gray-500 font-medium">Manage your vault, track shipments, and view rewards.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-black text-gray-400">
                    {i}
                  </div>
                ))}
             </div>
             <p className="text-xs font-bold text-gray-400"><span className="text-gray-900 font-black">Level 3</span> Collector</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            <AccountNavLink href="/account" icon={Settings} label="Overview" active />
            <AccountNavLink href="/orders" icon={Package} label="Order History" />
            <AccountNavLink href="/wishlist" icon={Heart} label="My Wishlist" />
            <AccountNavLink href="/account/addresses" icon={MapPin} label="Saved Addresses" />
            <AccountNavLink href="/rewards" icon={Star} label="Vault Rewards" />
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 space-y-12">
            {/* Rewards Overview */}
            <div className="bg-gray-900 rounded-5xl p-10 text-white relative overflow-hidden group">
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-primary-400 text-[10px] font-black uppercase tracking-widest mb-6">
                       <Tag className="w-3.5 h-3.5 fill-current" /> Vault Rewards
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter mb-4">You have <span className="text-primary-400">1,250</span> points</h2>
                    <p className="text-gray-400 font-medium mb-10 leading-relaxed">You're just 250 points away from a $15 credit towards your next legendary pull.</p>
                    <Link href="/rewards" className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-xl shadow-white/5">
                       Redeem Points
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Next Tier</p>
                        <p className="text-xl font-black">Elite Member</p>
                     </div>
                     <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Lifetime Saved</p>
                        <p className="text-xl font-black text-primary-400">$45.00</p>
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] -mr-32 -mt-32" />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <section>
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Orders</h3>
                     <Link href="/orders" className="text-xs font-black text-primary-600 hover:underline">View All</Link>
                  </div>
                  <div className="space-y-4">
                     <OrderCard 
                       id="ORD-92834" 
                       date="May 12, 2026" 
                       status="In Transit" 
                       total={12499} 
                       items={3}
                     />
                     <OrderCard 
                       id="ORD-92812" 
                       date="May 05, 2026" 
                       status="Delivered" 
                       total={4550} 
                       items={1}
                     />
                  </div>
               </section>

               <section>
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Personal Details</h3>
                     <button className="text-xs font-black text-primary-600 hover:underline">Edit</button>
                  </div>
                  <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 space-y-6">
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                        <p className="text-lg font-black text-gray-900">{user.displayName || 'Collector Player'}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                        <p className="text-lg font-black text-gray-900">{user.email}</p>
                     </div>
                     <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3 text-green-600">
                           <ShieldCheck className="w-5 h-5" />
                           <p className="text-xs font-black uppercase tracking-widest">Verified Account</p>
                        </div>
                     </div>
                  </div>
               </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function AccountNavLink({ href, icon: Icon, label, active = false }: { href: string, icon: any, label: string, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center justify-between w-full px-6 py-4 rounded-2xl transition-all group ${active ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <div className="flex items-center gap-4">
        <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600 transition-colors'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'translate-x-0' : '-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
    </Link>
  );
}

function OrderCard({ id, date, status, total, items }: { id: string, date: string, status: string, total: number, items: number }) {
  return (
    <div className="bg-white rounded-4xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
               <Clock className="w-5 h-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{id}</p>
               <p className="text-sm font-black text-gray-900">{date}</p>
            </div>
         </div>
         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${status === 'Delivered' ? 'bg-green-50 text-green-700' : 'bg-primary-50 text-primary-700 animate-pulse'}`}>
            {status}
         </span>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
         <p className="text-xs font-bold text-gray-400">{items} item{items !== 1 ? 's' : ''}</p>
         <p className="text-lg font-black text-gray-900">{formatCurrency(total)}</p>
      </div>
    </div>
  );
}
