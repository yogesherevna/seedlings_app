# Phase 21 — Customer Product Catalogue Integrity

## Purpose

Remove remaining static/demo product behaviour and make the Customer Mobile catalogue consistently driven by the existing Firebase `salesProducts` collection.

## Changes

- Active products are loaded from `salesProducts`.
- Firebase is the source of truth whenever reachable; SQLite is an offline/stale fallback.
- A successful Firebase refresh fully replaces the SQLite product cache, preventing removed/old products from lingering.
- No hardcoded product names, prices, weights, or catalogue counts are used.
- Single-product salable records sharing the same production-product component are exposed as Product Detail weight/sale options.
- Each sale option retains its own salable document id, price, MRP, image, and packed-stock availability.
- Selecting 100g/200g/etc. changes the actual salable product used when adding to cart.
- Order creation continues to validate the selected salable product against the current Firebase record.
- Static product data and generated product-image map were removed. Product images come from the salable product `imageUrl`; a neutral placeholder is used only when no image URL exists.
- Home delivery address display now uses the signed-in customer's first/default saved address instead of a hardcoded Pune address.
- Existing Firebase collections and customer architecture are unchanged.

## Important

The current Admin `salesProducts` schema represents each salable record with its component quantity and price. Phase 21 does not invent a new variants collection. Weight/sale options are derived from those existing salable records.

## Verification

`npm run typecheck` was attempted, but the extracted source does not have its npm dependencies installed. TypeScript therefore reports environment/module-resolution errors (`expo-router`, `react-native`, `firebase`, missing Expo base tsconfig, etc.). No dependency installation was performed as part of this phase.

## Commit

`feat(mobile): harden customer product catalogue integrity`
