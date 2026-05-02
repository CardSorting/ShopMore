'use client';

/**
 * [LAYER: UI]
 * Advanced Digital Vault — Industrialized digital fulfillment portal.
 * Mirrors industry leaders (Steam/Gumroad) with grouped assets, activity history, and security transparency.
 */
import { useAuth } from '../hooks/useAuth';
import { useServices } from '../hooks/useServices';
import { 
  Download, 
  FileText, 
  Search, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  ChevronRight,
  HardDrive,
  Info,
  LayoutGrid,
  List,
  Filter,
  ArrowDownToLine,
  History,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { formatDate, formatRelativeTime } from '@utils/formatters';
import { logger } from '@utils/logger';

type ViewMode = 'grid' | 'list';

export function DigitalLibraryPage() {
  const { user } = useAuth();
  const services = useServices();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (!user) return;
    const loadAssets = async () => {
      try {
        const result = await services.orderService.getDigitalAssets(user.id);
        setItems(result);
      } catch (err) {
        logger.error('Failed to load digital assets', err);
      } finally {
        setLoading(false);
      }
    };
    void loadAssets();
  }, [user, services]);

  const categories = useMemo(() => {
    const cats = new Set(['all']);
    items.forEach(item => {
      item.assets.forEach((a: any) => {
        const type = a.mimeType.split('/')[1]?.toUpperCase() || 'OTHER';
        if (['PDF', 'DOCX', 'TXT'].includes(type)) cats.add('Guides');
        else if (['PNG', 'JPG', 'JPEG', 'SVG'].includes(type)) cats.add('Graphics');
        else if (['CSV', 'XLSX', 'JSON'].includes(type)) cats.add('Data');
        else cats.add('Packages');
      });
    });
    return Array.from(cats);
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.productName.toLowerCase().includes(q) || 
        item.assets.some((a: any) => a.name.toLowerCase().includes(q))
      );
    }
    
    if (activeCategory !== 'all') {
      result = result.filter(item => 
        item.assets.some((a: any) => {
           const type = a.mimeType.split('/')[1]?.toUpperCase() || 'OTHER';
           if (activeCategory === 'Guides') return ['PDF', 'DOCX', 'TXT'].includes(type);
           if (activeCategory === 'Graphics') return ['PNG', 'JPG', 'JPEG', 'SVG'].includes(type);
           if (activeCategory === 'Data') return ['CSV', 'XLSX', 'JSON'].includes(type);
           return !['PDF', 'DOCX', 'TXT', 'PNG', 'JPG', 'JPEG', 'SVG', 'CSV', 'XLSX', 'JSON'].includes(type);
        })
      );
    }
    return result;
  }, [items, searchQuery, activeCategory]);

  const recentActivity = useMemo(() => {
    const allAssetsWithLogs = items.flatMap(item => 
      item.assets
        .filter((a: any) => a.lastDownloadedAt)
        .map((a: any) => ({
          ...a,
          productName: item.productName,
          productImageUrl: item.productImageUrl
        }))
    );
    return allAssetsWithLogs.sort((a, b) => new Date(b.lastDownloadedAt).getTime() - new Date(a.lastDownloadedAt).getTime()).slice(0, 5);
  }, [items]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header Section */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full text-primary-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-primary-100">
               <ShieldCheck className="w-3.5 h-3.5" /> Encrypted Vault Access
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-4">Digital Locker.</h1>
            <p className="text-lg font-medium text-gray-500 leading-relaxed">
              Your permanent collection of high-fidelity TCG guides, exclusive art, and market data.
              Every purchase is snapshot-locked for lifetime access.
            </p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vault Status</p>
                <p className="text-sm font-black text-green-600 flex items-center gap-1.5 justify-end">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Ready
                </p>
             </div>
             <div className="h-8 w-px bg-gray-100" />
             <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                <HardDrive className="w-6 h-6" />
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Controls & Library */}
          <div className="lg:col-span-8 space-y-8">
            {/* Filter Bar */}
            <div className="sticky top-4 z-30 flex flex-col md:flex-row gap-4 p-4 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by product or file name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-sm"
                  />
               </div>
               <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                     <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                        <LayoutGrid className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                        <List className="w-4 h-4" />
                     </button>
                  </div>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                     {categories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                           {cat}
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-64 rounded-[3rem] bg-white border border-gray-100 animate-pulse" />
                 ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'flex flex-col gap-4'}>
                {filteredItems.map((item) => (
                   viewMode === 'grid' 
                    ? <AssetGridCard key={`${item.orderId}-${item.productId}`} item={item} userId={user.id} />
                    : <AssetListRow key={`${item.orderId}-${item.productId}`} item={item} userId={user.id} />
                ))}
              </div>
            ) : (
               <div className="py-32 bg-white rounded-[4rem] border border-gray-100 shadow-sm text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                     <Filter className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900">No matches found</h3>
                  <p className="text-gray-500 font-medium mt-2">Try adjusting your filters or search terms.</p>
                  <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="mt-8 font-black text-xs uppercase tracking-widest text-primary-600 hover:underline">Clear all filters</button>
               </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
             {/* Recent Activity */}
             <section className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                      <History className="w-4 h-4" />
                   </div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Vault Activity</h3>
                </div>
                {recentActivity.length > 0 ? (
                   <div className="space-y-6">
                      {recentActivity.map((log: any, idx) => (
                         <div key={idx} className="flex gap-4 items-start group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                               <img src={log.productImageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-xs font-black text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{log.name}</p>
                               <p className="text-[10px] font-medium text-gray-400 mt-0.5">Downloaded {formatRelativeTime(new Date(log.lastDownloadedAt))}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <p className="text-xs font-bold text-gray-400 italic">No recent download activity recorded.</p>
                )}
             </section>

             {/* Help & Support Widget */}
             <section className="bg-primary-600 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-xl shadow-primary-200/40">
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-6">
                      <HelpCircle className="w-5 h-5 text-primary-200" />
                      <h3 className="text-lg font-black tracking-tight">Need assistance?</h3>
                   </div>
                   <p className="text-sm font-medium text-primary-100 leading-relaxed mb-8 opacity-90">
                      Can't open a specific file type? Having trouble with a download link? Our support guild is ready to help.
                   </p>
                   <Link href="/support" className="flex items-center justify-between bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-4 transition-all group">
                      <span className="text-[10px] font-black uppercase tracking-widest">Visit Help Center</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                   </Link>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
             </section>

             {/* Pro Tip */}
             <div className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex gap-4">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                   <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Vault Tip</p>
                   <p className="text-xs font-bold text-amber-700 leading-relaxed">Download assets on your desktop for the best experience with high-res PDFs and CSV market data.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetGridCard({ item, userId }: { item: any, userId: string }) {
  return (
    <div className="group bg-white rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col">
       <div className="relative h-56 overflow-hidden">
          <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
             <Link href={`/orders/${item.orderId}`} className="text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:underline">
                View Order Receipt <ExternalLink className="w-3.5 h-3.5" />
             </Link>
          </div>
          <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-xl border border-white/50">
             Locker #{item.orderId.slice(0, 4).toUpperCase()}
          </div>
       </div>
       
       <div className="p-8 flex-1 flex flex-col">
          <div className="mb-8">
             <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                <Clock className="w-3.5 h-3.5" /> Secured on {formatDate(item.orderDate)}
             </div>
             <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">{item.productName}</h3>
          </div>

          <div className="space-y-4">
             {item.assets.map((asset: any) => (
                <a 
                  key={asset.id}
                  href={`/api/downloads/${asset.id}?userId=${userId}`}
                  download
                  className="flex items-center justify-between p-5 bg-gray-50 rounded-4xl border border-gray-100 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all group/asset shadow-xs relative overflow-hidden"
                >
                   <div className="flex items-center gap-4 min-w-0 relative z-10">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover/asset:text-primary-600 transition-colors shadow-sm">
                         <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-sm font-black truncate">{asset.name}</p>
                         <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-0.5">
                            {(asset.size / 1024 / 1024).toFixed(2)} MB • {asset.lastDownloadedAt ? `Last Downloaded ${formatRelativeTime(new Date(asset.lastDownloadedAt))}` : 'Not yet downloaded'}
                         </p>
                      </div>
                   </div>
                   <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 opacity-0 group-hover/asset:opacity-100 transition-all translate-x-4 group-hover/asset:translate-x-0">
                      <ArrowDownToLine className="w-5 h-5" />
                   </div>
                   <div className="absolute inset-0 bg-linear-to-r from-primary-600/20 to-transparent opacity-0 group-hover/asset:opacity-100 transition-opacity" />
                </a>
             ))}
          </div>
       </div>
    </div>
  );
}

function AssetListRow({ item, userId }: { item: any, userId: string }) {
   return (
      <div className="bg-white rounded-4xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:shadow-xl transition-all">
         <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
            <img src={item.productImageUrl} alt="" className="w-full h-full object-cover" />
         </div>
         <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-gray-900 truncate group-hover:text-primary-600 transition-colors">{item.productName}</h3>
            <div className="flex items-center gap-4 mt-1">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Added {formatDate(item.orderDate)}</p>
               <div className="w-1 h-1 bg-gray-200 rounded-full" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.assets.length} Assets</p>
            </div>
         </div>
         <div className="flex flex-wrap gap-2">
            {item.assets.map((asset: any) => (
               <a 
                  key={asset.id}
                  href={`/api/downloads/${asset.id}?userId=${userId}`}
                  download
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-xl transition-all text-xs font-black"
               >
                  <FileText className="w-4 h-4 opacity-40" />
                  <span>{asset.name.split('.').pop()?.toUpperCase()}</span>
                  <Download className="w-3.5 h-3.5" />
               </a>
            ))}
         </div>
      </div>
   );
}
