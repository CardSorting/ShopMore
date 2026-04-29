# Product Management & Intake Metadata

This page documents the verified backend and admin UI product-management shape for manufacturer/wholesaler intake data.

## Verified product domain shape

`src/domain/models.ts` defines `Product` with these optional intake and pricing metadata fields in addition to the existing catalog fields:

- `compareAtPrice?: number` — cents.
- `cost?: number` — cents paid to manufacturer, wholesaler, or supplier.
- `sku?: string` — store stock keeping unit.
- `manufacturer?: string` — manufacturer or brand source.
- `supplier?: string` — wholesaler, distributor, or intake source.
- `manufacturerSku?: string` — vendor/manufacturer catalog identifier.
- `barcode?: string` — barcode or UPC-style scan code.

`ProductCategory` is still a controlled Domain union and now includes the original categories plus additional operational categories: `elite_trainer_box`, `sealed_case`, `graded_card`, `supplies`, and `other`.

## Verified domain validation

`src/domain/rules.ts` remains pure and validates product intake metadata without I/O:

- `SKU` and `manufacturerSku` are optional but cannot be blank when provided and are capped by `MAX_PRODUCT_SKU_LENGTH`.
- `barcode` is optional but cannot be blank when provided and is capped by `MAX_PRODUCT_BARCODE_LENGTH`.
- `manufacturer` and `supplier` are optional but cannot be blank when provided and are capped by `MAX_PRODUCT_PARTNER_FIELD_LENGTH`.
- `cost` and `compareAtPrice` are optional non-negative whole-number cent values and share the product price maximum.
- Product draft/update validation accepts the expanded category set.

## Verified SQLite persistence

`src/infrastructure/sqlite/schema.ts` adds nullable columns for `compareAtPrice`, `cost`, `sku`, `manufacturer`, `supplier`, `manufacturerSku`, and `barcode` to `ProductTable`.

`src/infrastructure/sqlite/database.ts` creates those columns for new databases and applies additive `ALTER TABLE products ADD COLUMN ...` migrations for existing SQLite catalogs. It also creates indexes for product management lookups:

- `idx_products_sku_unique` on `products.sku`, unique.
- `idx_products_supplier` on `products.supplier`.
- `idx_products_manufacturer` on `products.manufacturer`.

## Verified repository behavior

`src/infrastructure/repositories/sqlite/SQLiteProductRepository.ts` maps the new nullable columns into optional Domain `Product` fields, persists them on create, whitelists them on update, and includes `sku`, `manufacturer`, `supplier`, `manufacturerSku`, and `barcode` in product search for both SQL fallback and in-memory catalog index paths.

Duplicate SKU writes are translated into `InvalidProductError('SKU must be unique')` when SQLite reports the SKU unique constraint through either the index name or `products.sku` constraint message.

## Verified API boundary behavior

`src/infrastructure/server/apiGuards.ts` parses product create/update transport payloads for the intake fields before Core product orchestration. Optional integer cent fields are handled through `optionalInteger()` and optional text fields through `optionalString()`.

`src/app/api/products/route.ts` forwards the public/admin product-list `query` parameter into Core product retrieval, enabling backend SKU/supplier/manufacturer search through the existing product-service flow.

## Verified Core orchestration

`src/core/ProductService.ts` still validates product drafts/updates through Domain rules before repository writes. Product creation audit details now include `sku`, `manufacturer`, and `supplier` when present.

## Verified admin UI management

`src/ui/pages/admin/AdminProductForm.tsx` now binds and submits product intake metadata:

- SKU.
- Barcode / UPC.
- Unit cost.
- Compare-at price.
- Manufacturer.
- Wholesaler / supplier.
- Manufacturer SKU.

The form loads the same metadata when editing existing products and sends cent-based `cost` / `compareAtPrice` values through the existing product service client.

`src/ui/pages/admin/AdminProducts.tsx` now exposes expanded category tabs, forwards product search to the backend, searches visible products by SKU/supplier/manufacturer/manufacturer SKU/barcode, and displays SKU/supplier intake details in list/grid cards.

`src/utils/formatters.ts::humanizeCategory()` now humanizes underscore-delimited category ids, so values such as `elite_trainer_box` render as `Elite Trainer Box`.

## Verification evidence

The product-intake implementation was verified with:

```bash
CI=1 npm run lint && CI=1 npm run build
```

The command completed successfully after the final product-management changes. The production build compiled successfully, completed TypeScript validation, generated static pages, and listed `/api/products`, `/api/products/[id]`, `/admin/products`, `/admin/products/new`, and `/admin/products/[id]/edit` routes.
