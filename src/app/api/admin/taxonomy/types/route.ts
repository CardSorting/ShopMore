/**
 * [LAYER: INFRASTRUCTURE]
 * API Route: /api/admin/taxonomy/types
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
  try {
    await requireAdminSession();
    const services = await getServerServices();
    const types = await services.taxonomyService.getAllTypes();
    return NextResponse.json(types);
  } catch (error) {
    return jsonError(error, 'Failed to list product types');
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const services = await getServerServices();
    
    const type = await services.taxonomyService.saveType(body, {
      id: session.id,
      email: session.email
    });
    
    return NextResponse.json(type);
  } catch (error) {
    return jsonError(error, 'Failed to save product type');
  }
}
