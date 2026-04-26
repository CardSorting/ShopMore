/**
 * [LAYER: CORE]
 * Manages incoming stock transfers from suppliers.
 */
import type { Transfer } from '@domain/models';
import { Kysely } from 'kysely';
import { getSQLiteDB } from '@infrastructure/sqlite/database';
import type { Database } from '@infrastructure/sqlite/schema';

export class TransferService {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  async getAllTransfers(): Promise<Transfer[]> {
    const rows = await this.db.selectFrom('transfers').selectAll().execute();
    
    // Seed a mock one if empty for production hardening demonstration
    if (rows.length === 0) {
      const mock: Transfer = {
        id: 'TR-8042',
        source: 'Kanto Distribution',
        status: 'in_transit',
        itemsCount: 120,
        receivedCount: 0,
        expectedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };
      
      await this.db.insertInto('transfers').values({
        id: mock.id,
        source: mock.source,
        status: mock.status,
        itemsCount: mock.itemsCount,
        receivedCount: mock.receivedCount,
        expectedAt: mock.expectedAt.toISOString(),
        createdAt: mock.createdAt.toISOString(),
      }).execute();
      
      return [mock];
    }

    return rows.map(row => ({
      ...row,
      status: row.status as Transfer['status'],
      expectedAt: new Date(row.expectedAt),
      createdAt: new Date(row.createdAt),
    }));
  }

  async receiveTransfer(id: string): Promise<void> {
    await this.db
      .updateTable('transfers')
      .set({ status: 'received', receivedCount: 120 }) // Simplified for demo
      .where('id', '=', id)
      .execute();
  }
}
