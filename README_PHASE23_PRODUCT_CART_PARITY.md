# Phase 23 — Customer Product + Cart Parity

This phase aligns the Mobile Customer product catalogue, product detail, and cart with the actual Website Phase 19 implementation.

## Website reference used

The implementation was compared against the uploaded Website Phase 19 source, specifically:
- `lib/salesProducts.ts`
- `lib/cart.ts`
- `components/CatalogueHydrator.tsx`
- `components/CartHydrator.tsx`

## Changes

### Products
- Firebase `salesProducts` remains the only business-data source.
- Active salable products are displayed as individual catalogue records, matching the Website.
- Removed the Mobile-only product-family/variant grouping introduced in Phase 21.
- Removed Mobile-only `saleOptions` grouping.
- Product weight is only a display value derived from that salable product's own component; it is not a cross-product variant selector.
- Category, mood/moods, tags, MRP, selling price, image, stock, purchase flags and salable-product identity are read from `salesProducts`.
- SQLite remains cache/offline fallback only.
- Catalogue screens use cached data first and perform a background Firebase refresh, matching the Website's cache-first/background-refresh pattern.
- No hardcoded product names, prices, weights, product counts or variants.

### Product detail
- Matches the Website purchase model:
  - One-time purchase
  - Subscribe, when the actual salable product is subscription eligible
- One-time purchase supports quantity and adds the actual salable product to cart.
- Subscribe loads the existing active subscription plans and passes the selected product, plan and quantity to the existing subscription screen.
- Removed the Mobile-only 100g/200g/etc family selector.
- No invented product option IDs.

### Cart
- One cart row represents one actual salable product, matching the Website cart identity.
- Quantity controls and removal operate by salable product ID.
- Current `salesProducts` pricing is refreshed before displaying the cart when available, so stale cached price/MRP metadata is not treated as authoritative.
- MRP, sale price and savings match Website calculations.
- Removed the hardcoded ₹40 delivery amount from Cart.
- Cart now displays that delivery charges are calculated during checkout, as in the Website.
- Subscription-eligible products expose the Website's per-product purchase choice:
  - One-time purchase
  - Subscribe
  - Active subscription plan selection
  - Continue with subscription
- Purchase mode and selected subscription plan persist with the existing local cart item.
- Legacy Phase 21 cart rows that used multiple derived-weight keys are consolidated to one row per actual salable product on load.

## Intentionally not changed

This phase does not implement checkout, availability/harvest-shortage validation, delivery charges, payment processing, order creation, order status, or subscription backend behaviour. Those are Phase 24/25 scope.

## Firebase collections

No new collection is introduced. Existing `salesProducts` and `subscriptionPlans` are reused.

## Environment / repository

- `.git` is preserved.
- `.env` and `.env.local` are excluded from the release archive.
- No Website/Admin API is introduced.

## Validation

- `git diff --check` passes.
- Typecheck was not run because dependencies/node_modules are not installed in the working source.
