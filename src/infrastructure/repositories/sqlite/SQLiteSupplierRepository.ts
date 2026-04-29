/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite implementation of ISupplierRepository
 */
import type { Kysely } from 'kysely';
import type { Database } from '@infrastructure/sqlite/schema';
import type { ISupplierRepository } from '@domain/repositories';
import type { Supplier } from '@domain/models';
import { getSQLiteDB } from '@infrastructure/sqlite/database';

export class SQLiteSupplierRepository implements ISupplierRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async getAll(options?: { query?: string; limit?: number; offset?: number }): Promise<Supplier[]> {
    let query = this.db.selectFrom('suppliers').selectAll();

    if (options?.query) {
      const q = `%${options.query}%`;
      query = query.where((eb) => eb.or([
        eb('name', 'like', q),
        eb('contactName', 'like', q),
        eb('email', 'like', q)
      ]));
    }

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.offset(options.offset);

    const rows = await query.orderBy('name', 'asc').execute();
    return rows.map(this.mapRowToSupplier);
  }

  async getById(id: string): Promise<Supplier | null> {
    const row = await this.db.selectFrom('suppliers')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    
    return row ? this.mapRowToSupplier(row) : null;
  }

  async save(supplier: Supplier): Promise<Supplier> {
    const id = supplier.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const row = {
      id,
      name: supplier.name,
      contactName: supplier.contactName ?? null,
      email: supplier.email ?? null,
      phone: supplier.phone ?? null,
      website: supplier.website ?? null,
      address: supplier.address ? JSON.stringify(supplier.address) : null,
      notes: supplier.notes ?? null,
      createdAt: supplier.createdAt?.toISOString() ?? now,
      updatedAt: now,
    };

    await this.db.insertInto('suppliers')
      .values(row)
      .onConflict((oc) => oc.column('id').doUpdateSet({
        ...row,
        createdAt: undefined // Don't overwrite createdAt
      }))
      .execute();

    return this.getById(id) as Promise<Supplier>;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('suppliers').where('id', '=', id).execute();
  }

  async count(options?: { query?: string }): Promise<number> {
    let query = this.db.selectFrom('suppliers').select((eb) => eb.fn.countAll().as('count'));
    
    if (options?.query) {
      const q = `%${options.query}%`;
      query = query.where((eb) => eb.or([
        eb('name', 'like', q),
        eb('contactName', 'like', q),
        eb('email', 'like', q)
      ]));
    }

    const res = await query.executeTakeFirst();
    return Number(res?.count ?? 0);
  }

  private mapRowToSupplier(row: any): Supplier {
    return {
      ...row,
      address: row.address ? JSON.parse(row.address) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
