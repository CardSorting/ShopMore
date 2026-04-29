import { NextResponse } from 'next/server';
import { DomainError } from '@domain/errors';
import { isProductSavedView } from '@core/ProductService';
import { getServerServices } from '@infrastructure/server/services';
import { jsonError, parseBoundedLimit, requireAdminSession } from '@infrastructure/server/apiGuards';

export async function GET(request: Request, { params }: { params: Promise<{ view: string }> }) {
  try {
    await requireAdminSession();
    const { view } = await params;
    if (!isProductSavedView(view)) {
      throw new DomainError('Product saved view is invalid.');
    }

    const { searchParams } = new URL(request.url);
    const services = await getServerServices();
    return NextResponse.json(await services.productService.getProductSavedView(view, {
      query: searchParams.get('query') ?? undefined,
      limit: parseBoundedLimit(searchParams.get('limit')),
      cursor: searchParams.get('cursor') ?? undefined,
    }));
  } catch (error) {
    return jsonError(error, 'Failed to load product saved view');
  }
}