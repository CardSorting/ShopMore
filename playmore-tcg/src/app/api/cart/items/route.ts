import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';

export async function POST(request: Request) {
    const { userId, productId, quantity } = await request.json();
    const services = await getServerServices();
    return NextResponse.json(await services.cartService.addToCart(userId, productId, quantity));
}

export async function PATCH(request: Request) {
    const { userId, productId, quantity } = await request.json();
    const services = await getServerServices();
    return NextResponse.json(await services.cartService.updateQuantity(userId, productId, quantity));
}

export async function DELETE(request: Request) {
    const { userId, productId } = await request.json();
    const services = await getServerServices();
    return NextResponse.json(await services.cartService.removeFromCart(userId, productId));
}
