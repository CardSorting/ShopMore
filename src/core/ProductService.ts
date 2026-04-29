/**
 * [LAYER: CORE]
 */
import type { IProductRepository } from '@domain/repositories';
import type { InventoryOverview, MarginHealth, Product, ProductDraft, ProductManagementOverview, ProductManagementProduct, ProductSavedView, ProductSavedViewResult, ProductSetupIssue, ProductStatus, ProductUpdate } from '@domain/models';
import { AuditService } from './AuditService';
import { ProductNotFoundError } from '@domain/errors';
import {
  assertValidProductDraft,
  assertValidProductUpdate,
  calculateGrossMarginPercent,
  classifyInventoryHealth,
  classifyMarginHealth,
  classifyProductSetupStatus,
  getProductSetupIssues,
} from '@domain/rules';

const PRODUCT_SAVED_VIEWS: ProductSavedView[] = [
  'all',
  'active',
  'drafts',
  'low_stock',
  'missing_sku',
  'missing_cost',
  'needs_photos',
  'archived',
];

export function isProductSavedView(value: string): value is ProductSavedView {
  return PRODUCT_SAVED_VIEWS.includes(value as ProductSavedView);
}

export class ProductService {
  constructor(
    private repo: IProductRepository,
    private audit: AuditService
  ) {}

