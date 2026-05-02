import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '../../../../infrastructure/services/StorageService';
import { getSQLiteDB } from '../../../../infrastructure/sqlite/database';
import { sql } from 'kysely';

// Helper to verify if a user has purchased a specific asset
async function verifyAssetOwnership(userId: string, assetId: string): Promise<string | null> {
  const db = getSQLiteDB();
  
  // We scan orders for the user and look into the JSON items for the matching assetId
  // Using native SQLite JSON functions for high performance
  const result = await sql<any>`
    SELECT json_extract(asset.value, '$.path') as path
    FROM orders, 
         json_each(orders.items) as item, 
         json_each(json_extract(item.value, '$.digitalAssets')) as asset
    WHERE orders.userId = ${userId} 
      AND json_extract(asset.value, '$.id') = ${assetId}
      AND orders.status != 'cancelled'
    LIMIT 1
  `.execute(db);

  return result.rows.length > 0 ? String(result.rows[0].path) : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;
    
    // In a real app, we'd get the userId from a secure session/cookie
    // For this simulation, we'll try to find a userId from headers or query (not secure for production!)
    // But since we want to demonstrate the "deep" logic:
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const assetPath = await verifyAssetOwnership(userId, assetId);
    
    if (!assetPath) {
      return NextResponse.json({ error: 'Access denied or asset not found' }, { status: 403 });
    }

    // Log the access for customer oversight and security auditing
    const db = getSQLiteDB();
    try {
      await db.insertInto('digital_access_logs' as any).values({
        id: crypto.randomUUID(),
        userId,
        assetId,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'unknown',
        createdAt: new Date().toISOString()
      }).execute();
    } catch (logErr) {
      console.error('Failed to log digital access:', logErr);
      // We still serve the file even if logging fails (fail-open for UX, but log error)
    }

    const { buffer, mimeType, name } = await StorageService.readFile(assetPath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to process download', details: error.message },
      { status: 500 }
    );
  }
}
