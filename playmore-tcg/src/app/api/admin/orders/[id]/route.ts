import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import type { OrderStatus } from '@domain/models';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status } = await request.json() as { status: OrderStatus };
    const services = await getServerServices();
    await services.orderService.updateOrderStatus(id, status);
    return NextResponse.json({ ok: true });
}
