/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Discount Repository
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { IDiscountRepository } from '@domain/repositories';

export class SQLiteDiscountRepository implements IDiscountRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async getAll(): Promise<any[]> {
    const rows = await this.db
      .selectFrom('discounts')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();

    return rows.map(this.mapRow);
  }

  async getById(id: string): Promise<any | null> {
    const row = await this.db
      .selectFrom('discounts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async getByCode(code: string): Promise<any | null> {
    const row = await this.db
      .selectFrom('discounts')
      .selectAll()
      .where('code', '=', code.toUpperCase())
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  async create(discount: any): Promise<any> {
    const row = {
      id: crypto.randomUUID(),
      code: discount.code.toUpperCase(),
      type: discount.type,
      value: discount.value,
      status: discount.status,
      startsAt: discount.startsAt.toISOString(),
      endsAt: discount.endsAt?.toISOString() || null,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    await this.db
      .insertInto('discounts')
      .values(row)
      .execute();

    return this.mapRow(row);
  }

  async update(id: string, updates: any): Promise<any> {
    const updatePayload: any = { ...updates };
    if (updates.startsAt) updatePayload.startsAt = updates.startsAt.toISOString();
    if (updates.endsAt) updatePayload.endsAt = updates.endsAt.toISOString();

    await this.db
      .updateTable('discounts')
      .set(updatePayload)
      .where('id', '=', id)
      .execute();

    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db
      .deleteFrom('discounts')
      .where('id', '=', id)
      .execute();
  }

  async incrementUsage(id: string): Promise<void> {
    await this.db
      .updateTable('discounts')
      .set((eb) => ({
        usageCount: eb('usageCount', '+', 1)
      }))
      .where('id', '=', id)
      .execute();
  }

  private mapRow(row: any) {
    return {
      ...row,
      startsAt: new Date(row.startsAt),
      endsAt: row.endsAt ? new Date(row.endsAt) : null,
      createdAt: new Date(row.createdAt),
    };
  }
}
