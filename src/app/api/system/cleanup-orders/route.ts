import { NextResponse } from 'next/server';
import { getServerServices } from '@infrastructure/server/services';
import { logger } from '@utils/logger';

/**
 * [LAYER: SYSTEM]
 * Background Job for Cleaning up Expired Pending Orders
 * This prevents inventory leakage from abandoned checkouts.
 */
export async function POST(request: Request) {
  // Simple internal secret check or just rely on platform-level security
  const authHeader = request.headers.get('Authorization');
  if (process.env.SYSTEM_JOB_TOKEN && authHeader !== `Bearer ${process.env.SYSTEM_JOB_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const services = await getServerServices();
    // Default expiration is 60 minutes
    const count = await services.orderService.cleanupExpiredOrders(60);
    
    logger.info(`System cleanup: Processed ${count} expired orders.`);
    
    return NextResponse.json({ 
      success: true, 
      processed: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('System cleanup failed', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
