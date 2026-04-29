/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite implementation of ICollectionRepository
 */
import type { Kysely } from 'kysely';
import type { Database } from '@infrastructure/sqlite/schema';
import type { ICollectionRepository } from '@domain/repositories';
import type { Collection } from '@domain/models';
import { getSQLiteDB } from '@infrastructure/sqlite/database';

export class SQLiteCollectionRepository implements ICollectionRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async getAll(options?: { status?: 'active' | 'archived'; limit?: number }): Promise<Collection[]> {
    let query = this.db.selectFrom('collections').selectAll();

    if (options?.status) {
      query = query.where('status', '=', options.status);
    }

    if (options?.limit) query = query.limit(options.limit);

    const rows = await query.orderBy('name', 'asc').execute();
    return rows.map(this.mapRowToCollection);
  }

  async getById(id: string): Promise<Collection | null> {
    const row = await this.db.selectFrom('collections')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    
    return row ? this.mapRowToCollection(row) : null;
  }

  async getByHandle(handle: string): Promise<Collection | null> {
    const row = await this.db.selectFrom('collections')
      .selectAll()
      .where('handle', '=', handle)
      .executeTakeFirst();
    
    return row ? this.mapRowToCollection(row) : null;
  }

  async save(collection: Collection): Promise<Collection> {
    const id = collection.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const row = {
      id,
      name: collection.name,
      handle: collection.handle,
      description: collection.description ?? null,
      imageUrl: collection.imageUrl ?? null,
      productCount: collection.productCount ?? 0,
      status: collection.status ?? 'active',
      createdAt: collection.createdAt?.toISOString() ?? now,
      updatedAt: now,
    };

    await this.db.insertInto('collections')
      .values(row)
      .onConflict((oc) => oc.column('id').doUpdateSet({
        ...row,
        createdAt: undefined
      }))
      .execute();

    return this.getById(id) as Promise<Collection>;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('collections').where('id', '=', id).execute();
  }

  async updateProductCount(id: string, delta: number): Promise<void> {
    await this.db.updateTable('collections')
      .set((eb) => ({
        productCount: eb('productCount', '+', delta)
      }))
      .where('id', '=', id)
      .execute();
  }

  private mapRowToCollection(row: any): Collection {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
