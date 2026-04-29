/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite implementation of IWishlistRepository
 */
import type { Kysely } from 'kysely';
import type { Database } from '@infrastructure/sqlite/schema';
import type { IWishlistRepository } from '@domain/repositories';
import type { Wishlist, Product } from '@domain/models';
import { getSQLiteDB } from '@infrastructure/sqlite/database';

export class SQLiteWishlistRepository implements IWishlistRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async getByUserId(userId: string): Promise<Wishlist[]> {
    const rows = await this.db.selectFrom('wishlists')
      .selectAll()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'asc')
      .execute();
    
    return rows.map(this.mapRowToWishlist);
  }

  async getById(id: string): Promise<Wishlist | null> {
    const row = await this.db.selectFrom('wishlists')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    
    return row ? this.mapRowToWishlist(row) : null;
  }

  async create(wishlist: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wishlist> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const row = {
      id,
      userId: wishlist.userId,
      name: wishlist.name,
      isDefault: wishlist.isDefault ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insertInto('wishlists')
      .values(row)
      .execute();

    return this.getById(id) as Promise<Wishlist>;
  }

  async update(id: string, name: string): Promise<Wishlist> {
    const now = new Date().toISOString();

    await this.db.updateTable('wishlists')
      .set({ name, updatedAt: now })
      .where('id', '=', id)
      .execute();

    return this.getById(id) as Promise<Wishlist>;
  }

  async delete(id: string): Promise<void> {
    // Delete items first
    await this.db.deleteFrom('wishlist_items').where('wishlistId', '=', id).execute();
    // Delete wishlist
    await this.db.deleteFrom('wishlists').where('id', '=', id).execute();
  }

  async addItem(wishlistId: string, productId: string): Promise<void> {
    // Check if already exists
    const existing = await this.db.selectFrom('wishlist_items')
      .selectAll()
      .where('wishlistId', '=', wishlistId)
      .where('productId', '=', productId)
      .executeTakeFirst();
    
    if (existing) return;

    await this.db.insertInto('wishlist_items')
      .values({
        id: crypto.randomUUID(),
        wishlistId,
        productId,
        createdAt: new Date().toISOString(),
      })
      .execute();
  }

  async removeItem(wishlistId: string, productId: string): Promise<void> {
    await this.db.deleteFrom('wishlist_items')
      .where('wishlistId', '=', wishlistId)
      .where('productId', '=', productId)
      .execute();
  }

  async getItems(wishlistId: string): Promise<Product[]> {
    const rows = await this.db.selectFrom('wishlist_items')
      .innerJoin('products', 'products.id', 'wishlist_items.productId')
      .select([
        'products.id',
        'products.name',
        'products.description',
        'products.price',
        'products.category',
        'products.imageUrl',
        'products.stock',
        'products.status',
        'products.createdAt',
        'products.updatedAt',
      ])
      .where('wishlist_items.wishlistId', '=', wishlistId)
      .execute();
    
    return rows.map((row: any) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async isProductInWishlist(userId: string, productId: string): Promise<boolean> {
    const result = await this.db.selectFrom('wishlist_items')
      .innerJoin('wishlists', 'wishlists.id', 'wishlist_items.wishlistId')
      .select('wishlist_items.id')
      .where('wishlists.userId', '=', userId)
      .where('wishlist_items.productId', '=', productId)
      .executeTakeFirst();
    
    return !!result;
  }

  private mapRowToWishlist(row: any): Wishlist {
    return {
      ...row,
      isDefault: !!row.isDefault,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
