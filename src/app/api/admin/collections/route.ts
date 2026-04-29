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
    
    const collections = await services.collectionService.list({
      status: (searchParams.get('status') as 'active' | 'archived') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    });
    
    return NextResponse.json(collections);
  } catch (error) {
    return jsonError(error, 'Failed to list collections');
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const services = await getServerServices();
    
    const collection = await services.collectionService.create(body, {
      id: session.id,
      email: session.email
    });
    
    return NextResponse.json(collection);
  } catch (error) {
    return jsonError(error, 'Failed to create collection');
  }
}
