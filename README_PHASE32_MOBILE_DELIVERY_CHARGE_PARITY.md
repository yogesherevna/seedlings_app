# Phase 32 — Mobile Delivery Charge Parity

## Reference
- Approved Website UAT baseline: Website Phase 18 / Phase 7 delivery-charge implementation.
- Starting Mobile source: Phase 31 Mobile Cart Account Isolation.

## Implemented
- Added the Website delivery-charge precedence to the native Mobile delivery calculation layer.
- Active `geolocations` matching the selected delivery pincode take priority.
- One-time checkout uses `oneTimeCharge` from the matching geolocation.
- Subscription delivery uses `subscriptionCharge` from the matching geolocation.
- When no matching active geolocation exists, the active `deliveryCharges` master is used by scope:
  - `one_time_order`
  - `subscription`
- Multiple active geolocations for the same pincode are rejected.
- Multiple active delivery masters for the same scope are rejected.
- If no fallback master exists, delivery is zero, matching the Website calculation layer.
- Subscription plan delivery rules are supported:
  - `free` / `included` => zero delivery.
  - `per_delivery` => lower of base delivery and plan delivery charge.
  - A subscription plan cannot increase the normal location/global subscription delivery charge.
- Subscription delivery charge is per delivery and is not multiplied by product quantity.
- Delivery savings are calculated and exposed in the result.
- Zero delivery is represented as `₹0 — FREE` in checkout.
- Checkout now calculates delivery from the selected address pincode instead of showing `Calculated on order` / a hardcoded value.
- One-time order creation reuses the same calculation layer and persists `deliveryChargeDetails` together with the numeric snapshot.
- Active subscription-plan metadata now carries delivery-charge mode/value into the native subscription cart so later unified checkout can calculate the same result.

## Boundary
- Phase 32 changes delivery-charge calculation and preview only.
- Unified mixed checkout creation remains Phase 33.
- No new Firebase collections, API, payment gateway, or delivery business rules were introduced.

## Validation
- `git diff --check`: PASS.
- `.git` is preserved in the output ZIP.
- Full TypeScript validation requires the project's installed Expo/React Native dependencies; the supplied source ZIP does not contain a complete usable dependency installation.
