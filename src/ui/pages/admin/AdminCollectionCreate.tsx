/**
 * [LAYER: UI]
 * Focused workspace for creating product collections and sets.
 * Designed for merchandising workflows with full-screen focus.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ImageIcon, 
  LayoutGrid, 
  Link as LinkIcon, 
  Save, 
  Sparkles, 
  Tag 
} from 'lucide-react';
import { 
  useToast, 
  useAdminPageTitle,
} from '../../components/admin/AdminComponents';
import { useServices } from '../../hooks/useServices';

export function AdminCollectionCreate() {
  useAdminPageTitle('Create Collection');
  const router = useRouter();
  const { toast } = useToast();
  const services = useServices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await services.collectionService.create(data);
      toast('success', 'Collection created successfully');
      router.push('/admin/collections');
      router.refresh();
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Failed to create collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-gray-400 shadow-sm transition hover:bg-gray-50 hover:text-gray-600 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Merchandising</p>
            <h1 className="text-2xl font-bold text-gray-900">Create Collection</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="rounded-xl px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Creating...' : 'Create Collection'}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* General Details */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Tag className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Collection Details</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Collection Name</label>
                <input 
                  name="name" 
                  required 
                  className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                  placeholder="e.g. Scarlet & Violet: 151" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Handle / URL Slug</label>
                <div className="relative mt-1.5">
                  <LinkIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input 
                    name="handle" 
                    className="w-full rounded-xl border bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                    placeholder="scarlet-violet-151" 
                  />
                </div>
                <p className="mt-2 text-[10px] text-gray-400">Leave blank to automatically generate from the name.</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                <textarea 
                  name="description" 
                  rows={4} 
                  className="mt-1.5 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                  placeholder="Marketing copy for this collection..." 
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Featured Image</h3>
            </div>
            
            <div className="space-y-4">
              <input 
                name="imageUrl" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500 focus:bg-white" 
                placeholder="https://images.unsplash.com/..." 
              />
              {imageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-gray-50">
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setImageUrl('')}
                    className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-md transition hover:bg-black/70"
                  >
                    <ArrowLeft className="h-4 w-4 rotate-45" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Availability */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <LayoutGrid className="h-4 w-4 text-gray-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Publishing</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-600">Status</label>
                <select name="status" className="mt-1 w-full rounded-xl border bg-gray-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="active">Active (Visible)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-linear-to-br from-indigo-600 to-primary-800 p-6 text-white shadow-xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5 text-indigo-200" />
            </div>
            <h3 className="text-sm font-bold">Smart Collections</h3>
            <p className="mt-2 text-[10px] leading-relaxed text-indigo-100">
              Soon you will be able to create "Smart Collections" that automatically include products based on tags, rarity, or price ranges.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
