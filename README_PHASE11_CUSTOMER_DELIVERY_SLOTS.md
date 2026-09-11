# Seedlings Microgreens Mobile — Phase 11

## Customer Delivery Slots

Implemented on top of Phase 10.

### Scope
- Added a mobile-owned delivery slot service reading the existing `deliverySlots` collection.
- Supports active slots, date/time labels, ordering and optional per-slot delivery charge.
- Checkout displays real configured slots when available.
- Customer must select a slot when slots are configured.
- If no active slots are configured, checkout keeps the existing Standard Delivery fallback so development/test orders are not blocked.
- Selected slot information is stored on the existing `orders` document (`deliverySlotId`, `scheduledDeliveryDate`, delivery-charge snapshot fields).
- No new delivery-slot collection is created.
- Customer login, product catalogue, cart, order creation and order history remain unchanged.

### Important
Final financial authorization and trusted delivery-charge validation should move to a trusted Firebase/server-side transaction layer before production payments. The mobile app is not treated as authoritative for financial rules.
