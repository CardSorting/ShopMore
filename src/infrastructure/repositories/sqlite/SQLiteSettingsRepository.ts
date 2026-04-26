/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Settings Repository using Kysely
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { ISettingsRepository } from '@domain/repositories';

export class SQLiteSettingsRepository implements ISettingsRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async get<T>(key: string): Promise<T | null> {
    const row = await this.db
      .selectFrom('settings')
      .select('value')
      .where('key', '=', key)
      .executeTakeFirst();

    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const jsonValue = JSON.stringify(value);
    const now = new Date().toISOString();

    await this.db
      .insertInto('settings')
      .values({
        key,
        value: jsonValue,
        updatedAt: now,
      })
      .onConflict((oc) => oc.column('key').doUpdateSet({
        value: jsonValue,
        updatedAt: now,
      }))
      .execute();
  }

  async getAll(): Promise<Record<string, any>> {
    const rows = await this.db.selectFrom('settings').selectAll().execute();
    const result: Record<string, any> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = null;
      }
    }
    return result;
  }
}
