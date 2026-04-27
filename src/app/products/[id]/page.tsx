import { ProductDetailPage } from '@ui/pages/ProductDetailPage';
import { getServerServices } from '@infrastructure/server/services';
import type { Metadata } from 'next';

type Props = {
    params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const services = await getServerServices();
        const product = await services.productService.getProduct(params.id);
        
        return {
            title: `${product.name} | PlayMoreTCG`,
            description: product.description.slice(0, 160),
            openGraph: {
                title: product.name,
                description: product.description,
                images: [product.imageUrl],
            },
        };
    } catch {
        return {
            title: 'Product Not Found | PlayMoreTCG',
        };
    }
}

export default function Page() {
    return <ProductDetailPage />;
}
