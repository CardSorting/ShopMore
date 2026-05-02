import { getSQLiteDB } from '../sqlite/database';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from '@domain/models';

function mapTicket(row: any): SupportTicket {
  return {
    id: row.id,
    userId: row.userId,
    customerEmail: row.customerEmail,
    customerName: row.customerName || undefined,
    assigneeId: row.assigneeId || undefined,
    assigneeName: row.assigneeName || undefined,
    orderId: row.orderId || undefined,
    productId: row.productId || undefined,
    subject: row.subject,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    type: row.type || undefined,
    tags: row.tags ? JSON.parse(row.tags) : [],
    slaDeadline: row.slaDeadline ? new Date(row.slaDeadline) : undefined,
    messages: [],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapMessage(row: any): TicketMessage {
  return {
    id: row.id,
    ticketId: row.ticketId,
    senderId: row.senderId,
    senderType: row.senderType as 'customer' | 'agent' | 'system',
    visibility: (row.visibility || 'public') as 'public' | 'internal',
    content: row.content,
    createdAt: new Date(row.createdAt),
  };
}

export const ticketRepository = {
  async getTickets(options?: { status?: string; userId?: string; assigneeId?: string; limit?: number }) {
    const db = getSQLiteDB();
    let query = db.selectFrom('support_tickets').selectAll();
    
    if (options?.status && options.status !== 'all') {
      query = query.where('status', '=', options.status);
    }

    if (options?.userId) {
      query = query.where('userId', '=', options.userId);
    }

    if (options?.assigneeId) {
      query = query.where('assigneeId', '=', options.assigneeId);
    }
    
    query = query.orderBy('createdAt', 'desc');
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const rows = await query.execute();
    return rows.map(mapTicket);
  },

  async getTicketById(id: string) {
    const db = getSQLiteDB();
    const row = await db.selectFrom('support_tickets').selectAll().where('id', '=', id).executeTakeFirst();
    if (!row) return null;

    const messagesRow = await db.selectFrom('ticket_messages').selectAll().where('ticketId', '=', id).orderBy('createdAt', 'asc').execute();
    
    const ticket = mapTicket(row);
    ticket.messages = messagesRow.map(mapMessage);
    return ticket;
  },

  async getTicketForCustomer(id: string, userId: string) {
    const ticket = await this.getTicketById(id);
    if (!ticket || ticket.userId !== userId) return null;
    
    // Security: Filter out internal messages from customer view
    ticket.messages = ticket.messages.filter(m => m.visibility === 'public');
    return ticket;
  },

  async createTicket(ticket: SupportTicket) {
    const db = getSQLiteDB();
    await db.insertInto('support_tickets').values({
      id: ticket.id,
      userId: ticket.userId,
      customerEmail: ticket.customerEmail,
      customerName: ticket.customerName || null,
      assigneeId: ticket.assigneeId || null,
      assigneeName: ticket.assigneeName || null,
      orderId: ticket.orderId || null,
      productId: ticket.productId || null,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      type: ticket.type || null,
      tags: ticket.tags ? JSON.stringify(ticket.tags) : null,
      slaDeadline: ticket.slaDeadline?.toISOString() || null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    }).execute();

    if (ticket.messages && ticket.messages.length > 0) {
      const messagesToInsert = ticket.messages.map(m => ({
        id: m.id,
        ticketId: ticket.id,
        senderId: m.senderId,
        senderType: m.senderType,
        visibility: m.visibility || 'public',
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));
      await db.insertInto('ticket_messages').values(messagesToInsert).execute();
    }
  },

  async updateTicketProperties(id: string, updates: Partial<SupportTicket>) {
    const db = getSQLiteDB();
    const values: any = { 
      updatedAt: new Date().toISOString() 
    };
    
    if (updates.status) values.status = updates.status;
    if (updates.priority) values.priority = updates.priority;
    if (updates.type) values.type = updates.type;
    if (updates.assigneeId) values.assigneeId = updates.assigneeId;
    if (updates.assigneeName) values.assigneeName = updates.assigneeName;
    if (updates.tags) values.tags = JSON.stringify(updates.tags);
    if (updates.slaDeadline) values.slaDeadline = updates.slaDeadline.toISOString();

    await db.updateTable('support_tickets')
      .set(values)
      .where('id', '=', id)
      .execute();

    // PRODUCTION HARDENING: Automatic System Audit Log
    const auditEntries = Object.entries(updates)
      .filter(([key]) => key !== 'updatedAt')
      .map(([key, val]) => `Ticket ${key} changed to "${val}"`);
    
    if (auditEntries.length > 0) {
      await this.addMessage({
        id: crypto.randomUUID(),
        ticketId: id,
        senderId: 'system',
        senderType: 'system',
        visibility: 'internal',
        content: `Audit: ${auditEntries.join(', ')}`,
        createdAt: new Date()
      });
    }
  },

  async updateTicketStatus(id: string, status: string) {
    return this.updateTicketProperties(id, { status: status as any });
  },

  async updateTicketPriority(id: string, priority: string) {
    return this.updateTicketProperties(id, { priority: priority as any });
  },

  async addMessage(message: TicketMessage) {
    const db = getSQLiteDB();
    await db.insertInto('ticket_messages').values({
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      senderType: message.senderType,
      visibility: message.visibility || 'public',
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }).execute();

    await db.updateTable('support_tickets')
      .set({ updatedAt: new Date().toISOString() })
      .where('id', '=', message.ticketId)
      .execute();
  },

  async batchUpdateTickets(ids: string[], updates: Partial<SupportTicket>) {
    const db = getSQLiteDB();
    const values: any = { 
      updatedAt: new Date().toISOString() 
    };
    
    if (updates.status) values.status = updates.status;
    if (updates.priority) values.priority = updates.priority;
    if (updates.assigneeId) values.assigneeId = updates.assigneeId;
    if (updates.assigneeName) values.assigneeName = updates.assigneeName;
    if (updates.type) values.type = updates.type;

    await db.updateTable('support_tickets')
      .set(values)
      .where('id', 'in', ids)
      .execute();

    // PRODUCTION HARDENING: Batch Audit Logging
    const auditContent = `Bulk update performed on ${ids.length} tickets: ${Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ')}`;
    for (const ticketId of ids) {
      await this.addMessage({
        id: crypto.randomUUID(),
        ticketId,
        senderId: 'system',
        senderType: 'system',
        visibility: 'internal',
        content: auditContent,
        createdAt: new Date()
      });
    }
  },

  async getTicketHealthMetrics() {
    const db = getSQLiteDB();
    const tickets = await db.selectFrom('support_tickets').selectAll().execute();
    const total = tickets.length;
    if (total === 0) return { slaCompliance: 100, unassignedRate: 0, totalActive: 0 };

    const unresolved = tickets.filter(t => t.status !== 'solved' && t.status !== 'closed');
    const unassigned = unresolved.filter(t => !t.assigneeId);
    
    const breached = unresolved.filter(t => {
      const deadline = t.slaDeadline ? new Date(t.slaDeadline) : new Date(new Date(t.createdAt).getTime() + (24 * 60 * 60 * 1000));
      return deadline.getTime() < Date.now();
    });

    return {
      slaCompliance: Math.round(((unresolved.length - breached.length) / (unresolved.length || 1)) * 100),
      unassignedRate: Math.round((unassigned.length / (unresolved.length || 1)) * 100),
      totalActive: unresolved.length
    };
  },

  async getCustomerSupportSummary(userId: string) {
    const db = getSQLiteDB();
    const [tickets, orders] = await Promise.all([
      db.selectFrom('support_tickets').selectAll().where('userId', '=', userId).execute(),
      db.selectFrom('orders').selectAll().where('userId', '=', userId).execute()
    ]);

    const totalSpend = orders.reduce((sum, o) => sum + o.total, 0);
    const resolvedCount = tickets.filter(t => t.status === 'solved' || t.status === 'closed').length;

    return {
      totalTickets: tickets.length,
      resolvedCount,
      totalSpend: totalSpend / 100, // cents to dollars
      recentOrders: orders.slice(0, 3).map(o => ({
        id: o.id,
        total: o.total / 100,
        status: o.status,
        createdAt: new Date(o.createdAt)
      }))
    };
  },

  async getMacros() {
    const db = getSQLiteDB();
    const rows = await db.selectFrom('support_macros').selectAll().execute();
    return rows;
  },

  async addMacro(macro: { name: string; content: string; category: string; slug?: string }) {
    const db = getSQLiteDB();
    await db.insertInto('support_macros').values({
      id: crypto.randomUUID(),
      ...macro
    }).execute();
  },

  async updateMacro(id: string, updates: Partial<{ name: string; content: string; category: string; slug: string }>) {
    const db = getSQLiteDB();
    await db.updateTable('support_macros')
      .set(updates)
      .where('id', '=', id)
      .execute();
  },

  async deleteMacro(id: string) {
    const db = getSQLiteDB();
    await db.deleteFrom('support_macros')
      .where('id', '=', id)
      .execute();
  },

  async markHeartbeat(ticketId: string, userId: string, userName: string) {
    const db = getSQLiteDB();
    const id = `ticket_view_${ticketId}`;
    const expiresAt = new Date(Date.now() + 15000).toISOString(); // 15s TTL
    
    // Upsert claim
    await db.insertInto('hive_claims')
      .values({
        id,
        owner: `${userId}:${userName}`,
        expiresAt,
        createdAt: new Date().toISOString()
      })
      .onConflict(oc => oc.column('id').doUpdateSet({
        owner: `${userId}:${userName}`,
        expiresAt
      }))
      .execute();
  },

  async getActiveViewers(ticketId: string, currentUserId: string) {
    const db = getSQLiteDB();
    const id = `ticket_view_${ticketId}`;
    const now = new Date().toISOString();
    
    const claim = await db.selectFrom('hive_claims')
      .selectAll()
      .where('id', '=', id)
      .where('expiresAt', '>', now)
      .executeTakeFirst();
      
    if (!claim) return [];
    const [ownerId, ownerName] = claim.owner.split(':');
    if (ownerId === currentUserId) return [];
    return [{ id: ownerId, name: ownerName }];
  }
};
