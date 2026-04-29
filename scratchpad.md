# 🏗️ Product Intake & Receiving — Architectural Plan
**Date:** 2026-04-29  
**Goal:** Align product intake and receiving flows with Shopify/Stripe industry standards; improve UX for non-technical users.

---

## 1. EXISTING STATE AUDIT

### 1.1 Domain Layer
**Files:** `src/domain/models.ts`
- `Product` model: `id`, `name`, `sku`, `price`, `cost`, `taxCode`, `image`, `description`, `isActive`, `isDigital`, `createdAt`, `updatedAt`.
- No `ProductStatus` enum (draft | active | archived).
- No `barcode` / `upc` field.
- No `vendor` / `supplier` / `brand` field.
- No `tags` field.
- No `productType` / `category` field.
- No `seoTitle`, `seoDescription`, `slug` fields.
- No cost-of-goods-sold history.
- `Variant` model exists but only `id`, `productId`, `sku`, `price`, `image`, `createdAt` — no inventory fields at variant level.
- `PurchaseOrder` model: `id`, `poNumber`, `supplier`, `status`, `orderDate`, `expectedDeliveryDate`, `notes`, `totalCost`, `createdAt`, `updatedAt`.
- `PurchaseOrderItem`: `id`, `poId`, `productId`, `quantity`, `unitCost`.
- `ReceivingStatus` enum: `PENDING`, `PARTIAL`, `RECEIVED`, `OVER_RECEIVED`.
- **Missing:** `Shipment` / `Receiving` model for tracking individual receipts.
- **Missing:** `InventoryAdjustment` model for ledger-style history.
- **Missing:** `Supplier` / `Vendor` aggregate.
- **Missing:** `ProductMedia` / `Asset` support.

### 1.2 Core Layer
**Files:** `src/core/ProductService.ts`, `src/core/PurchaseOrderService.ts`, `src/core/TransferService.ts`
- `ProductService`: Basic CRUD + search. `receiveInventory` method exists but is called from `PurchaseOrderService.receiveAllItems`. No bulk import. No cost history.
- `PurchaseOrderService`: `create`, `update`, `delete`, `getById`, `getAll`, `receiveAllItems`, `transitionStatus`. 
  - `receiveAllItems` receives ALL items at once immediately. No partial. No over-receive guard. No shipment tracking.
- `TransferService`: Present but no UI entry point for receiving via transfer.

### 1.3 Infrastructure Layer
**Files:** `src/infrastructure/sqlite/schema.ts`
- Tables: `products`, `product_variants`, `inventory_levels`, `purchase_orders`, `purchase_order_items`.
- No `shipments` / `receivings` table.
- No `suppliers` table.
- No `product_tags` table.
- No `product_media` table.
- No `inventory_adjustments` (ledger) table.
- No `barcode` index on products.

### 1.4 UI Layer
**Files:** `src/ui/pages/admin/AdminProducts.tsx`, `src/ui/pages/admin/AdminProductForm.tsx`, `src/ui/pages/admin/AdminPurchaseOrders.tsx`, `src/ui/navigation/adminNavigation.ts`
- `AdminProducts`: Fixed 50-item table, no pagination, no filtering, no status badges, no bulk actions, no CSV export/import.
- `AdminProductForm`: Single-page form with name, SKU, price, cost, taxCode, image URL, description, toggle. No tabs, no variants editor, no SEO fields, no barcode field, no vendor field.
- `AdminPurchaseOrders`: Table with no detail page. receiveAndUpdateInventory button for ALL items immediately. No purchase order creation UI. No draft/pending etc workflow. No receiving detail view.
- `adminNavigation.ts`: Settings link broken ("#"). Transfer link points to `#settings/team` (wrong). No suppliers/vendor link.

### 1.5 API Layer
**Files:** `src/app/api/admin/products/route.ts`, `src/app/api/admin/purchase-orders/route.ts`
- Products API: GET (list/search), POST (create), PUT (update), DELETE. No bulk import endpoint. No barcode lookup.
- Purchase Orders API: GET (list), POST (create), PUT (update), DELETE. No receive endpoint. No partial receive endpoint. No PO detail endpoint.

