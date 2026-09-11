# Seedlings Mobile — Phase 5: Salable Products + SQLite Cache

## Scope
- Replace the local demo product catalogue with the shared `salesProducts` Firestore collection.
- Mobile owns the product service; it does not call Website or Admin services/APIs.
- Cache active salable products in the existing local SQLite database.
- Use a 30-minute cache TTL. Fresh cache is served without a network request.
- Stale/missing cache refreshes from Firebase and updates SQLite.
- If refresh fails and stale products exist, stale cached products remain usable.
- Product detail and Home/Products screens consume the same Mobile product service.
- Existing cart remains SQLite-persistent and receives the normalized product snapshot.

## Product mapping
The existing Admin salable-product contract is respected: `salesProducts` contains fields such as `name`, `sku`, `description`, `imageUrl`, `type`, `components`, `sellingPrice`, `oneTimePurchase`, `subscriptionPurchase`, `active`, `featured`, and `sortOrder`.

For the current mobile UI, pack weight is derived from the total grams of the salable product's components. This does not create or modify any Firebase product data.

## Cache
SQLite table: `product_cache`

- `product_id`
- `product_json`
- `fetched_at`

Firebase remains the source of truth. Checkout-time authoritative price/availability validation is intentionally a later phase.

## Verification
Dependency installation/typecheck may need to be run in the developer environment if `node_modules` is not present.
