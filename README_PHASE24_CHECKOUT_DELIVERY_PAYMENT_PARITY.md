# Phase 24 — Customer Checkout + Delivery + Payment Parity

This phase aligns the Mobile Customer checkout with the actual Website Phase 19 checkout flow. It is based on the uploaded Website Phase 19 source, not on a new delivery/payment design.

## Implemented

### Checkout
- Real Firebase customer addresses remain selectable.
- Checkout requires a saved delivery address.
- Checkout uses the Website's next-week Saturday delivery date rule.
- Delivery slot presentation matches the Website's two current customer choices:
  - Saturday morning
  - Saturday evening
- No `deliverySlots` collection is used for this Website-parity checkout flow.

### Availability / harvest shortage
- Added the Website-equivalent `checkProductAvailability` calculation to Mobile.
- Availability checks production stock, eligible growing-batch yield, active subscription commitments, and scheduled one-time orders.
- Availability is checked against the next-week Saturday delivery date before order placement.
- When a shortage exists, Mobile shows a native confirmation equivalent to the Website dialog:
  - Yes, continue
  - No, contact me
- The selected shortage decision is passed into order creation.

### Delivery charge
- Mobile now reads the existing `deliveryCharges` collection.
- Only active charges with `scope == one_time_order` are considered.
- Multiple active one-time charges are rejected, matching the Website order service.
- The Mobile Cart/Checkout no longer invents or hardcodes ₹40.
- Checkout displays delivery as `Calculated on order`, matching Website presentation.
- The selected delivery slot ID is no longer used as a delivery charge ID.

### Payment
- Mobile now matches Website's current payment UI:
  - Online payment
- No UPI/Card/Wallet selection is presented as an active gateway flow.
- Because the Website gateway is not connected, Mobile keeps the same Pending-payment explanation.
- No fake payment success or client-side payment result is introduced.

### Order creation integration
- The existing Mobile order creation now receives the Website-parity delivery slot string and calculates the authoritative one-time delivery charge from Firebase before saving the order.
- Availability is revalidated inside order creation as well as before the UI submission, preventing the UI check from being the only guard.
- Existing order-schema differences are intentionally left for Phase 25 (Orders + Subscription Parity).

## Not changed in Phase 24

- Product/cart model from Phase 23.
- Canonical order item/schema alignment — Phase 25.
- Initial order status alignment — Phase 25.
- My Orders filters/layout — Phase 25.
- Subscription flow parity — Phase 25.
- Wallet, notifications, feedback — not Website Phase 19 parity requirements.

## Validation

- `.git` preserved.
- `.env` and `.env.local` excluded.
- `git diff --check` should be run before packaging.
- TypeScript typecheck cannot be claimed unless dependencies are installed and the project typecheck is actually executed.