---

# Requirement Analysis

## Functional Requirements
1. **Product Intake & Catalog Management**
   - Products must support a status lifecycle: Draft → Active → Archived.
   - Products need barcode/UPC fields for scanning and lookup.
   - Products must have vendor, tags, product type, and SEO fields (title, description, slug).
   - Products need a compare-at price (MSRP) for sale display.
   - Bulk product import via CSV with progress tracking and per-row error reporting.

2. **Supplier Management**
   - Suppliers must be first-class entities with contact info (name, email, phone, address).
   - Purchase orders must link to a supplier by ID, not just a string.
   - Suppliers must be editable and deletable.

3. **Purchase Order Receiving**
   - Partial receiving must be supported (receive a subset of items or quantities).
   - Over-receive protection must prevent exceeding ordered quantity by more than 10%.
   - Each receiving event must be tracked: who received it, when, tracking number, condition, notes.
   - Receiving must update inventory atomically and record an audit trail.

4. **Inventory Ledger (Audit Trail)**
   - Every inventory change must be recorded with before/after quantities, delta, reason, and user.
   - The ledger must record reference to the source (PO, transfer, manual, order, receiving).
   - Ledger must be queriable by product, location, or reference.

5. **UX / Navigation**
   - Product list must have pagination, filtering, sorting, search, bulk actions, and status badges.
   - Product creation must be a tabbed wizard (Details, Variants, SEO, Inventory).
   - Purchase orders must have detail pages with items and receiving history.
   - Receiving UI must be a focused, step-by-step flow (barcode → quantity → confirm).
   - Admin navigation must be restructured into logical groups: Products, Purchasing, Analytics.
   - Broken navigation links (Settings → "#", Transfers → wrong href) must be fixed.

## Non-Functional Requirements
1. **Backward Compatibility:** All schema changes must be additive with DEFAULT values. No breaking API contract changes.
2. **Transaction Safety:** Receiving operations must be atomic across inventory, adjustments, receiving items, and PO status.
3. **Auditability:** Inventory adjustments table must exist before any receiving UI ships.
4. **Performance:** New queries must use indices. No full-table scans.
5. **Maintainability:** JoyZoning purity must be preserved. Domain has zero external imports. UI never holds business logic.

---

## 2. GAP ANALYSIS vs. INDUSTRY STANDARDS (Shopify / Stripe patterns)

### 2.1 Product Intake Gaps
| Pattern | Shopify Implementation | Our Current State | Gap Severity |
|---|---|---|---|
| **Product Status Lifecycle** | Draft → Active → Archived | Single `isActive` boolean | **HIGH** |
| **Barcode / UPC** | `barcode` field on Product/Variant | None | **HIGH** |
| **Vendor / Supplier** | `vendor` field + full Suppliers app | `supplier` string on PO only | **HIGH** |
| **Product Tags** | Comma-separated tags, searchable | None | **MEDIUM** |
| **Product Type** | `productType` for categorization | None | **MEDIUM** |
| **SEO Fields** | Title, description, URL handle | None | **MEDIUM** |
| **Cost Tracking** | Cost per item, margin calc | `cost` field only | **MEDIUM** |
| **Variants** | Multi-option (Size, Color, etc.) | Schema exists, no UI | **HIGH** |
| **Bulk Import** | CSV import with mapping wizard | None | **HIGH** |
| **Product Media** | Image gallery, video, 3D | Single `image` string | **MEDIUM** |
| **Collections** | Manual & automated collections | None | **LOW** |

