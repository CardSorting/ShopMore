import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const services = await getServerServices();
        return NextResponse.json(await services.productService.getProduct(id));
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Product not found' }, { status: 404 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const services = await getServerServices();
        return NextResponse.json(await services.productService.updateProduct(id, await request.json()));
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update product' }, { status: 400 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const services = await getServerServices();
    await services.productService.deleteProduct(id);
    return NextResponse.json({ ok: true });
}
