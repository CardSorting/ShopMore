import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export type ImageFolder = 'products' | 'collections' | 'general';

export interface ProcessedImage {
  path: string;
  width: number;
  height: number;
  size: number;
}

export class ImageService {
  private static readonly STORAGE_BASE = join(process.cwd(), 'public', 'storage');
  private static readonly MAX_WIDTH = 1200;
  private static readonly QUALITY = 80;

  /**
   * Processes a raw image buffer, converts to WebP, resizes, and saves to local storage.
   */
  static async processAndSave(
    buffer: Buffer,
    folder: ImageFolder = 'products',
    filename?: string
  ): Promise<ProcessedImage> {
    const id = randomUUID();
    const name = filename 
      ? `${filename.split('.')[0]}-${id.slice(0, 8)}.webp` 
      : `${id}.webp`;
    
    const targetDir = join(this.STORAGE_BASE, folder);
    const targetPath = join(targetDir, name);
    const publicPath = `/storage/${folder}/${name}`;

    // Ensure directory exists
    await mkdir(targetDir, { recursive: true });

    // Process with Sharp
    const pipeline = sharp(buffer)
      .resize({
        width: this.MAX_WIDTH,
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: this.QUALITY })
      .rotate(); // Auto-rotate based on EXIF

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    // Save to disk
    await writeFile(targetPath, data);

    return {
      path: publicPath,
      width: info.width,
      height: info.height,
      size: info.size,
    };
  }

  /**
   * Deletes an image from storage
   */
  static async delete(publicPath: string): Promise<void> {
    if (!publicPath.startsWith('/storage/')) return;
    
    const localPath = join(process.cwd(), 'public', publicPath);
    try {
      const { unlink } = await import('node:fs/promises');
      await unlink(localPath);
    } catch (e) {
      console.error(`Failed to delete image at ${localPath}:`, e);
    }
  }
}
