/**
 * [LAYER: CORE]
 * Service for managing Collections
 */
import type { Collection } from '@domain/models';
import type { ICollectionRepository } from '@domain/repositories';
import { AuditService } from './AuditService';

export class CollectionService {
  constructor(
    private collectionRepo: ICollectionRepository,
    private auditService: AuditService
  ) {}

  async list(options?: { status?: 'active' | 'archived'; limit?: number }): Promise<Collection[]> {
    return await this.collectionRepo.getAll(options);
  }

  async get(id: string): Promise<Collection | null> {
    return await this.collectionRepo.getById(id);
  }

  async getByHandle(handle: string): Promise<Collection | null> {
    return await this.collectionRepo.getByHandle(handle);
  }

  async create(data: Partial<Collection>, actor: { id: string; email: string }): Promise<Collection> {
    if (!data.name) throw new Error('Collection name is required');
    
    const handle = data.handle || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const existing = await this.collectionRepo.getByHandle(handle);
    if (existing) throw new Error(`Collection with handle "${handle}" already exists`);

    const collection: Collection = {
      id: crypto.randomUUID(),
      name: data.name,
      handle,
      description: data.description,
      imageUrl: data.imageUrl,
      productCount: 0,
      status: data.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.collectionRepo.save(collection);
    
    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'collection.created',
      targetId: saved.id,
      details: { name: saved.name, handle: saved.handle }
    });

    return saved;
  }

  async update(id: string, updates: Partial<Collection>, actor: { id: string; email: string }): Promise<Collection> {
    const existing = await this.collectionRepo.getById(id);
    if (!existing) throw new Error('Collection not found');

    const updated: Collection = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date(),
    };

    const saved = await this.collectionRepo.save(updated);

    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'collection.updated',
      targetId: id,
      details: updates
    });

    return saved;
  }

  async delete(id: string, actor: { id: string; email: string }): Promise<void> {
    const existing = await this.collectionRepo.getById(id);
    if (!existing) throw new Error('Collection not found');

    await this.collectionRepo.delete(id);

    await this.auditService.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'collection.deleted',
      targetId: id,
      details: { name: existing.name }
    });
  }
}
