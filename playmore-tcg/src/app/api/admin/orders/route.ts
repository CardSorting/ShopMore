import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import type { OrderStatus } from '@domain/models';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const services = await getServerServices();
    return NextResponse.json(await services.orderService.getAllOrders({
        status: (searchParams.get('status') || undefined) as OrderStatus | undefined,
        limit: Number(searchParams.get('limit') ?? 20),
        cursor: searchParams.get('cursor') ?? undefined,
    }));
}
