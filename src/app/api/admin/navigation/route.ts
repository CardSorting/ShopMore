/**
 * [LAYER: INFRASTRUCTURE]
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@infrastructure/server/apiGuards';
import { services } from '@infrastructure/server/services';
import type { NavigationMenu } from '@domain/models';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('id') || 'main-nav';

    const menu = await services.settingsService.getNavigationMenu(menuId);
    
    // Return empty state if not found so admin can create it
    if (!menu) {
      return NextResponse.json({
        id: menuId,
        shopCategories: { title: 'Categories', links: [] },
        shopCollections: { title: 'Collections', links: [] },
        otherLinks: []
      });
    }

    return NextResponse.json(menu);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to get navigation menu:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('id') || 'main-nav';

    const menuData: NavigationMenu = await request.json();

    await services.settingsService.updateNavigationMenu(menuId, menuData, {
      id: admin.id,
      email: admin.email
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to update navigation menu:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}