'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  X, 
  ImageIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  MoreHorizontal, 
  GripVertical,
  Type,
  Trash2,
  Star
} from 'lucide-react';
import { ProductMedia } from '@domain/models';

interface AdminMediaManagerProps {
  media: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
  folder?: 'products' | 'collections';
}

export function AdminMediaManager({ media, onChange, folder = 'products' }: AdminMediaManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | File[]) => {
    setIsUploading(true);
    setError(null);

    const newMedia: ProductMedia[] = [...media];
    
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Upload failed');

        newMedia.push({
          id: crypto.randomUUID(),
          url: data.path,
          position: newMedia.length,
          width: data.width,
          height: data.height,
          size: data.size,
          createdAt: new Date()
        });
      }

      onChange(newMedia);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (id: string) => {
    const updated = media.filter(m => m.id !== id).map((m, idx) => ({ ...m, position: idx }));
    onChange(updated);
  };

  const setPrimary = (id: string) => {
    const target = media.find(m => m.id === id);
    if (!target) return;
    
    const others = media.filter(m => m.id !== id);
    const updated = [target, ...others].map((m, idx) => ({ ...m, position: idx }));
    onChange(updated);
  };

  const updateAltText = (id: string, text: string) => {
    const updated = media.map(m => m.id === id ? { ...m, altText: text } : m);
    onChange(updated);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
  };

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <ImageIcon className="h-4 w-4" /> Media
        </h2>
        <span className="text-[10px] font-bold text-gray-400">{media.length} images</span>
      </div>

      <div className="grid gap-4">
        {/* Dropzone */}
        <div 
          className={`
            relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all
            ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center text-center cursor-pointer">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            ) : (
              <>
                <Upload className="mb-2 h-5 w-5 text-gray-400" />
                <p className="text-xs font-bold text-gray-600">Add images or drag to upload</p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </div>
        )}

        {/* Media Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((m, idx) => (
            <div 
              key={m.id} 
              className={`
                group relative aspect-square overflow-hidden rounded-xl border transition-all
                ${idx === 0 ? 'ring-2 ring-primary-500 ring-offset-2' : 'border-gray-100 hover:border-gray-300'}
              `}
            >
              <img src={m.url} alt={m.altText || ''} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              
              {/* Badges */}
              {idx === 0 && (
                <div className="absolute left-2 top-2 rounded-full bg-primary-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-tight text-white shadow-lg">
                  Primary
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">
                <div className="flex gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPrimary(m.id); }}
                    className="rounded-lg bg-white p-2 text-gray-700 shadow-xl transition hover:bg-primary-600 hover:text-white"
                    title="Set as primary"
                  >
                    <Star className={`h-3.5 w-3.5 ${idx === 0 ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingAltId(m.id); }}
                    className="rounded-lg bg-white p-2 text-gray-700 shadow-xl transition hover:bg-primary-600 hover:text-white"
                    title="Edit alt text"
                  >
                    <Type className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeMedia(m.id); }}
                    className="rounded-lg bg-white p-2 text-gray-700 shadow-xl transition hover:bg-red-600 hover:text-white"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Alt Text Overlay (when editing) */}
              {editingAltId === m.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-2 backdrop-blur-md">
                  <div className="w-full space-y-2">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Alt Text (SEO)</p>
                    <input 
                      autoFocus
                      value={m.altText || ''}
                      onChange={(e) => updateAltText(m.id, e.target.value)}
                      onBlur={() => setEditingAltId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingAltId(null)}
                      className="w-full rounded-lg border bg-gray-50 px-2 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Describe this image..."
                    />
                    <button 
                      onClick={() => setEditingAltId(null)}
                      className="w-full rounded-lg bg-primary-600 py-1 text-[10px] font-bold text-white"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl border bg-gray-50/50 p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm ring-1 ring-black/5">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">Pro Merchandising Strategy</p>
          <p className="text-[10px] leading-tight text-gray-500">
            The first image is your **Primary Display**. Use high-contrast photos for cards to increase click-through rates.
          </p>
        </div>
      </div>
    </section>
  );
}

// Utility Sparkles icon for the tip
function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}
