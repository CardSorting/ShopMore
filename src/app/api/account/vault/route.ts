import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '../../../../core/OrderService';
import { getSQLiteDB } from '../../../../infrastructure/sqlite/database';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // In a real app we would initialize this from a container or DI
    // For now we instantiate the core service with its dependencies
    // (This is a bit simplified for the demo)
    const db = getSQLiteDB();
    const orderService = new OrderService(
      {} as any, // repository mocks or actuals as needed
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    // Overriding the method since we are using a simplified instantiation
    // In a real project, this would be properly injected
    
    const assets = await orderService.getDigitalAssets(userId);

    return NextResponse.json(assets);
  } catch (error: any) {
    console.error('Vault API error:', error);
    return NextResponse.json({ error: 'Failed to fetch vault assets' }, { status: 500 });
  }
}
