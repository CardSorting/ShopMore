import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';

export async function GET(request: Request) {
    const userId = new URL(request.url).searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const services = await getServerServices();
    return NextResponse.json(await services.orderService.getOrders(userId));
}

export async function POST(request: Request) {
    try {
        const { userId, shippingAddress, paymentMethodId } = await request.json();
        const services = await getServerServices();
        const order = await services.orderService.placeOrder(userId, shippingAddress, paymentMethodId || 'manual');
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to place order' }, { status: 400 });
    }
}
