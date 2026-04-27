import { ProductsPage } from '@ui/pages/ProductsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Browse Trading Cards | PlayMoreTCG',
    description: 'Explore our curated catalog of rare Pokemon, MTG, and Yu-Gi-Oh! cards. Secure checkout and fast shipping.',
};

export default function Page() {
    return <ProductsPage />;
}
