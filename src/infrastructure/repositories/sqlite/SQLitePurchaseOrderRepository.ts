/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Purchase Order Repository
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { IPurchaseOrderRepository } from '@domain/repositories';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  ReceivedItem,
  ReceivedItemCondition,
  ReceivingDiscrepancyReason,
  ReceivingLineDisposition,
  ReceivingSession,
  ReceivingSessionStatus,
} from '@domain/models';
import { PurchaseOrderNotFoundError } from '@domain/errors';

function parsePurchaseOrderStatus(value: string): PurchaseOrderStatus {
  const valid: PurchaseOrderStatus[] = ['draft', 'ordered', 'partially_received', 'received', 'closed', 'cancelled'];
  if (valid.includes(value as PurchaseOrderStatus)) return value as PurchaseOrderStatus;
  return 'draft';
}

function parseReceivingSessionStatus(value: string): ReceivingSessionStatus {
  const valid: ReceivingSessionStatus[] = ['in_progress', 'completed', 'cancelled'];
  if (valid.includes(value as ReceivingSessionStatus)) return value as ReceivingSessionStatus;
  return 'completed';
}

function parseReceivedItemCondition(value: string): ReceivedItemCondition {
  const valid: ReceivedItemCondition[] = ['new', 'damaged', 'defective'];
  if (valid.includes(value as ReceivedItemCondition)) return value as ReceivedItemCondition;
  return 'new';
}

