/**
 * [LAYER: INFRASTRUCTURE]
 * SQLite Implementation of Taxonomy Repository (Categories & Types)
 */
import { Kysely } from 'kysely';
import { getSQLiteDB } from '../../sqlite/database';
import type { Database } from '../../sqlite/schema';
import type { ITaxonomyRepository } from '@domain/repositories';
import type { ProductCategory, ProductType } from '@domain/models';

export class SQLiteTaxonomyRepository implements ITaxonomyRepository {
  private db: Kysely<Database>;

  constructor() {
    this.db = getSQLiteDB();
  }

  // ─────────────────────────────────────────────
  // Categories
  // ─────────────────────────────────────────────

  async getAllCategories(): Promise<ProductCategory[]> {
    const results = await this.db
      .selectFrom('product_categories')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return results.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async getCategoryById(id: string): Promise<ProductCategory | null> {
    const result = await this.db
      .selectFrom('product_categories')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) return null;
    return {
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  }

  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    const result = await this.db
      .selectFrom('product_categories')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (!result) return null;
    return {
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  }

  async saveCategory(category: ProductCategory): Promise<ProductCategory> {
    const now = new Date().toISOString();
    const existing = await this.getCategoryById(category.id);

    if (existing) {
      await this.db
        .updateTable('product_categories')
        .set({
          name: category.name,
          slug: category.slug,
          description: category.description ?? null,
          updatedAt: now,
        })
        .where('id', '=', category.id)
        .execute();
    } else {
      await this.db
        .insertInto('product_categories')
        .values({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }

    return (await this.getCategoryById(category.id))!;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.db.deleteFrom('product_categories').where('id', '=', id).execute();
  }

  // ─────────────────────────────────────────────
  // Types
  // ─────────────────────────────────────────────

  async getAllTypes(): Promise<ProductType[]> {
    const results = await this.db
      .selectFrom('product_types')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();

    return results.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async getTypeById(id: string): Promise<ProductType | null> {
    const result = await this.db
      .selectFrom('product_types')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) return null;
    return {
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
    };
  }

  async saveType(type: ProductType): Promise<ProductType> {
    const now = new Date().toISOString();
    const existing = await this.getTypeById(type.id);

    if (existing) {
      await this.db
        .updateTable('product_types')
        .set({
          name: type.name,
          updatedAt: now,
        })
        .where('id', '=', type.id)
        .execute();
    } else {
      await this.db
        .insertInto('product_types')
        .values({
          id: type.id,
          name: type.name,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }

    return (await this.getTypeById(type.id))!;
  }

  async deleteType(id: string): Promise<void> {
    await this.db.deleteFrom('product_types').where('id', '=', id).execute();
  }
}
