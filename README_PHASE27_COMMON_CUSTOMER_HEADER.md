# Phase 27 — Common Customer App Header & Fixed Navigation

Based on the verified Phase 26 customer app parity source.

## Scope
- Add one common authenticated customer header at the `(customer)` layout level.
- Keep the header fixed while screen content scrolls.
- Keep the bottom tab navigation fixed.
- Show the logged-in customer's saved delivery address in the header.
- Keep login/OTP outside the authenticated customer shell.
- Preserve existing customer product, cart, checkout, order, and subscription behaviour.
- Fix the authenticated customer mobile reference used by Orders, Order Detail, and Subscriptions (`state.mobile`).

## Important regression fix
The common-header phase must retain the Orders screen fix from the previous phase. The Zustand store field is `mobile`, not `customerMobile`. Orders, Order Detail, and Subscriptions now read `useAppStore((s) => s.mobile)`.

## Not in scope
- No CMS pages.
- No Website marketing pages.
- No Firebase schema changes.
- No changes to order business logic.
- No new product/payment/subscription functionality.
