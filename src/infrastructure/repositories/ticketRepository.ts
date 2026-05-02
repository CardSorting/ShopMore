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
  }
};
