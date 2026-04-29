/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Inventory Location Repository
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { IInventoryLocationRepository } from '@domain/repositories';
import type { InventoryLocation, InventoryLocationType } from '@domain/models';
import { InventoryLocationNotFoundError } from '@domain/errors';

function parseLocationType(value: string): InventoryLocationType {
  const valid: InventoryLocationType[] = ['warehouse', 'retail', 'virtual'];
  return valid.includes(value as InventoryLocationType) ? (value as InventoryLocationType) : 'warehouse';
}

export class SQLiteInventoryLocationRepository implements IInventoryLocationRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapRowToLocation(row: any): InventoryLocation {
    return {
      id: row.id,
      name: row.name,
      type: parseLocationType(row.type),
      address: row.address || undefined,
      isDefault: row.isDefault === 1,
      isActive: row.isActive === 1,
      createdAt: new Date(row.createdAt),
    };
  }

  async save(location: InventoryLocation): Promise<InventoryLocation> {
    const now = new Date().toISOString();
    const isNew = !location.id;

    if (isNew) {
      const id = crypto.randomUUID();
      await this.db
        .insertInto('inventory_locations')
        .values({
          id,
          name: location.name,
          type: location.type,
          address: location.address || null,
          isDefault: location.isDefault ? 1 : 0,
          isActive: location.isActive ? 1 : 1,
          createdAt: now,
        })
        .execute();

      // If this is set as default, clear other defaults
      if (location.isDefault) {
        await this.db
          .updateTable('inventory_locations')
          .set({ isDefault: 0 })
          .where('id', '!=', id)
          .execute();
      }

      return { ...location, id, createdAt: new Date(now) };
    }

    await this.db
      .updateTable('inventory_locations')
      .set({
        name: location.name,
        type: location.type,
        address: location.address || null,
        isDefault: location.isDefault ? 1 : 0,
        isActive: location.isActive ? 1 : 0,
      })
      .where('id', '=', location.id)
      .execute();

    if (location.isDefault) {
      await this.db
        .updateTable('inventory_locations')
        .set({ isDefault: 0 })
        .where('id', '!=', location.id)
        .execute();
    }

    return location;
  }

  async findById(id: string): Promise<InventoryLocation | null> {
    const row = await this.db
      .selectFrom('inventory_locations')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.mapRowToLocation(row) : null;
  }

  async findAll(): Promise<InventoryLocation[]> {
    const rows = await this.db
      .selectFrom('inventory_locations')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .execute();

    return rows.map((row) => this.mapRowToLocation(row));
  }

  async findDefault(): Promise<InventoryLocation | null> {
    const row = await this.db
      .selectFrom('inventory_locations')
      .selectAll()
      .where('isDefault', '=', 1)
      .where('isActive', '=', 1)
      .executeTakeFirst();

    return row ? this.mapRowToLocation(row) : null;
  }

  async findActive(): Promise<InventoryLocation[]> {
    const rows = await this.db
      .selectFrom('inventory_locations')
      .selectAll()
      .where('isActive', '=', 1)
      .orderBy('name', 'asc')
      .execute();

    return rows.map((row) => this.mapRowToLocation(row));
  }

  async update(id: string, location: Partial<InventoryLocation>): Promise<InventoryLocation> {
    const existing = await this.findById(id);
    if (!existing) throw new InventoryLocationNotFoundError(id);

    const updates: Record<string, unknown> = {};
    if (location.name !== undefined) updates.name = location.name;
    if (location.type !== undefined) updates.type = location.type;
    if (location.address !== undefined) updates.address = location.address || null;
    if (location.isDefault !== undefined) updates.isDefault = location.isDefault ? 1 : 0;
    if (location.isActive !== undefined) updates.isActive = location.isActive ? 1 : 0;

    await this.db
      .updateTable('inventory_locations')
      .set(updates)
      .where('id', '=', id)
      .execute();

    if (location.isDefault) {
      await this.db
        .updateTable('inventory_locations')
        .set({ isDefault: 0 })
        .where('id', '!=', id)
        .execute();
    }

    return { ...existing, ...location };
  }
}