### 2.2 Receiving / Inventory Gaps
| Pattern | Shopify Implementation | Our Current State | Gap Severity |
|---|---|---|---|
| **Purchase Order Detail** | Full PO detail page with items | No detail page | **HIGH** |
| **Partial Receiving** | Receive items in batches | `receiveAllItems` only (all at once) | **HIGH** |
| **Over-Receive Protection** | Configurable over-receive limit | None | **MEDIUM** |
| **Shipment Tracking** | Tracking #, carrier, shipped date | None | **MEDIUM** |
| **Unit Cost at Receive** | Capture actual cost during receive | Static `unitCost` from PO | **MEDIUM** |
| **Receiving Notes** | Notes per receiving event | None | **LOW** |
| **Inventory Ledger** | Every change tracked with reason | No history table | **HIGH** |
| **Adjustments** | Dedicated adjustment flow with reason | No UI, no model | **HIGH** |
| **Bin / Location** | Inventory at location + bin | Only `inventory_levels` with `locationId` | **MEDIUM** |
| **Stock Alerts** | Low stock, out of stock notifications | No alerting | **LOW** |

### 2.3 UX / Navigation Gaps
| Pattern | Shopify Implementation | Our Current State | Gap Severity |
|---|---|---|---|
| **Step-by-Step Product Wizard** | Guided product creation | Single flat form | **HIGH** |
| **Visual Receiving Flow** | Scan barcode → quantity → confirm | Button-click receive all | **HIGH** |
| **Filterable Data Tables** | Search, filters, sort, pagination | Static 50-row table | **HIGH** |
| **Bulk Actions** | Select rows → bulk update/delete | None | **MEDIUM** |
| **Status Badges** | Color-coded status pills | Text only | **MEDIUM** |
| **Detail Pages** | Click row → full detail | No detail pages for POs or Products | **HIGH** |
| **Breadcrumbs** | Clear navigation path | None | **LOW** |
| **Quick-Add FAB** | Floating action button for create | Standard button | **LOW** |

---

## 3. ARCHITECTURAL PLAN — JOYZONING LAYERS

### 3.1 DOMAIN LAYER — New Models & Value Objects
**Files to modify/create:**
- `src/domain/models.ts` — extend existing, add new models
- `src/domain/rules.ts` — add business rules for receiving
- `src/domain/repositories.ts` — add new repository interfaces
- `src/domain/errors.ts` — add receiving errors

**Pure business logic additions:**

```typescript
// New enums
enum ProductStatus { DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', ARCHIVED = 'ARCHIVED' }
enum AdjustmentReason { PURCHASE = 'PURCHASE', RETURN = 'RETURN', DAMAGE = 'DAMAGE', CORRECTION = 'CORRECTION' }

// Extended Product
interface Product {
  ...
  status: ProductStatus;      // DRAFT/ACTIVE/ARCHIVED
  barcode?: string;           // UPC/EAN/ISBN
  vendor?: string;            // Supplier/vendor name
  tags: string[];             // Product tags
  productType?: string;       // Category/type
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;              // URL-friendly handle
  compareAtPrice?: number;    // MSRP for sale display
  weight?: number;            // For shipping calc
  weightUnit?: 'g' | 'kg' | 'lb' | 'oz';
}

// New: Supplier Aggregate
interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Extended PurchaseOrder
interface PurchaseOrder {
  ...
  supplierId?: string;        // FK to Supplier
  trackingNumber?: string;    // Shipment tracking
  shippingCarrier?: string;
  shippingCost?: number;
  taxCost?: number;
  discount?: number;
}

// New: Receiving (Shipment) Aggregate
interface Receiving {
  id: string;
  poId: string;
  receivedAt: string;
  receivedBy?: string;        // User ID
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
}

interface ReceivingItem {
  id: string;
  receivingId: string;
  poItemId: string;
  productId: string;
  quantityReceived: number;
  unitCost: number;           // Actual cost at receive time
  condition: 'NEW' | 'DAMAGED' | 'DEFECTIVE';
  notes?: string;
}

// New: Inventory Adjustment (Ledger)
interface InventoryAdjustment {
  id: string;
  productId: string;
  locationId: string;
  variantId?: string;
  quantityBefore: number;
  quantityAfter: number;
  delta: number;
  reason: AdjustmentReason;
  referenceType: 'PURCHASE_ORDER' | 'TRANSFER' | 'MANUAL' | 'ORDER' | 'RECEIVING';
  referenceId?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

// New: Bulk Import Job
interface ImportJob {
  id: string;
  type: 'PRODUCTS' | 'INVENTORY';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errors: ImportError[];
  createdAt: string;
  completedAt?: string;
}
```

