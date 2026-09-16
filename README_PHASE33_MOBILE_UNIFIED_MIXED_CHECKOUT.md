# Mobile Phase 33 — Unified Mixed Checkout Parity

## Source

- Mobile source: `UAT_FIX_PHASE_32_MOBILE_DELIVERY_CHARGE_PARITY.zip`
- Website reference: `UAT_FIX_PHASE_18_WEBSITE_PRODUCTION_READINESS(1).zip`
- Website mixed-checkout reference: `lib/customerMixedCheckout.ts`

## Implemented

Phase 33 removes the Phase 30/32 subscription-checkout boundary and implements the Website's unified mixed checkout flow natively in the Expo/React Native app.

### Cart types supported together

- One-time purchases only
- Subscription purchases only
- Mixed one-time + subscription purchases in the same checkout
- One-time and subscription entries for the same product remain independent cart entries
- Multiple subscription entries remain independent by product + plan + start date

### Checkout validation

The mobile checkout validates the selected customer account, selected saved address, delivery slot, active products, active subscription plans, subscription frequency, production-product component and pack quantity before writing orders.

### Availability

The existing Mobile/Website availability calculation is reused for:

- One-time items on next-week Saturday
- Subscription items on their selected subscription start date
- Production harvest
- Existing active subscription commitments
- Scheduled one-time commitments
- Harvest shortage confirmation before final write

### Delivery charges

Phase 32's Website-parity delivery calculation is used for the complete mixed cart:

- One-time delivery charge once per one-time order
- Subscription delivery charge once per subscription delivery
- Pincode Geolocation Master precedence
- Delivery Charges Master fallback
- Subscription plan delivery reduction/free delivery
- Delivery snapshots stored on created orders/subscriptions

### Atomic creation

A single Firestore `writeBatch` creates the complete checkout result:

- One one-time order when one-time items exist
- One subscription document per subscription cart entry
- One initial subscription order per subscription document

The batch is committed only after all validation, availability and delivery-charge calculations succeed.

### Order contracts

The created one-time and subscription orders follow the Website mixed-checkout document fields, including:

- customer information
- delivery address
- scheduled delivery date
- order type
- payment status/method
- delivery fee and delivery-charge snapshots
- availability fields
- subscription relationship fields for subscription orders

### Post-checkout

After a successful batch commit:

- The active account's unified local cart is cleared.
- The existing native checkout success screen is shown.
- The primary created order is used for the success-screen navigation while all created orders remain available through My Orders.

## Not changed

- No new Firebase collections.
- No payment gateway integration was invented or added.
- No Website marketing/CMS pages were added to Mobile.
- Existing account-scoped cart persistence from Phase 31 remains.
- Existing delivery-charge rules from Phase 32 remain the source for checkout calculation.

## Important parity note

The implementation follows the actual Website `lib/customerMixedCheckout.ts` contract rather than creating a new Mobile-specific order schema.
