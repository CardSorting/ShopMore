import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const services = await getServerServices();
    const result = await services.productService.getProducts({
        category: searchParams.get('category') ?? undefined,
        limit: Number(searchParams.get('limit') ?? 20),
        cursor: searchParams.get('cursor') ?? undefined,
    });
    return NextResponse.json(result);
}

export async function POST(request: Request) {
    try {
        const services = await getServerServices();
        const product = await services.productService.createProduct(await request.json());
        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create product' }, { status: 400 });
    }
}