**Business Rules (src/domain/rules.ts):**
```typescript
function canReceiveItem(poItem: PurchaseOrderItem, alreadyReceived: number, qtyToReceive: number): boolean {
  // Prevent over-receiving beyond a configurable threshold (default 110%)
  const threshold = 1.1; 
  return (alreadyReceived + qtyToReceive) <= (poItem.quantity * threshold);
}

function calculatePoReceivedStatus(items: { ordered: number; received: number }[]): ReceivingStatus {
  const totalOrdered = items.reduce((s, i) => s + i.ordered, 0);
  const totalReceived = items.reduce((s, i) => s + i.received, 0);
  if (totalReceived === 0) return 'PENDING';
  if (totalReceived >= totalOrdered) return 'RECEIVED';
  return 'PARTIAL';
}
```

**Repository Interfaces to Add (src/domain/repositories.ts):**
```typescript
interface ISupplierRepository { create, getById, getAll, update, delete, getByName }
interface IReceivingRepository { createReceiving, getReceivingById, getReceivingsByPo, getReceivingItems, deleteReceiving }
interface IInventoryAdjustmentRepository { recordAdjustment, getAdjustmentsByProduct, getAdjustmentsByLocation, getInventoryHistory }
interface IImportJobRepository { create, update, getById, getAll, delete }
```

---

### 3.2 CORE LAYER — Orchestration
**Files to modify/create:**
- `src/core/ProductService.ts` — add bulk import, barcode lookup, status transitions
- `src/core/PurchaseOrderService.ts` — refactor receiving to support partial, add shipment tracking
- `src/core/SupplierService.ts` — new service
- `src/core/ReceivingService.ts` — new service for receiving orchestration
- `src/core/InventoryAdjustmentService.ts` — new service for ledger operations
- `src/core/ImportService.ts` — new service for CSV import

**Key Logic:**
- `ReceivingService.receiveItems(poId, items[])`: 
  1. Validate PO exists and is APPROVED or PARTIAL.
  2. For each item: validate quantity against ordered + threshold.
  3. Create Receiving record + ReceivingItem records.
  4. Update inventory levels.
  5. Record InventoryAdjustment entries.
  6. Update PO received quantities and status.
  7. All in a transaction.
- `ImportService.processProducts(file)`:
  1. Parse CSV.
  2. Validate rows using domain rules.
  3. Create products in batches.
  4. Update ImportJob status.

---

### 3.3 INFRASTRUCTURE LAYER — Adapters
**Files to modify/create:**
- `src/infrastructure/sqlite/schema.ts` — add new tables
- `src/infrastructure/repositories/sqlite/SQLiteSupplierRepository.ts` — new
- `src/infrastructure/repositories/sqlite/SQLiteReceivingRepository.ts` — new
- `src/infrastructure/repositories/sqlite/SQLiteInventoryAdjustmentRepository.ts` — new
- `src/infrastructure/repositories/sqlite/SQLiteImportJobRepository.ts` — new
- `src/infrastructure/services/CsvParser.ts` — CSV parsing utility
- `src/app/api/admin/suppliers/` — API routes
- `src/app/api/admin/receiving/` — API routes
- `src/app/api/admin/import/` — API routes

