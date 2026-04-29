import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, readJsonObject, requireSessionUser, requireString } from '@infrastructure/server/apiGuards';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireSessionUser();
        const body = await readJsonObject(request);
        const productId = requireString(body.productId, 'productId');
        
        const services = await getServerServices();
        await services.wishlistService.addItem(user.id, params.id, productId);
        return new Response(null, { status: 201 });
    } catch (error) {
        return jsonError(error, 'Failed to add item to wishlist');
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await requireSessionUser();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        
        if (!productId) {
            return NextResponse.json({ error: 'productId is required' }, { status: 400 });
        }
        
        const services = await getServerServices();
        await services.wishlistService.removeItem(user.id, params.id, productId);
        return new Response(null, { status: 204 });
    } catch (error) {
        return jsonError(error, 'Failed to remove item from wishlist');
    }
}
