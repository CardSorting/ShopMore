import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
    try {
        await requireAdminSession();
        const services = await getServerServices();
        return NextResponse.json(await services.productService.getInventoryOverview());
    } catch (error) {
        return jsonError(error, 'Failed to load inventory overview');
    }
}