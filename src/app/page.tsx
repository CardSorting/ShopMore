import { HomePage } from '@ui/pages/HomePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'PlayMoreTCG | The World\'s Favorite TCG Marketplace',
    description: 'Shop, sell, and trade the world\'s rarest Trading Card Games. Authentic cards, fast shipping, and a community of passionate collectors.',
    openGraph: {
        title: 'PlayMoreTCG | The World\'s Favorite TCG Marketplace',
        description: 'Shop, sell, and trade the world\'s rarest Trading Card Games.',
        type: 'website',
        url: 'https://playmoretcg.com',
    },
    alternates: {
        canonical: '/',
    },
};

export default function Page() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'PlayMoreTCG',
        url: 'https://playmoretcg.com',
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://playmoretcg.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
        },
    };

    const organizationLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'PlayMoreTCG',
        url: 'https://playmoretcg.com',
        logo: 'https://playmoretcg.com/logo.png',
        sameAs: [
            'https://twitter.com/playmoretcg',
            'https://instagram.com/playmoretcg',
            'https://discord.gg/playmoretcg',
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
            />
            <HomePage />
        </>
    );
}
