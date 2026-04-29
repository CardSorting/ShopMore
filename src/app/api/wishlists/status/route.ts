import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireSessionUser } from '@infrastructure/server/apiGuards';

export async function GET(request: Request) {
    try {
        const user = await requireSessionUser();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        
        if (!productId) {
            return NextResponse.json({ error: 'productId is required' }, { status: 400 });
        }
        
        const services = await getServerServices();
        const isInWishlist = await services.wishlistService.isProductInWishlist(user.id, productId);
        return NextResponse.json({ isInWishlist });
    } catch (error) {
        return jsonError(error, 'Failed to check wishlist status');
    }
}
