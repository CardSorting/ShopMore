/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Inventory Level Repository
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { IInventoryLevelRepository } from '@domain/repositories';
import type { InventoryLevel } from '@domain/models';

export class SQLiteInventoryLevelRepository implements IInventoryLevelRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapRowToLevel(row: any): InventoryLevel {
    return {
      productId: row.productId,
      locationId: row.locationId,
      availableQty: row.availableQty,
      reservedQty: row.reservedQty,
      incomingQty: row.incomingQty,
      reorderPoint: row.reorderPoint,
      reorderQty: row.reorderQty,
      updatedAt: new Date(row.updatedAt),
    };
  }

  async findByProduct(productId: string): Promise<InventoryLevel[]> {
    const rows = await this.db
      .selectFrom('inventory_levels')
      .selectAll()
      .where('productId', '=', productId)
      .execute();

    return rows.map((row) => this.mapRowToLevel(row));
  }

  async findByLocation(locationId: string): Promise<InventoryLevel[]> {
    const rows = await this.db
      .selectFrom('inventory_levels')
      .selectAll()
      .where('locationId', '=', locationId)
      .execute();

    return rows.map((row) => this.mapRowToLevel(row));
  }

  async findByProductAndLocation(productId: string, locationId: string): Promise<InventoryLevel | null> {
    const row = await this.db
      .selectFrom('inventory_levels')
      .selectAll()
      .where('productId', '=', productId)
      .where('locationId', '=', locationId)
      .executeTakeFirst();

    return row ? this.mapRowToLevel(row) : null;
  }

  async save(level: InventoryLevel): Promise<InventoryLevel> {
    const now = new Date().toISOString();
    const existing = await this.findByProductAndLocation(level.productId, level.locationId);

    if (!existing) {
      await this.db
        .insertInto('inventory_levels')
        .values({
          productId: level.productId,
          locationId: level.locationId,
          availableQty: level.availableQty,
          reservedQty: level.reservedQty,
          incomingQty: level.incomingQty,
          reorderPoint: level.reorderPoint,
          reorderQty: level.reorderQty,
          updatedAt: now,
        })
        .execute();
    } else {
      await this.db
        .updateTable('inventory_levels')
        .set({
          availableQty: level.availableQty,
          reservedQty: level.reservedQty,
          incomingQty: level.incomingQty,
          reorderPoint: level.reorderPoint,
          reorderQty: level.reorderQty,
          updatedAt: now,
        })
        .where('productId', '=', level.productId)
        .where('locationId', '=', level.locationId)
        .execute();
    }

    return { ...level, updatedAt: new Date(now) };
  }

  async adjustQuantity(
    productId: string,
    locationId: string,
    delta: number,
    reason: string
  ): Promise<InventoryLevel> {
    const now = new Date().toISOString();

    return await this.db.transaction().execute(async (trx) => {
      const row = await trx
        .selectFrom('inventory_levels')
        .selectAll()
        .where('productId', '=', productId)
        .where('locationId', '=', locationId)
        .executeTakeFirst();

      if (!row) {
        // Create a new level if it doesn't exist
        await trx
          .insertInto('inventory_levels')
          .values({
            productId,
            locationId,
            availableQty: Math.max(0, delta),
            reservedQty: 0,
            incomingQty: 0,
            reorderPoint: 0,
            reorderQty: 0,
            updatedAt: now,
          })
          .execute();

        return {
          productId,
          locationId,
          availableQty: Math.max(0, delta),
          reservedQty: 0,
          incomingQty: 0,
          reorderPoint: 0,
          reorderQty: 0,
          updatedAt: new Date(now),
        };
      }

      const nextAvailable = Math.max(0, row.availableQty + delta);

      await trx
        .updateTable('inventory_levels')
        .set({
          availableQty: nextAvailable,
          updatedAt: now,
        })
        .where('productId', '=', productId)
        .where('locationId', '=', locationId)
        .execute();

      // Also update the product's total stock for backward compatibility
      await trx
        .updateTable('products')
        .set((eb) => ({
          stock: eb.selectFrom('inventory_levels')
            .select((eb2) => eb2.fn.sum<number>('availableQty').as('total'))
            .where('productId', '=', productId),
          updatedAt: now,
        }))
        .where('id', '=', productId)
        .execute();

      return {
        productId,
        locationId,
        availableQty: nextAvailable,
        reservedQty: row.reservedQty,
        incomingQty: row.incomingQty,
        reorderPoint: row.reorderPoint,
        reorderQty: row.reorderQty,
        updatedAt: new Date(now),
      };
    });
  }

  async updateReorderPoint(
    productId: string,
    locationId: string,
    reorderPoint: number,
    reorderQty: number
  ): Promise<InventoryLevel> {
    const now = new Date().toISOString();

    await this.db
      .updateTable('inventory_levels')
      .set({ reorderPoint, reorderQty, updatedAt: now })
      .where('productId', '=', productId)
      .where('locationId', '=', locationId)
      .execute();

    const row = await this.db
      .selectFrom('inventory_levels')
      .selectAll()
      .where('productId', '=', productId)
      .where('locationId', '=', locationId)
      .executeTakeFirst();

    if (!row) throw new Error(`Inventory level not found for ${productId} at ${locationId}`);

    return this.mapRowToLevel(row);
  }
}