**Schema Additions:**
```sql
-- Suppliers table
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Product additions (via ALTER or migration)
ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'ACTIVE';
ALTER TABLE products ADD COLUMN barcode TEXT;
ALTER TABLE products ADD COLUMN vendor TEXT;
ALTER TABLE products ADD COLUMN tags TEXT; -- JSON array
ALTER TABLE products ADD COLUMN product_type TEXT;
ALTER TABLE products ADD COLUMN seo_title TEXT;
ALTER TABLE products ADD COLUMN seo_description TEXT;
ALTER TABLE products ADD COLUMN slug TEXT;
ALTER TABLE products ADD COLUMN compare_at_price REAL;
ALTER TABLE products ADD COLUMN weight REAL;
ALTER TABLE products ADD COLUMN weight_unit TEXT;

-- Receivings table
CREATE TABLE receivings (
  id TEXT PRIMARY KEY,
  po_id TEXT NOT NULL REFERENCES purchase_orders(id),
  received_at TEXT NOT NULL,
  received_by TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Receiving items
CREATE TABLE receiving_items (
  id TEXT PRIMARY KEY,
  receiving_id TEXT NOT NULL REFERENCES receivings(id),
  po_item_id TEXT NOT NULL REFERENCES purchase_order_items(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity_received INTEGER NOT NULL,
  unit_cost REAL,
  condition TEXT DEFAULT 'NEW',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Inventory adjustments (ledger)
CREATE TABLE inventory_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  location_id TEXT NOT NULL REFERENCES inventory_locations(id),
  variant_id TEXT REFERENCES product_variants(id),
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Create indices
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_vendor ON products(vendor);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_receivings_po ON receivings(po_id);
CREATE INDEX idx_receiving_items_receiving ON receiving_items(receiving_id);
CREATE INDEX idx_inventory_adjustments_product ON inventory_adjustments(product_id);
CREATE INDEX idx_inventory_adjustments_reference ON inventory_adjustments(reference_type, reference_id);
```

---

### 3.4 UI LAYER — Shopify-style Experience
**Files to modify/create:**
- `src/ui/navigation/adminNavigation.ts` — fix broken links, add Suppliers
- `src/ui/pages/admin/AdminProducts.tsx` — pagination, filters, status badges, bulk actions, import button
- `src/ui/pages/admin/AdminProductForm.tsx` — tabbed wizard (Details, Variants, SEO, Media), barcode field, vendor field
- `src/ui/pages/admin/AdminProductDetail.tsx` — new: full product detail page
- `src/ui/pages/admin/AdminSuppliers.tsx` — new: supplier list
- `src/ui/pages/admin/AdminSupplierForm.tsx` — new: supplier create/edit
- `src/ui/pages/admin/AdminPurchaseOrders.tsx` — status filters, click-through to detail
- `src/ui/pages/admin/AdminPurchaseOrderDetail.tsx` — new: full PO detail with items, receivings history, receive action
- `src/ui/pages/admin/AdminReceiving.tsx` — new: barcode-scan receiving flow
- `src/ui/pages/admin/AdminInventoryAdjustments.tsx` — new: inventory history/ledger view
- `src/ui/components/admin/BulkActionsBar.tsx` — new: reusable bulk action bar
- `src/ui/components/admin/StatusBadge.tsx` — new: color-coded status badges
- `src/ui/components/admin/BarcodeScanner.tsx` — new: camera/barcode input
- `src/ui/components/admin/ImportModal.tsx` — new: CSV import with preview

**Navigation Structure (mirroring Shopify admin):**
```
Products
  ├── All Products (AdminProducts)
  ├── Add Product (AdminProductForm)
  ├── Inventory (AdminInventory → link to adjustments)
  └── Import (ImportModal on Products page)

Purchasing
  ├── Purchase Orders (AdminPurchaseOrders)
  ├── Suppliers (AdminSuppliers)
  └── Receiving (AdminReceiving)

Analytics
  ├── Overview
  ├── Inventory...
```

---

### 3.5 API LAYER — New Routes
**Files to create:**
- `src/app/api/admin/suppliers/route.ts` — CRUD
- `src/app/api/admin/suppliers/[id]/route.ts` — CRUD
- `src/app/api/admin/purchase-orders/[id]/route.ts` — GET detail, PUT, DELETE
- `src/app/api/admin/purchase-orders/[id]/receive/route.ts` — POST: partial receive
- `src/app/api/admin/receiving/route.ts` — GET list, POST create
- `src/app/api/admin/receiving/[id]/route.ts` — GET detail, DELETE
- `src/app/api/admin/inventory/adjustments/route.ts` — GET ledger, POST manual adjustment
- `src/app/api/admin/products/import/route.ts` — POST CSV upload
- `src/app/api/admin/products/import/[id]/route.ts` — GET job status

