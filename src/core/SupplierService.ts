/**
 * [LAYER: CORE]
 * Service for managing Suppliers (Wholesalers)
 */
import type { Supplier } from '@domain/models';
import type { ISupplierRepository } from '@domain/repositories';
import { AuditService } from './AuditService';

export class SupplierService {
  constructor(
    private supplierRepo: ISupplierRepository,
    private auditService: AuditService
  ) {}

  async list(options?: { query?: string; limit?: number; offset?: number }): Promise<Supplier[]> {
    return await this.supplierRepo.getAll(options);
  }

  async get(id: string): Promise<Supplier | null> {
    return await this.supplierRepo.getById(id);
  }

  async create(data: Partial<Supplier>, actor: { id: string; email: string }): Promise<Supplier> {
    if (!data.name) throw new Error('Supplier name is required');
    
    const supplier: Supplier = {
      id: crypto.randomUUID(),
      name: data.name,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.supplierRepo.save(supplier);
    
    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'supplier.created',
      targetId: saved.id,
      details: { name: saved.name }
    });

    return saved;
  }

  async update(id: string, updates: Partial<Supplier>, actor: { id: string; email: string }): Promise<Supplier> {
    const existing = await this.supplierRepo.getById(id);
    if (!existing) throw new Error('Supplier not found');

    const updated: Supplier = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date(),
    };

    const saved = await this.supplierRepo.save(updated);

    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'supplier.updated',
      targetId: id,
      details: updates
    });

    return saved;
  }

  async delete(id: string, actor: { id: string; email: string }): Promise<void> {
    const existing = await this.supplierRepo.getById(id);
    if (!existing) throw new Error('Supplier not found');

    await this.supplierRepo.delete(id);

    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'supplier.deleted',
      targetId: id,
      details: { name: existing.name }
    });
  }
}
