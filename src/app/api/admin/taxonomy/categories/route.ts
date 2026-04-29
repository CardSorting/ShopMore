/**
 * [LAYER: INFRASTRUCTURE]
 * API Route: /api/admin/taxonomy/categories
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET() {
  try {
    await requireAdminSession();
    const services = await getServerServices();
    const categories = await services.taxonomyService.getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return jsonError(error, 'Failed to list categories');
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const services = await getServerServices();
    
    const category = await services.taxonomyService.saveCategory(body, {
      id: session.id,
      email: session.email
    });
    
    return NextResponse.json(category);
  } catch (error) {
    return jsonError(error, 'Failed to save category');
  }
}