---

## 4. IMPLEMENTATION PHASES (Prioritized)

### Phase 1: Foundation — Domain & Schema (High Value, Low Risk)
1. Add `ProductStatus`, `barcode`, `vendor`, `tags`, `productType`, `seoTitle`, `seoDescription`, `slug`, `compareAtPrice` to Product model.
2. Add `Supplier` model.
3. Add `Receiving`, `ReceivingItem`, `InventoryAdjustment` models.
4. Update SQLite schema with migrations.
5. Create repository interfaces.
6. Add domain business rules for receiving.

### Phase 2: Core Services (Orchestration)
1. Extend `ProductService` with bulk import support, barcode lookup.
2. Create `SupplierService`.
3. Create `ReceivingService` with transaction-safe partial receiving.
4. Create `InventoryAdjustmentService` for ledger.
5. Create `ImportService` with CSV parsing.
6. Refactor `PurchaseOrderService` to use ReceivingService.

### Phase 3: Infrastructure Adapters
1. Implement `SQLiteSupplierRepository`.
2. Implement `SQLiteReceivingRepository`.
3. Implement `SQLiteInventoryAdjustmentRepository`.
4. Implement `SQLiteImportJobRepository`.
5. Wire up in DI container.
6. Create API routes.

### Phase 4: UI — Product Experience
1. Redesign `AdminProducts` with filters, pagination, status badges, bulk actions.
2. Redesign `AdminProductForm` as tabbed wizard (Details, SEO, Variants).
3. Create `AdminProductDetail` page.
4. Add Import modal to Products page.
5. Add barcode field.

### Phase 5: UI — Purchasing & Receiving
1. Create `AdminSuppliers` list and form.
2. Fix `AdminPurchaseOrders` with status filters.
3. Create `AdminPurchaseOrderDetail` with items + receiving history + receive action.
4. Create `AdminReceiving` page with barcode scan flow.
5. Update admin navigation (fix broken links, add Suppliers group).

### Phase 6: Inventory Ledger
1. Create `AdminInventoryAdjustments` view.
2. Add adjustment history to product detail.
3. Add low-stock indicators.

---

## 5. TRIAD AUDIT

### 🏛️ The Architect
- **Cross-layer dependency check:** Domain gets zero new external imports. All new I/O (CSV parsing, DB) stays in Infrastructure. Core orchestrates only. ✅
- **Interface contracts:** Every new repository gets a domain interface before SQLite implementation. ✅
- **Transaction safety:** Receiving must be atomic (inventory + adjustments + PO status). SQLite transactions used. ✅
- **Backward compatibility:** Existing `products`, `purchase_orders` tables get `DEFAULT` values for new columns. No breaking changes. ✅
- **JoyZoning purity:** Domain models are pure value objects. No UI state, no I/O. ✅

### 🧐 The Critic
- **"Is this over-engineered?"** — Receiving and ledger are table stakes for any real inventory system. Shopify has all of this. The current "receive all at once" is fragile and loses audit history. The plan adds necessary observability.
- **"What about performance?"** — SQLite will handle this scale fine. Indices on barcode, status, and reference_type ensure lookups remain fast.
- **"Will the CSV import block the server?"** — Should be processed in chunks (25 rows at a time) with streaming CSV parse. ImportJob tracks progress asynchronously.
- **"Is the tabbed form discoverable?"** — Using familiar Shopify tabs: "Details | Variants | SEO | Inventory". Non-technical users know this pattern.
- **"What about barcode scanning?"** — Start with manual text input with a camera icon. Native Barcode Detection API as progressive enhancement later.