  async getProducts(options?: {
    category?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ products: Product[]; nextCursor?: string }> {
    return this.repo.getAll(options);
  }

  async getInventoryOverview(): Promise<InventoryOverview> {
    const stats = await this.repo.getStats();
    
    // For the list of products in the overview, we still limit to 100 for performance
    const { products } = await this.repo.getAll({ limit: 100 });
    
    const enrichedProducts = products.map((product) => {
      const inventoryHealth = classifyInventoryHealth(product.stock);
      return { ...product, inventoryHealth };
    });

    return {
      totalProducts: stats.totalProducts,
      totalUnits: stats.totalUnits,
      inventoryValue: stats.inventoryValue,
      healthCounts: stats.healthCounts,
      products: enrichedProducts.sort((a, b) => {
        const rank = { out_of_stock: 0, low_stock: 1, healthy: 2 } as const;
        return rank[a.inventoryHealth] - rank[b.inventoryHealth] || a.stock - b.stock || a.name.localeCompare(b.name);
      }),
    };
  }

  async getProductManagementOverview(): Promise<ProductManagementOverview> {
    const { products } = await this.repo.getAll({ limit: 500 });
    const statusCounts: Record<ProductStatus, number> = { active: 0, draft: 0, archived: 0 };
    const setupIssueCounts: Record<ProductSetupIssue, number> = {
      missing_image: 0,
      missing_sku: 0,
      missing_price: 0,
      missing_cost: 0,
      missing_stock: 0,
      missing_category: 0,
      not_published: 0,
    };
    const marginHealthCounts: Record<MarginHealth, number> = {
      unknown: 0,
      at_risk: 0,
      healthy: 0,
      premium: 0,
    };
    let marginSum = 0;
    let marginCount = 0;

    const enriched = products.map((product) => {
      statusCounts[product.status] += 1;
      const setupIssues = getProductSetupIssues(product);
      for (const issue of setupIssues) setupIssueCounts[issue] += 1;
      const marginHealth = classifyMarginHealth(product);
      marginHealthCounts[marginHealth] += 1;
      const grossMarginPercent = calculateGrossMarginPercent(product);
      if (grossMarginPercent !== null) {
        marginSum += grossMarginPercent;
        marginCount += 1;
      }
      return this.enrichProductForManagement(product, setupIssues, marginHealth, grossMarginPercent);
    });

    return {
      totalProducts: products.length,
      statusCounts,
      setupIssueCounts,
      marginHealthCounts,
      lowStockCount: products.filter((product) => product.stock > 0 && product.stock < (product.reorderPoint ?? 5)).length,
      outOfStockCount: products.filter((product) => product.stock <= 0).length,
      averageMarginPercent: marginCount > 0 ? Math.round((marginSum / marginCount) * 10) / 10 : null,
      productsNeedingAttention: enriched
        .filter((product) => product.setupStatus === 'needs_attention')
        .sort((a, b) => b.setupIssues.length - a.setupIssues.length || a.name.localeCompare(b.name))
        .slice(0, 25),
    };
  }

  async getProductSavedView(
    view: ProductSavedView,
    options?: { query?: string; limit?: number; cursor?: string }
  ): Promise<ProductSavedViewResult> {
    const { products } = await this.repo.getAll({
      query: options?.query,
      limit: options?.limit ?? 500,
      cursor: options?.cursor,
    });
    const enriched = products
      .map((product) => this.enrichProductForManagement(product))
      .filter((product) => this.matchesSavedView(product, view))
      .sort((a, b) => {
        if (view === 'low_stock') return a.stock - b.stock || a.name.localeCompare(b.name);
        if (view === 'missing_sku' || view === 'missing_cost' || view === 'needs_photos') {
          return b.setupIssues.length - a.setupIssues.length || a.name.localeCompare(b.name);
        }
        return b.updatedAt.getTime() - a.updatedAt.getTime() || a.name.localeCompare(b.name);
      });

    return {
      view,
      totalCount: enriched.length,
      products: enriched,
    };
  }

  private enrichProductForManagement(
    product: Product,
    setupIssues = getProductSetupIssues(product),
    marginHealth = classifyMarginHealth(product),
    grossMarginPercent = calculateGrossMarginPercent(product)
  ): ProductManagementProduct {
    return {
      ...product,
      setupStatus: classifyProductSetupStatus(product),
      setupIssues,
      marginHealth,
      grossMarginPercent,
      inventoryHealth: classifyInventoryHealth(product.stock),
    };
  }

  private matchesSavedView(product: ProductManagementProduct, view: ProductSavedView): boolean {
    if (view === 'all') return true;
    if (view === 'active') return product.status === 'active';
    if (view === 'drafts') return product.status === 'draft';
    if (view === 'archived') return product.status === 'archived';
    if (view === 'low_stock') return product.stock > 0 && product.stock < (product.reorderPoint ?? 5);
    if (view === 'missing_sku') return product.setupIssues.includes('missing_sku');
    if (view === 'missing_cost') return product.setupIssues.includes('missing_cost');
    if (view === 'needs_photos') return product.setupIssues.includes('missing_image');
    return false;
  }

  async getProduct(id: string): Promise<Product> {
    const product = await this.repo.getById(id);
    if (!product) throw new ProductNotFoundError(id);
    return product;
  }

  async createProduct(data: ProductDraft, actor: { id: string, email: string }): Promise<Product> {
    assertValidProductDraft(data);
    const product = await this.repo.create(data);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_created',
      targetId: product.id,
      details: {
        name: product.name,
        sku: product.sku ?? null,
        manufacturer: product.manufacturer ?? null,
        supplier: product.supplier ?? null,
      }
    });
    return product;
  }

  async updateProduct(id: string, updates: ProductUpdate, actor: { id: string, email: string }): Promise<Product> {
    assertValidProductUpdate(updates);
    const product = await this.repo.update(id, updates);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_updated',
      targetId: id,
      details: updates
    });
    return product;
  }

  async deleteProduct(id: string, actor: { id: string, email: string }): Promise<void> {
    await this.repo.delete(id);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_deleted',
      targetId: id
    });
  }

  async batchUpdateProducts(updates: { id: string; updates: ProductUpdate }[], actor: { id: string, email: string }): Promise<Product[]> {
    updates.forEach(({ updates: u }) => assertValidProductUpdate(u));
    
    let products: Product[];
    if (this.repo.batchUpdate) {
      products = await this.repo.batchUpdate(updates);
    } else {
      products = await Promise.all(updates.map(({ id, updates: u }) => this.repo.update(id, u)));
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_batch_updated',
      targetId: 'multiple',
      details: { count: updates.length, ids: updates.map(u => u.id) }
    });

    return products;
  }

  async batchDeleteProducts(ids: string[], actor: { id: string, email: string }): Promise<void> {
    if (this.repo.batchDelete) {
      await this.repo.batchDelete(ids);
    } else {
      await Promise.all(ids.map((id) => this.repo.delete(id)));
    }

    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'product_batch_deleted',
      targetId: 'multiple',
      details: { count: ids.length, ids }
    });
  }
}
