import { NextRequest, NextResponse } from 'next/server';
import { ImageService, ImageFolder } from '../../../../infrastructure/services/ImageService';

export const runtime = 'nodejs'; // Required for Sharp

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as ImageFolder) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Limit size to 10MB (Sharp can handle it, but for lean we want to avoid massive uploads)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await ImageService.processAndSave(
      buffer,
      folder,
      file.name
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process image', details: error.message },
      { status: 500 }
    );
  }
}
