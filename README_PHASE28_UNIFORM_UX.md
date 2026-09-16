# Phase 28 — Uniform Customer UX

This phase establishes a single visual system across the customer mobile app while preserving existing Firebase, cart, checkout, orders, subscriptions, wallet, notifications and feedback logic.

## Visual system
- Seedlings character-derived palette: deep leaf green, fresh green, warm orange, earthy brown, cream/paper and white.
- Shared typography tokens with a System font family and consistent display/body/caption sizing.
- Shared spacing and corner-radius tokens.
- Common card, button, search, chip, empty-state and product-card styling in `components/UI.tsx`.

## Navigation
- Fixed common customer header retained.
- Consistent bottom navigation icons, labels and active state.
- Cart badge shows current item quantity.

## Catalogue/Home
- Consistent page title and section hierarchy.
- Search bar with icon and clear action.
- Consistent filter chips.
- Product cards use consistent image area, pricing, MRP, savings, stock state and add-to-cart action.
- Home hero and quick-action cards use the same Seedlings palette and spacing system.
- Customer greeting added to Home when a profile name is available.

## Scope
No new Firestore collections, APIs, payment gateway, or business rules were introduced.

## Verification
`git diff --check` passed.
TypeScript typecheck was not run because this source package does not contain `node_modules`.
