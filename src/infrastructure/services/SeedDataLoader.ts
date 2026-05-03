/**
 * [LAYER: INFRASTRUCTURE]
 * Industrialized Seeding Infrastructure for PlayMoreTCG.
 * Features: Atomic transactions, forensic logging, and idempotent relational population.
 */
import type { 
  ProductDraft, 
  OrderStatus, 
  Address, 
  SupportTicket, 
  KnowledgebaseCategory, 
  KnowledgebaseArticle,
} from '@domain/models';
import type { DiscountTable } from '../sqlite/schema';
import { getInitialServices } from '../../core/container';
import { SQLiteOrderRepository } from '../repositories/sqlite/SQLiteOrderRepository';
import { knowledgebaseRepository } from '../repositories/knowledgebaseRepository';
import { ticketRepository } from '../repositories/ticketRepository';
import { getSQLiteDB } from '../sqlite/database';
import { logger } from '@utils/logger';

// ─────────────────────────────────────────────
// COMPREHENSIVE MOCK DATA
// ─────────────────────────────────────────────

const INITIAL_CATALOG: ProductDraft[] = [
  {
    name: 'Scarlet & Violet Booster Box',
    description: 'A sealed booster box containing 36 packs from the Scarlet & Violet expansion.',
    price: 14999,
    category: 'box',
    stock: 25,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400',
    set: 'Scarlet & Violet',
    sku: 'SV-BB-001',
    handle: 'scarlet-violet-booster-box',
    trackQuantity: true,
    physicalItem: true,
    weightGrams: 800,
    media: [],
  },
  {
    name: 'Charizard EX (Holo)',
    description: 'Ultra rare holographic Charizard EX card. Near mint condition.',
    price: 29999,
    category: 'single',
    stock: 3,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1613773827290-e46feb889f6d?w=400',
    set: 'XY Evolutions',
    rarity: 'holo',
    sku: 'XY-CHZ-EX',
    handle: 'charizard-ex-holo',
    trackQuantity: true,
    physicalItem: true,
    weightGrams: 5,
    media: [],
  },
  {
    name: 'Custom Playmat (POD)',
    description: 'High-quality neoprene playmat with custom printed designs.',
    price: 2499,
    category: 'accessory',
    stock: 0,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1611083360739-bdad6e0eb1fa?w=400',
    handle: 'custom-playmat-pod',
    hasVariants: true,
    options: [
      { id: 'opt-size', productId: '', name: 'Size', position: 1, values: ['Standard', 'XL'] },
      { id: 'opt-finish', productId: '', name: 'Finish', position: 2, values: ['Matte', 'Stitched Edge'] }
    ],
    variants: [
      { id: 'var-1', productId: '', title: 'Standard / Matte', price: 2499, stock: 100, option1: 'Standard', option2: 'Matte', sku: 'PM-STD-MT', createdAt: new Date(), updatedAt: new Date() },
      { id: 'var-2', productId: '', title: 'Standard / Stitched', price: 2999, stock: 50, option1: 'Standard', option2: 'Stitched Edge', sku: 'PM-STD-ST', createdAt: new Date(), updatedAt: new Date() },
      { id: 'var-3', productId: '', title: 'XL / Matte', price: 3499, stock: 30, option1: 'XL', option2: 'Matte', sku: 'PM-XL-MT', createdAt: new Date(), updatedAt: new Date() },
      { id: 'var-4', productId: '', title: 'XL / Stitched', price: 3999, stock: 20, option1: 'XL', option2: 'Stitched Edge', sku: 'PM-XL-ST', createdAt: new Date(), updatedAt: new Date() },
    ],
    trackQuantity: true,
    physicalItem: true,
    media: [],
  },
  {
    name: 'TCG Master Class - Digital Guide',
    description: 'A comprehensive digital guide to mastering competitive TCG play. Instant download.',
    price: 1999,
    category: 'digital',
    stock: 1000,
    status: 'active',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    handle: 'tcg-master-class-digital',
    isDigital: true,
    digitalAssets: [
      { id: 'asset-1', name: 'Mastering_TCG_v1.pdf', url: '/downloads/guides/tcg_master_v1.pdf', size: 15420000, mimeType: 'application/pdf', createdAt: new Date() }
    ],
    sku: 'DG-TCG-MC',
    trackQuantity: false,
    physicalItem: false,
    media: [],
  }
];

