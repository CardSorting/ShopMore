'use client';

import React, { useEffect, useState } from 'react';
import { X, Filter, Check, RotateCcw, ChevronDown, Tag, Box, Store, AlertCircle } from 'lucide-react';

interface FilterGroupProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  activeCount?: number;
}

function FilterGroup({ label, isOpen, onToggle, children, activeCount }: FilterGroupProps) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left transition-colors hover:bg-gray-50/50 px-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
          {activeCount ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
              {activeCount}
            </span>
          ) : null}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="pb-4 px-4 space-y-1 animate-in slide-in-from-top-2 duration-200">{children}</div>}
    </div>
  );
}

interface FilterOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  count?: number;
}

function FilterOption({ label, selected, onClick, count }: FilterOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
        selected ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
          selected ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'
        }`}>
          {selected && <Check className="h-3 w-3 text-white stroke-[3px]" />}
        </div>
        <span>{label}</span>
      </div>
      {count !== undefined && <span className="text-[10px] text-gray-400 font-medium">{count}</span>}
    </button>
  );
}

interface AdminFilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: {
    status: string;
    category: string;
    vendor: string;
    inventory: string;
    margin: string;
    hasSku: 'all' | 'yes' | 'no';
    hasImage: 'all' | 'yes' | 'no';
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  facets: {
    vendors: string[];
    categories: string[];
    counts: Record<string, number>;
  };
}

export function AdminFilterPanel({ 
  open, 
  onClose, 
  filters, 
  onFilterChange, 
  onReset,
  facets 
}: AdminFilterPanelProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    status: true,
    category: true,
    vendor: false,
    inventory: false,
    margin: false,
    content: false,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'hasSku' || key === 'hasImage') return val !== 'all';
    return val !== 'all';
  }).length;

  return (
    <div className="fixed inset-0 z-100 flex justify-end overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-sm border-l bg-white shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-900 p-2 text-white">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Advanced Filters</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {activeFiltersCount} filters active
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Body */}
        <div className="h-[calc(100vh-140px)] overflow-y-auto pb-8 scrollbar-hide">
          <FilterGroup 
            label="Product Status" 
            isOpen={openGroups.status} 
            onToggle={() => toggleGroup('status')}
            activeCount={filters.status !== 'all' ? 1 : 0}
          >
            <FilterOption label="Active" selected={filters.status === 'active'} onClick={() => onFilterChange('status', filters.status === 'active' ? 'all' : 'active')} />
            <FilterOption label="Draft" selected={filters.status === 'draft'} onClick={() => onFilterChange('status', filters.status === 'draft' ? 'all' : 'draft')} />
            <FilterOption label="Archived" selected={filters.status === 'archived'} onClick={() => onFilterChange('status', filters.status === 'archived' ? 'all' : 'archived')} />
          </FilterGroup>

          <FilterGroup 
            label="Category" 
            isOpen={openGroups.category} 
            onToggle={() => toggleGroup('category')}
            activeCount={filters.category !== 'all' ? 1 : 0}
          >
            {facets.categories.map(cat => (
              <FilterOption 
                key={cat} 
                label={cat.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')} 
                selected={filters.category === cat} 
                onClick={() => onFilterChange('category', filters.category === cat ? 'all' : cat)} 
                count={facets.counts[cat]}
              />
            ))}
          </FilterGroup>

          <FilterGroup 
            label="Vendor / Supplier" 
            isOpen={openGroups.vendor} 
            onToggle={() => toggleGroup('vendor')}
            activeCount={filters.vendor !== 'all' ? 1 : 0}
          >
            {facets.vendors.map(vendor => (
              <FilterOption 
                key={vendor} 
                label={vendor} 
                selected={filters.vendor === vendor} 
                onClick={() => onFilterChange('vendor', filters.vendor === vendor ? 'all' : vendor)} 
              />
            ))}
          </FilterGroup>

          <FilterGroup 
            label="Inventory Health" 
            isOpen={openGroups.inventory} 
            onToggle={() => toggleGroup('inventory')}
            activeCount={filters.inventory !== 'all' ? 1 : 0}
          >
            <FilterOption label="Healthy" selected={filters.inventory === 'healthy'} onClick={() => onFilterChange('inventory', 'healthy')} />
            <FilterOption label="Low Stock" selected={filters.inventory === 'low_stock'} onClick={() => onFilterChange('inventory', 'low_stock')} />
            <FilterOption label="Out of Stock" selected={filters.inventory === 'out_of_stock'} onClick={() => onFilterChange('inventory', 'out_of_stock')} />
          </FilterGroup>

          <FilterGroup 
            label="Content Quality" 
            isOpen={openGroups.content} 
            onToggle={() => toggleGroup('content')}
            activeCount={(filters.hasSku !== 'all' ? 1 : 0) + (filters.hasImage !== 'all' ? 1 : 0)}
          >
            <div className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">SKU Presence</div>
            <FilterOption label="Has SKU" selected={filters.hasSku === 'yes'} onClick={() => onFilterChange('hasSku', 'yes')} />
            <FilterOption label="Missing SKU" selected={filters.hasSku === 'no'} onClick={() => onFilterChange('hasSku', 'no')} />
            
            <div className="mt-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Media</div>
            <FilterOption label="Has Photos" selected={filters.hasImage === 'yes'} onClick={() => onFilterChange('hasImage', 'yes')} />
            <FilterOption label="Missing Photos" selected={filters.hasImage === 'no'} onClick={() => onFilterChange('hasImage', 'no')} />
          </FilterGroup>

          <FilterGroup 
            label="Margins & Pricing" 
            isOpen={openGroups.margin} 
            onToggle={() => toggleGroup('margin')}
            activeCount={filters.margin !== 'all' ? 1 : 0}
          >
            <FilterOption label="Premium (> 50%)" selected={filters.margin === 'premium'} onClick={() => onFilterChange('margin', 'premium')} />
            <FilterOption label="Healthy (20-50%)" selected={filters.margin === 'healthy'} onClick={() => onFilterChange('margin', 'healthy')} />
            <FilterOption label="At Risk (< 20%)" selected={filters.margin === 'at_risk'} onClick={() => onFilterChange('margin', 'at_risk')} />
            <FilterOption label="No Cost Data" selected={filters.margin === 'unknown'} onClick={() => onFilterChange('margin', 'unknown')} />
          </FilterGroup>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-gray-50 p-6 flex gap-3">
          <button 
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100 active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset all
          </button>
          <button 
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-gray-800 active:scale-95"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