export class SQLitePurchaseOrderRepository implements IPurchaseOrderRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  private mapRowToItem(row: any): PurchaseOrderItem {
    return {
      id: row.id,
      productId: row.productId,
      sku: row.sku,
      productName: row.productName,
      orderedQty: row.orderedQty,
      receivedQty: row.receivedQty,
      unitCost: row.unitCost,
      totalCost: row.totalCost,
      notes: row.notes || undefined,
    };
  }

  private async loadItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    const rows = await this.db
      .selectFrom('purchase_order_items')
      .selectAll()
      .where('purchaseOrderId', '=', purchaseOrderId)
      .execute();
    return rows.map((row) => this.mapRowToItem(row));
  }

  private mapRowToOrder(row: any, items: PurchaseOrderItem[]): PurchaseOrder {
    return {
      id: row.id,
      supplier: row.supplier,
      referenceNumber: row.referenceNumber || undefined,
      shippingCarrier: row.shippingCarrier || undefined,
      trackingNumber: row.trackingNumber || undefined,
      expectedAt: row.expectedAt ? new Date(row.expectedAt) : undefined,
      status: parsePurchaseOrderStatus(row.status),
      items,
      notes: row.notes || undefined,
      totalCost: row.totalCost,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private mapRowToReceivedItem(row: any): ReceivedItem {
    return {
      id: row.id,
      purchaseOrderItemId: row.purchaseOrderItemId,
      productId: row.productId,
      sku: row.sku,
      expectedQty: row.expectedQty,
      receivedQty: row.receivedQty,
      damagedQty: row.damagedQty ?? 0,
      unitCost: row.unitCost,
      condition: parseReceivedItemCondition(row.condition),
      discrepancyReason: row.discrepancyReason as ReceivingDiscrepancyReason | undefined,
      disposition: row.disposition as ReceivingLineDisposition | undefined,
      notes: row.notes || undefined,
    };
  }

  private async loadReceivedItems(receivingSessionId: string): Promise<ReceivedItem[]> {
    const rows = await this.db
      .selectFrom('receiving_items')
      .selectAll()
      .where('receivingSessionId', '=', receivingSessionId)
      .execute();
    return rows.map((row) => this.mapRowToReceivedItem(row));
  }

  private async mapRowToReceivingSession(row: any): Promise<ReceivingSession> {
    const receivedItems = await this.loadReceivedItems(row.id);
    return {
      id: row.id,
      purchaseOrderId: row.purchaseOrderId,
      status: parseReceivingSessionStatus(row.status),
      receivedItems,
      notes: row.notes || undefined,
      idempotencyKey: row.idempotencyKey || undefined,
      locationId: row.locationId || undefined,
      receivedAt: new Date(row.receivedAt),
      completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
      receivedBy: row.receivedBy,
    };
  }

  async save(order: PurchaseOrder): Promise<PurchaseOrder> {
    const now = new Date().toISOString();
    const isNew = !order.id;

    if (isNew) {
      const id = crypto.randomUUID();
      await this.db
        .insertInto('purchase_orders')
        .values({
          id,
          supplier: order.supplier,
          referenceNumber: order.referenceNumber || null,
          shippingCarrier: order.shippingCarrier || null,
          trackingNumber: order.trackingNumber || null,
          expectedAt: order.expectedAt ? order.expectedAt.toISOString() : null,
          status: order.status,
          notes: order.notes || null,
          totalCost: order.totalCost,
          createdAt: now,
          updatedAt: now,
        })
        .execute();

      for (const item of order.items) {
        await this.db
          .insertInto('purchase_order_items')
          .values({
            id: item.id || crypto.randomUUID(),
            purchaseOrderId: id,
            productId: item.productId,
            sku: item.sku,
            productName: item.productName,
            orderedQty: item.orderedQty,
            receivedQty: item.receivedQty,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            notes: item.notes || null,
          })
          .execute();
      }

      return { ...order, id, createdAt: new Date(now), updatedAt: new Date(now) };
    }

    // Update existing
    await this.db
      .updateTable('purchase_orders')
      .set({
        supplier: order.supplier,
        referenceNumber: order.referenceNumber || null,
        shippingCarrier: order.shippingCarrier || null,
        trackingNumber: order.trackingNumber || null,
        expectedAt: order.expectedAt ? order.expectedAt.toISOString() : null,
        status: order.status,
        notes: order.notes || null,
        totalCost: order.totalCost,
        updatedAt: now,
      })
      .where('id', '=', order.id)
      .execute();

    // Delete old items and re-insert
    await this.db
      .deleteFrom('purchase_order_items')
      .where('purchaseOrderId', '=', order.id)
      .execute();

    for (const item of order.items) {
      await this.db
        .insertInto('purchase_order_items')
        .values({
          id: item.id || crypto.randomUUID(),
          purchaseOrderId: order.id,
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          orderedQty: item.orderedQty,
          receivedQty: item.receivedQty,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          notes: item.notes || null,
        })
        .execute();
    }

    return { ...order, updatedAt: new Date(now) };
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const row = await this.db
      .selectFrom('purchase_orders')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!row) return null;

    const items = await this.loadItems(id);
    return this.mapRowToOrder(row, items);
  }

  async findAll(options?: {
    status?: PurchaseOrderStatus;
    supplier?: string;
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrder[]> {
    let query = this.db.selectFrom('purchase_orders').selectAll();

    if (options?.status) {
      query = query.where('status', '=', options.status);
    }
    if (options?.supplier) {
      query = query.where('supplier', 'like', `%${options.supplier}%`);
    }

    const rows = await query
      .orderBy('createdAt', 'desc')
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0)
      .execute();

    const results: PurchaseOrder[] = [];
    for (const row of rows) {
      const items = await this.loadItems(row.id);
      results.push(this.mapRowToOrder(row, items));
    }
    return results;
  }

  async count(options?: { status?: PurchaseOrderStatus }): Promise<number> {
    let query = this.db
      .selectFrom('purchase_orders')
      .select(({ fn }) => fn.count<number>('id').as('count'));

    if (options?.status) {
      query = query.where('status', '=', options.status);
    }

    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    const order = await this.findById(id);
    if (!order) throw new PurchaseOrderNotFoundError(id);

    const now = new Date().toISOString();
    await this.db
      .updateTable('purchase_orders')
      .set({ status, updatedAt: now })
      .where('id', '=', id)
      .execute();

    return { ...order, status, updatedAt: new Date(now) };
  }

  async saveReceivingSession(session: ReceivingSession): Promise<ReceivingSession> {
    await this.db
      .insertInto('receiving_sessions')
      .values({
        id: session.id,
        purchaseOrderId: session.purchaseOrderId,
        status: session.status,
        notes: session.notes || null,
        idempotencyKey: session.idempotencyKey || null,
        locationId: session.locationId || null,
        receivedAt: session.receivedAt.toISOString(),
        completedAt: session.completedAt ? session.completedAt.toISOString() : null,
        receivedBy: session.receivedBy,
      })
      .execute();

    for (const item of session.receivedItems) {
      await this.db
        .insertInto('receiving_items')
        .values({
          id: item.id,
          receivingSessionId: session.id,
          purchaseOrderItemId: item.purchaseOrderItemId,
          productId: item.productId,
          sku: item.sku,
          expectedQty: item.expectedQty,
          receivedQty: item.receivedQty,
          damagedQty: item.damagedQty ?? 0,
          unitCost: item.unitCost,
          condition: item.condition,
          discrepancyReason: item.discrepancyReason || null,
          disposition: item.disposition || null,
          notes: item.notes || null,
        })
        .execute();
    }

    return session;
  }

  async findReceivingSessions(purchaseOrderId: string): Promise<ReceivingSession[]> {
    const rows = await this.db
      .selectFrom('receiving_sessions')
      .selectAll()
      .where('purchaseOrderId', '=', purchaseOrderId)
      .orderBy('receivedAt', 'desc')
      .execute();
    return Promise.all(rows.map((row) => this.mapRowToReceivingSession(row)));
  }

  async findReceivingSessionByIdempotencyKey(
    purchaseOrderId: string,
    idempotencyKey: string
  ): Promise<ReceivingSession | null> {
    const row = await this.db
      .selectFrom('receiving_sessions')
      .selectAll()
      .where('purchaseOrderId', '=', purchaseOrderId)
      .where('idempotencyKey', '=', idempotencyKey)
      .executeTakeFirst();
    return row ? this.mapRowToReceivingSession(row) : null;
  }
}