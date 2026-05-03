import { Suspense } from 'react';
import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Browse Trading Cards | DreamBeesArt',
    description: 'Explore our curated catalog of rare Pokemon, MTG, and Yu-Gi-Oh! cards. Secure checkout and fast shipping.',
};

export default function Page() {
    return (
        <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12 text-sm font-bold text-gray-500">Loading catalog...</div>}>
            <ProductsPage />
        </Suspense>
    );
}
