'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileImageIcon, 
  Trash2, 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  Check, 
  Loader2,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { formatBytes } from '@utils/formatters';
import { useToast } from '@ui/components/admin/AdminComponents';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  folder: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/media');
      const data = await response.json();
      if (response.ok) setFiles(data.files);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const deleteFile = async (file: MediaFile) => {
    if (!confirm(`Permanently delete ${file.name}? This may break products using this image.`)) return;

    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        body: JSON.stringify({ url: file.url }),
      });

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.url !== file.url));
        toast('success', 'File deleted');
      }
    } catch (err) {
      toast('error', 'Failed to delete file');
    }
  };

  const copyUrl = (url: string, id: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast('success', 'URL copied to clipboard');
  };

  const filtered = files.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase()) || 
    f.folder.toLowerCase().includes(query.toLowerCase())
  );

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Central Media Library</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-2 shadow-sm">
          <HardDrive className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400">Storage Used</p>
            <p className="text-xs font-bold text-gray-900">{formatBytes(totalSize)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50/50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files by name or folder..." 
                className="w-full rounded-xl border bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <FileImageIcon className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No files found</h3>
            <p className="mt-1 text-xs text-gray-500">Try adjusting your search or upload more images.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Folder</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Modified</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((file) => (
                  <tr key={file.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                          <img src={file.url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900 leading-tight">{file.name}</p>
                          <p className="truncate text-[10px] text-gray-500 font-medium">{file.url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight text-gray-600">
                        {file.folder}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyUrl(file.url, file.id)}
                          className="rounded-lg border bg-white p-2 text-gray-500 shadow-sm hover:text-primary-600 hover:border-primary-200 transition"
                          title="Copy full URL"
                        >
                          {copiedId === file.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="rounded-lg border bg-white p-2 text-gray-500 shadow-sm hover:text-primary-600 hover:border-primary-200 transition"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button 
                          onClick={() => deleteFile(file)}
                          className="rounded-lg border bg-white p-2 text-gray-500 shadow-sm hover:text-red-600 hover:border-red-200 transition"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Approachable Asset Management</h4>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Files uploaded here are automatically optimized using the **Lean Local Strategy**. 
              Deleting a file here will remove it permanently from the server. If a product is using a deleted image, it will fall back to a placeholder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