### 🛡️ The SRE
- **Migration safety:** Schema changes use `ALTER TABLE ADD COLUMN` which is safe in SQLite. New tables are independent. Existing data untouched.
- **Data integrity:** All receiving operations wrapped in `BEGIN TRANSACTION` / `COMMIT`. Rollback on any failure.
- **Audit trail:** Every inventory change recorded in `inventory_adjustments` with `created_by` user tracking.
- **Error handling:** CSV import produces detailed `ImportError[]` per row. Users can fix and retry.
- **Rollback plan:** If issues arise, reverting requires only removing new API routes and UI pages. Domain models and DB schema are additive only.

---

## 6. DECISIONS & TRADEOFFS

| Decision | Choice | Rationale |
|---|---|---|
| **Partial receiving** | Yes, mandatory | Industry standard. Receiving all at once is unrealistic. |
| **Inventory ledger** | Separate `inventory_adjustments` table | Audit trail required for any production system. |
| **Supplier aggregate** | First-class entity, not just string | Enables supplier reporting, contact info, multiple POs per supplier. |
| **Product status** | Enum over boolean | Draft state needed for creating before publishing. Archived hides from storefront without deleting. |
| **Barcode** | Text field on Product + Variant | UPC/EAN can be 13-14 digits. No validation regex needed (varies globally). |
| **CSV import** | Server-side chunked processing | Client-side parsing is fast but lacks validation against domain rules. |
| **Receiving UI** | Dedicated page, not inline on PO | Non-technical users need a focused, step-by-step flow. Mirrors Shopify's "Receive inventory" action. |

---

## 7. LAYER IMPACT SUMMARY

| Layer | Files Changed | Files Created |
|---|---|---|
| **DOMAIN** | `models.ts`, `rules.ts`, `errors.ts`, `repositories.ts` | 0 |
| **CORE** | `ProductService.ts`, `PurchaseOrderService.ts`, `container.ts` | `SupplierService.ts`, `ReceivingService.ts`, `InventoryAdjustmentService.ts`, `ImportService.ts` |
| **INFRASTRUCTURE** | `schema.ts`, `database.ts`, `services.ts` (DI) | `SQLiteSupplierRepository.ts`, `SQLiteReceivingRepository.ts`, `SQLiteInventoryAdjustmentRepository.ts`, `SQLiteImportJobRepository.ts`, `CsvParser.ts` + API routes |
| **UI** | `AdminProducts.tsx`, `AdminProductForm.tsx`, `AdminPurchaseOrders.tsx`, `adminNavigation.ts`, `AdminInventory.tsx` | `AdminProductDetail.tsx`, `AdminSuppliers.tsx`, `AdminSupplierForm.tsx`, `AdminPurchaseOrderDetail.tsx`, `AdminReceiving.tsx`, `AdminInventoryAdjustments.tsx`, `StatusBadge.tsx`, `BulkActionsBar.tsx`, `BarcodeScanner.tsx`, `ImportModal.tsx` |
| **PLUMBING** | 0 | `csvHelpers.ts`, `barcodeValidator.ts` |

---

## 8. FINAL ARCHITECTURAL COMMITMENT SEAL

✅ **Domain remains pure.** Zero external imports in Domain.  
✅ **Interfaces first.** All new repositories defined in Domain before implementation.  
✅ **Dependency inversion.** Core depends on Domain interfaces; Infrastructure implements them.  
✅ **UI renders state, never decides business outcomes.** All business logic lives in Core.  
✅ **Additive changes only.** No breaking schema changes. Existing functionality preserved.  
✅ **Audit trail guaranteed.** Every inventory mutation is recorded.

---

# STRATEGIC REVIEW

### Risk Surface Analysis
| Risk Vector | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Schema migration failure** | Low | High | All additions are `ALTER TABLE ADD COLUMN` with `DEFAULT` values. No destructive changes. Migration script included. |
| **API route conflicts** | Low | Medium | New routes use distinct path segments (`/suppliers`, `/receiving`, `/import`). No overlap with existing. |
| **UI regression** | Medium | Medium | Existing pages modified incrementally. New pages are additive. Feature flags not needed due to additive-only approach. |
| **Performance degradation** | Low | Low | New indices on high-cardinality columns (barcode, status). No full-table scans introduced. |
| **Data loss during receiving** | Low | Critical | All receiving operations use SQLite transactions with explicit rollback on failure. |
| **Import job orphaning** | Medium | Medium | ImportJob status tracking ensures jobs can be retried or cleaned up. |

