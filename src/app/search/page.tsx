import { Suspense } from 'react';
import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';

export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Promise<Metadata> {
  const query = searchParams.q || '';
  return {
    title: query ? `Search: ${query} | PlayMoreTCG` : 'Search Catalog | PlayMoreTCG',
    description: `Search our extensive catalog of trading cards, sets, and supplies. Results for ${query || 'all products'}.`,
    alternates: {
      canonical: query ? `/search?q=${encodeURIComponent(query)}` : '/search',
    },
  };
}


export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://playmoretcg.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Search Results',
        item: `https://playmoretcg.com/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 text-sm font-bold text-gray-500">Searching catalog...</div>}>
        <ProductsPage />
      </Suspense>
    </>
  );
}

