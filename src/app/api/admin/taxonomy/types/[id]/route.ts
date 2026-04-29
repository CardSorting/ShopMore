/**
 * [LAYER: INFRASTRUCTURE]
 * API Route: /api/admin/taxonomy/types/[id]
 */
import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdminSession();
    const services = await getServerServices();
    
    await services.taxonomyService.deleteType(params.id, {
      id: session.id,
      email: session.email
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error, 'Failed to delete product type');
  }
}