### Dependency Graph Validation
```
Domain (models, rules, errors, repositories)
  ↓ (interfaces only)
Core (ProductService, PurchaseOrderService, ReceivingService, ...)
  ↓ (orchestration)
Infrastructure (SQLite Repos, API Routes, CsvParser)
  ↓ (renders)
UI (Pages, Components, Navigation)
```
**Validation:** No upward arrows. Domain imports nothing. UI imports only Domain + Plumbing. Core coordinates Domain + Infrastructure.

### Backward Compatibility Guarantee
- Existing `Product` shape preserved (new fields are optional).
- Existing `PurchaseOrder` shape preserved (new fields are optional).
- `isActive` boolean co-exists with new `status` enum (`status` derived from `isActive` for migration).
- All existing API responses remain unchanged (new fields only appear with new request shapes).

### Rollback Plan
1. **Immediate:** Remove new API route files. Next.js will 404 them gracefully.
2. **Short-term:** Revert UI page changes using git.
3. **Schema:** SQLite `ALTER TABLE ADD COLUMN` is irreversible by standard SQLite, but new columns are unused by old code. To fully revert, restore from backup taken before migration.
4. **Data:** No existing data is modified by migration. Full rollback = schema restore + removal of new code.

### Observability Additions
- `inventory_adjustments` table becomes the canonical audit log for all inventory changes.
- `ImportJob` provides visibility into bulk operations.
- Receiving records provide traceability from PO → receipt → inventory.

---

## [FINAL STEPS]

### THE FOUNDATION
- **Schema integrity:** All new columns added with `DEFAULT` values. No existing column types changed. No `NOT NULL` without default on existing rows. New tables are independent.
- **Domain purity verified:** No imports from `core/`, `infrastructure/`, or `ui/` in `src/domain/`. All new types are plain interfaces and enums.
- **Repository contracts defined before implementation:** `ISupplierRepository`, `IReceivingRepository`, `IInventoryAdjustmentRepository`, `IImportJobRepository` will be added to `src/domain/repositories.ts` before any SQLite class is written.
- **Migration ordering:** `ALTER TABLE` statements run before new `CREATE TABLE` statements. `CREATE INDEX` runs after table creation.

### THE QUALITY CHECK
- **Type safety:** All new API routes will use the existing `requireAdmin()` guard and validate request shapes against domain types.
- **Testability:** Domain rules (e.g., `canReceiveItem`, `calculatePoReceivedStatus`) are pure functions with no side effects — unit-testable with zero mocks.
- **Transaction coverage audit:** Every receiving path must touch `inventory_levels`, `inventory_adjustments`, `receiving_items`, and `purchase_orders` under a single SQLite `transaction()` call.
- **Error surface:** New domain errors (`OverReceiveError`, `InvalidReceiveStateError`) will be added to `src/domain/errors.ts` and surfaced to the UI consistently via existing error wrappers.

### THE STABILITY GUARD
- **Rollback gate:** All scheme changes are additive. Immediate rollback = delete new API routes and UI pages; functional code continues to work. Full rollback requires DB backup restore (standard practice documented).
- **No breaking API changes:** Existing `GET /api/admin/products` and `GET /api/admin/purchase-orders` responses remain identical. New fields only appear when new request shapes are used.
- **Feature flags not needed:** Additive-only changes mean old and new code paths coexist safely.
- **Observability before shipping:** `inventory_adjustments` table must be in place before any receiving UI goes live, otherwise audit history gaps occur.

---

## 10. APPROVAL & NEXT STEPS

This plan is ready for implementation. The user should review and then **toggle to Act mode** to begin implementation. Recommended starting point: Phase 1 (Domain & Schema).
