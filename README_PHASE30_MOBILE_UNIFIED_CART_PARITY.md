# Phase 30 — Mobile Unified Cart Parity

## Reference
- Approved Website UAT baseline: Website Phase 18
- Starting Mobile source: Mobile Phase 29

## Implemented
- Replaced the previous single product/purchase-mode cart representation with an explicit unified cart:
  - `oneTimeItems[]`
  - `subscriptionItems[]`
- One-time cart entries are keyed independently by salable product.
- Subscription entries are keyed by product + subscription plan + start date.
- The same product can exist simultaneously as a one-time purchase and as one or more subscription entries.
- Multiple subscriptions for the same product are supported when plan/start-date combinations differ.
- Matching subscription entries merge quantity when product, plan, and start date are identical.
- Subscription price is stored from the selected subscription plan, matching the Website cart contract.
- Cart quantities and removal operate independently for one-time and subscription entries.
- Cart badge counts both one-time and subscription quantities.
- Cart UI is split into `Subscriptions` and `One-time Purchases`, matching the Website cart structure.
- Product Detail subscription submission now adds the selected subscription configuration to the unified cart instead of directly creating a subscription.
- Existing local SQLite persistence remains the storage mechanism; no Firebase collection or API was introduced.
- Database version was advanced to 4; the existing `cart_items` table remains compatible because `cart_key` already supports the required independent entries.

## Boundary
Mixed checkout creation is not implemented in Phase 30. It remains the Phase 33 scope. The checkout screen therefore does not submit subscription entries yet. No business rule was invented to create or mutate a subscription prematurely.

## Legacy data handling
Legacy cart rows are read from the existing table. A legacy subscription-mode row is accepted only when the Website-required `planId` and `startDate` are present; incomplete legacy subscription rows are not converted by inventing missing values.

## Validation
- `git diff --check`: PASS
- ZIP includes `.git`
- No `node_modules`, build output, or environment secrets added
- Full TypeScript validation requires the project's installed Expo/React Native dependencies, which are not present in the supplied source ZIP.
