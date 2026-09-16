# Phase 29 — Product & Product Detail Parity

## Basis
This phase was implemented by comparing the Phase 28 mobile source against the approved Website Phase 18 source.

## Implemented
- Preserved the Website Salable Product contract for `shortDescription` and `description` as separate fields.
- Preserved MRP and selling-price display, including strike-through MRP and savings.
- Product detail now uses the active-product + active-subscription-plan rule used by the approved Website product detail flow: the Subscribe action is available when the product is active and active subscription plans exist.
- Added the native mobile equivalent of the Website fixed bottom Subscribe CTA.
- Added a native bottom-sheet subscription selector with plan, quantity and start-date information.
- Product detail now displays the actual short description and full description content from the Salable Product instead of the previous hardcoded Product Info text.
- Product availability, purchase and delivery information remains customer-facing and native; no Website page is embedded or copied.

## Deliberate phase boundary
The selected subscription is currently handed to the existing approved native subscription screen/mutation boundary. Phase 30 will change this handoff to the unified native cart implementation required for Website mixed-cart parity. No temporary Firebase write or alternate backend was introduced here.

## No changes
- No new Firestore collections.
- No new APIs.
- No payment gateway.
- No Website/CMS pages.
- No change to harvest/availability business rules.
