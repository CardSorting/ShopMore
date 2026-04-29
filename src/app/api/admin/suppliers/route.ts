/**
 * [LAYER: INFRASTRUCTURE]
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const services = await getServerServices();
    
    const suppliers = await services.supplierService.list({
      query: searchParams.get('query') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    });
    
    return NextResponse.json(suppliers);
  } catch (error) {
    return jsonError(error, 'Failed to list suppliers');
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const services = await getServerServices();
    
    const supplier = await services.supplierService.create(body, {
      id: session.id,
      email: session.email
    });
    
    return NextResponse.json(supplier);
  } catch (error) {
    return jsonError(error, 'Failed to create supplier');
  }
}