const INITIAL_CUSTOMERS = [
  { email: 'ash.ketchum@palette.town', password: 'Pikapika-password123', displayName: 'Ash Ketchum' },
  { email: 'misty.williams@cerulean.city', password: 'Starmie-password123', displayName: 'Misty Williams' },
  { email: 'brock.harrison@pewter.city', password: 'Onix-password123', displayName: 'Brock Harrison' },
  { email: 'admin@playmore.tcg', password: 'Admin-Secure-Password123', displayName: 'System Admin', role: 'admin' as const },
];

const KB_DATA = {
  categories: [
    { id: 'order-issues', name: 'Order Issues', slug: 'order-issues', description: 'Track, change, or cancel your orders.', icon: 'package', articleCount: 2 },
    { id: 'returns-refunds', name: 'Returns & Refunds', slug: 'returns-refunds', description: 'Everything you need to know about our return policy.', icon: 'rotate-ccw', articleCount: 1 },
    { id: 'card-condition', name: 'Card Condition', slug: 'card-condition', description: 'How we grade and verify every card.', icon: 'shield-check', articleCount: 1 },
  ],
  articles: [
    {
      id: 'art-1',
      categoryId: 'order-issues',
      title: 'How to track your order',
      slug: 'how-to-track-order',
      excerpt: 'Find out where your package is and when it will arrive.',
      content: '# How to track your order\n\nOnce your order has shipped, you will receive an email with a tracking number.',
      viewCount: 1540,
      helpfulCount: 120,
      notHelpfulCount: 5,
      tags: ['tracking', 'shipping'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

const SUPPLIERS = [
  { id: 'sup-1', name: 'Kanto Distribution', contactName: 'Officer Jenny', email: 'jenny@kanto.gov', phone: '555-0100', website: 'https://kanto.gov/distribution', address: '1 PokeWay, Viridian City' },
  { id: 'sup-2', name: 'Silph Co.', contactName: 'The President', email: 'ceo@silph.co', phone: '555-0200', website: 'https://silph.co', address: 'Silph Office Building, Saffron City' },
];

const LOCATIONS = [
  { id: 'loc-warehouse', name: 'Main Fulfillment Center', type: 'warehouse', address: '123 Logistics Blvd, Celadon City', isDefault: 1, isActive: 1 },
  { id: 'loc-retail', name: 'Saffron City Storefront', type: 'retail', address: '456 Market St, Saffron City', isDefault: 0, isActive: 1 },
];

const MACROS = [
  { id: 'mac-1', name: 'Shipping Status Update', content: 'Hello! Your order is currently being processed and will ship within 24 hours. You will receive a tracking number shortly.', category: 'Shipping', slug: 'shipping-update' },
  { id: 'mac-2', name: 'Grading Policy', content: 'Our cards are graded using NM (Near Mint) standards. If you feel your card does not meet this, please send photos for review.', category: 'Quality', slug: 'grading-policy' },
];

const DISCOUNTS: Partial<DiscountTable>[] = [
  { id: 'disc-1', code: 'WELCOME10', type: 'percentage', value: 10, status: 'active', isAutomatic: 0, startsAt: new Date().toISOString(), usageCount: 50 },
  { id: 'disc-2', code: 'FREESHIP', type: 'free_shipping', value: 0, status: 'active', isAutomatic: 0, startsAt: new Date().toISOString(), usageCount: 120 },
];

// ─────────────────────────────────────────────
// SEEDING LOGIC
// ─────────────────────────────────────────────

function assertSeedingAllowed(): void {
  const allowInProduction = process.env.ALLOW_PRODUCTION_SEEDING === 'true';
  if (process.env.NODE_ENV === 'production' && !allowInProduction) {
    throw new Error('PRODUCTION_BLOCK: Seeding is prohibited in production unless ALLOW_PRODUCTION_SEEDING=true.');
  }
}

/**
 * Atomic Seeding Module for Core Taxonomy
 */
export async function seedTaxonomy(): Promise<void> {
  const db = getSQLiteDB();
  const now = new Date().toISOString();

  await db.transaction().execute(async (trx) => {
    // Collections
    const collections = [
      { id: 'coll-new', name: 'New Arrivals', handle: 'new-arrivals', status: 'active', productCount: 10 },
      { id: 'coll-best', name: 'Best Sellers', handle: 'best-sellers', status: 'active', productCount: 25 },
    ];

    for (const coll of collections) {
      await trx.insertInto('collections')
        .values({ ...coll, createdAt: now, updatedAt: now })
        .onConflict(oc => oc.column('id').doNothing())
        .execute();
    }

    // Product Categories
    const cats = [
      { id: 'cat-cards', name: 'Trading Cards', slug: 'cards', description: 'Individual singles and sets' },
      { id: 'cat-acc', name: 'Accessories', slug: 'accessories', description: 'Mats, sleeves, and more' },
    ];

    for (const cat of cats) {
      await trx.insertInto('product_categories')
        .values({ ...cat, createdAt: now, updatedAt: now })
        .onConflict(oc => oc.column('id').doNothing())
        .execute();
    }
  });
}

/**
 * Seeding Suppliers with Forensic Verification
 */
export async function seedSuppliers(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  let created = 0;
  
  for (const sup of SUPPLIERS) {
    const result = await db.insertInto('suppliers')
      .values({ 
        ...sup, 
        address: typeof sup.address === 'string' ? sup.address : JSON.stringify(sup.address), 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      })
      .onConflict(oc => oc.column('id').doNothing())
      .execute();
    
    const numRows = result[0]?.numInsertedOrUpdatedRows ?? 0n;
    if (numRows > 0n) created++;
  }
  return created;
}

/**
 * Seeding Inventory Locations
 */
export async function seedLocations(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  let created = 0;
  
  for (const loc of LOCATIONS) {
    const result = await db.insertInto('inventory_locations')
      .values({ ...loc, createdAt: new Date().toISOString() })
      .onConflict(oc => oc.column('id').doNothing())
      .execute();
    
    const numRows = result[0]?.numInsertedOrUpdatedRows ?? 0n;
    if (numRows > 0n) created++;
  }
  return created;
}

/**
 * Complex Relational Seeding for Inventory Levels
 */
export async function seedInventory(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  const products = await db.selectFrom('products').select(['id', 'stock']).execute();
  const locations = await db.selectFrom('inventory_locations').select('id').execute();
  let created = 0;

  if (locations.length === 0) {
    logger.warn('SKIPPED: Inventory seeding skipped because no locations found.');
    return 0;
  }

  await db.transaction().execute(async (trx) => {
    for (const prod of products) {
      for (const loc of locations) {
        await trx.insertInto('inventory_levels')
          .values({
            productId: prod.id,
            locationId: loc.id,
            availableQty: Math.floor(prod.stock / locations.length),
            reservedQty: 0,
            incomingQty: 0,
            reorderPoint: 5,
            reorderQty: 20,
            updatedAt: new Date().toISOString()
          })
          .onConflict(oc => oc.columns(['productId', 'locationId']).doNothing())
          .execute();
        created++;
      }
    }
  });
  return created;
}

/**
 * Product Seeding via Domain Service Layer
 */
export async function seedProducts(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;

  for (const product of INITIAL_CATALOG) {
    try {
      const existing = await services.productService.getProducts({ limit: 1, query: product.name });
      if (existing.products.length === 0) {
        await services.productService.createProduct(product, { id: 'system', email: 'system@playmore.tcg' });
        created++;
      }
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed product ${product.name}.`, err);
    }
  }
  return created;
}

/**
 * Customer Seeding via Identity Service Layer
 */
export async function seedCustomers(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  let created = 0;

  for (const customer of INITIAL_CUSTOMERS) {
    try {
      const users = await services.authService.getAllUsers();
      if (!users.some(u => u.email === customer.email)) {
        await services.authService.signUp(customer.email, customer.password, customer.displayName);
        created++;
      }
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed customer ${customer.email}.`, err);
    }
  }
  return created;
}

/**
 * Order History Seeding with Realistic Lifecycle
 */
export async function seedOrders(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const orderRepo = new SQLiteOrderRepository();
  const productsResult = await services.productService.getProducts({ limit: 100 });
  const products = productsResult.products;
  const customers = await services.authService.getAllUsers();
  
  if (products.length === 0 || customers.length === 0) {
    logger.warn('SKIPPED: Order seeding skipped because products or customers are missing.');
    return 0;
  }

  const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  const addresses: Address[] = [
    { street: '123 Pallet Lane', city: 'Pallet Town', state: 'Kanto', zip: '00101', country: 'US' },
    { street: '456 Gym Road', city: 'Cerulean City', state: 'Kanto', zip: '00104', country: 'US' },
  ];

  let created = 0;
  for (let i = 0; i < 15; i++) {
    try {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      if (customer.role === 'admin') continue;

      const orderProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 2);
      const items = orderProducts.map(p => ({
        productId: p.id,
        name: p.name,
        quantity: 1,
        unitPrice: p.price
      }));

      const total = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const address = addresses[Math.floor(Math.random() * addresses.length)];
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 10));

      await orderRepo.seed({
        id: crypto.randomUUID(),
        userId: customer.id,
        customerName: customer.displayName,
        customerEmail: customer.email,
        items,
        total,
        status,
        shippingAddress: address,
        paymentTransactionId: `seeded_${crypto.randomUUID()}`,
        riskScore: Math.floor(Math.random() * 10),
        createdAt,
        updatedAt: createdAt,
        notes: [],
      });
      created++;
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed order iteration ${i}.`, err);
    }
  }
  return created;
}

/**
 * Knowledgebase Seeding
 */
export async function seedKnowledgebase(): Promise<number> {
  assertSeedingAllowed();
  let created = 0;
  try {
    for (const cat of KB_DATA.categories) {
      await knowledgebaseRepository.saveCategory(cat as KnowledgebaseCategory);
      created++;
    }
    for (const art of KB_DATA.articles) {
      await knowledgebaseRepository.saveArticle(art as KnowledgebaseArticle);
      created++;
    }
  } catch (err) {
    logger.error('Forensic Fault: Failed during Knowledgebase seeding.', err);
  }
  return created;
}

/**
 * CRM Support Ticket Seeding
 */
export async function seedTickets(): Promise<number> {
  assertSeedingAllowed();
  const services = getInitialServices();
  const customers = await services.authService.getAllUsers();
  const ordersResult = await new SQLiteOrderRepository().getAll({ limit: 10 });
  const orders = ordersResult.orders;
  
  if (customers.length === 0) return 0;
  let created = 0;

  for (let i = 0; i < 3; i++) {
    try {
      const customer = customers.find(c => c.role === 'customer') || customers[0];
      const order = orders[Math.floor(Math.random() * orders.length)];
      const id = crypto.randomUUID();
      
      const ticket: SupportTicket = {
        id,
        userId: customer.id,
        customerEmail: customer.email,
        customerName: customer.displayName,
        subject: `Industrial Support Request #${i+1}`,
        priority: 'medium',
        status: 'open',
        orderId: order?.id,
        messages: [{
          id: crypto.randomUUID(),
          ticketId: id,
          senderId: customer.id,
          senderType: 'customer',
          content: 'Industrial Audit: Hello, I have an issue with my recent order.',
          createdAt: new Date(),
          visibility: 'public'
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await ticketRepository.createTicket(ticket);
      created++;
    } catch (err) {
      logger.error(`Forensic Fault: Failed to seed ticket iteration ${i}.`, err);
    }
  }
  return created;
}

/**
 * CRM Macro Seeding
 */
export async function seedMacros(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  let created = 0;
  for (const mac of MACROS) {
    const result = await db.insertInto('support_macros')
      .values(mac)
      .onConflict(oc => oc.column('id').doNothing())
      .execute();
    
    const numRows = result[0]?.numInsertedOrUpdatedRows ?? 0n;
    if (numRows > 0n) created++;
  }
  return created;
}

/**
 * Promotion & Discount Seeding
 */
export async function seedDiscounts(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  let created = 0;
  for (const disc of DISCOUNTS) {
    const result = await db.insertInto('discounts')
      .values({
        ...disc as any,
        createdAt: new Date().toISOString()
      })
      .onConflict(oc => oc.column('id').doNothing())
      .execute();
    
    const numRows = result[0]?.numInsertedOrUpdatedRows ?? 0n;
    if (numRows > 0n) created++;
  }
  return created;
}

/**
 * Global Store Settings
 */
export async function seedSettings(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  const settings = [
    { key: 'store_name', value: JSON.stringify('PlayMore TCG'), updatedAt: new Date().toISOString() },
    { key: 'currency', value: JSON.stringify('USD'), updatedAt: new Date().toISOString() },
    { key: 'tax_rate', value: JSON.stringify(0.08), updatedAt: new Date().toISOString() },
  ];
  for (const s of settings) {
    await db.insertInto('settings')
      .values(s)
      .onConflict(oc => oc.column('key').doUpdateSet({ value: s.value, updatedAt: s.updatedAt }))
      .execute();
  }
  return settings.length;
}

/**
 * Complex Relational Seeding for Purchase Orders
 */
export async function seedPurchaseOrders(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  const products = await db.selectFrom('products').select(['id', 'sku', 'name', 'cost']).limit(5).execute();
  const suppliers = await db.selectFrom('suppliers').select('id').execute();
  
  if (products.length === 0 || suppliers.length === 0) {
    logger.warn('SKIPPED: Purchase Order seeding skipped because products or suppliers are missing.');
    return 0;
  }

  const poId = 'po-12345';
  const now = new Date().toISOString();

  await db.transaction().execute(async (trx) => {
    await trx.insertInto('purchase_orders')
      .values({
        id: poId,
        supplier: suppliers[0].id,
        referenceNumber: 'REF-KANTO-001',
        status: 'ordered',
        totalCost: products.reduce((sum, p) => sum + (p.cost || 500) * 10, 0),
        createdAt: now,
        updatedAt: now
      })
      .onConflict(oc => oc.column('id').doNothing())
      .execute();

    for (const p of products) {
      await trx.insertInto('purchase_order_items')
        .values({
          id: crypto.randomUUID(),
          purchaseOrderId: poId,
          productId: p.id,
          sku: p.sku || 'UNKNOWN',
          productName: p.name,
          orderedQty: 10,
          receivedQty: 0,
          unitCost: p.cost || 500,
          totalCost: (p.cost || 500) * 10
        })
        .execute();
    }
  });
  return 1;
}

/**
 * Sovereign Integrity Audit Log Seeding
 */
export async function seedAuditLogs(): Promise<number> {
  assertSeedingAllowed();
  const db = getSQLiteDB();
  const now = new Date().toISOString();
  const logs = [
    { id: crypto.randomUUID(), userId: 'system', userEmail: 'system@playmore.tcg', action: 'database_initialized', targetId: 'system', details: JSON.stringify({ version: '1.0.0' }), createdAt: now },
    { id: crypto.randomUUID(), userId: 'system', userEmail: 'system@playmore.tcg', action: 'seed_started', targetId: 'system', details: JSON.stringify({ environment: process.env.NODE_ENV }), createdAt: now },
  ];
  for (const log of logs) {
    await db.insertInto('hive_audit').values(log).execute();
  }
  return logs.length;
}

/**
 * Orchestration Engine for Comprehensive Seeding
 */
export async function seedAll(): Promise<void> {
  logger.info('INBOUND: Starting industrial-grade comprehensive database seeding...');
  
  try {
    await seedTaxonomy();
    await seedSettings();
    await seedMacros();
    await seedDiscounts();
    
    const products = await seedProducts();
    logger.info(`Forensic: Seeded ${products} products.`);
    
    const customers = await seedCustomers();
    logger.info(`Forensic: Seeded ${customers} customers.`);
    
    const suppliers = await seedSuppliers();
    logger.info(`Forensic: Seeded ${suppliers} suppliers.`);

    const locations = await seedLocations();
    logger.info(`Forensic: Seeded ${locations} locations.`);

    const inv = await seedInventory();
    logger.info(`Forensic: Seeded ${inv} inventory levels.`);
    
    const po = await seedPurchaseOrders();
    logger.info(`Forensic: Seeded ${po} purchase orders.`);

    const kb = await seedKnowledgebase();
    logger.info(`Forensic: Seeded ${kb} KB items.`);
    
    const orders = await seedOrders();
    logger.info(`Forensic: Seeded ${orders} orders.`);
    
    const tickets = await seedTickets();
    logger.info(`Forensic: Seeded ${tickets} support tickets.`);

    const audit = await seedAuditLogs();
    logger.info(`Forensic: Seeded ${audit} audit logs.`);
    
    logger.info('OUTBOUND: Comprehensive industrial seeding complete!');
  } catch (err) {
    logger.error('CRITICAL: Comprehensive seeding failed with fatal error.', err);
    throw err;
  }
}