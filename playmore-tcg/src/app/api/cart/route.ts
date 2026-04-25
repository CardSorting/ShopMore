import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';

export async function GET(request: Request) {
    const userId = new URL(request.url).searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const services = await getServerServices();
    return NextResponse.json(await services.cartService.getCart(userId));
}

export async function DELETE(request: Request) {
    const { userId } = await request.json();
    const services = await getServerServices();
    await services.cartService.clearCart(userId);
    return NextResponse.json({ ok: true });
}
