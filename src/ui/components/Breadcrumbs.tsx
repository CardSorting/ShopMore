'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide" aria-label="Breadcrumb">
      <Link 
        href="/" 
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        Home
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 shrink-0">
          <ChevronRight className="w-3.5 h-3.5 text-gray-200" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
