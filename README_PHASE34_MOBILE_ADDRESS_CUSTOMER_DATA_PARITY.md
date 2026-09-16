# Mobile Phase 34 — Address & Customer Data Parity

## Source

- Mobile source: `UAT_FIX_PHASE_33_MOBILE_UNIFIED_MIXED_CHECKOUT.zip`
- Website reference: `UAT_FIX_PHASE_18_WEBSITE_PRODUCTION_READINESS(1).zip`
- Website customer references: `lib/customerAccount.ts`, `components/ProfileHydrator.tsx`, `components/AddressHydrator.tsx`

## Implemented

### Customer profile data

- Mobile customer profile now follows the Website customer data contract for the fields already used by Mobile.
- `preferredDeliveryDay` / `deliveryDay` are recognized as customer data.
- Saturday remains the fixed delivery-day business rule; it is not turned into a customer-selectable preference.
- Profile updates persist `preferredDeliveryDay: "Saturday"` together with name/email.
- Customer profile data is cached locally with a 10-minute TTL.
- Cached profile data is shown immediately when available; Firebase remains the source of truth when cache is unavailable or incomplete.
- Cache is invalidated after profile updates.

### Address data

- Existing Add, Edit and Set Default workflows are retained.
- Added Delete Address workflow.
- Delete requires explicit native confirmation and states that the action cannot be undone.
- After deletion, the remaining address order is preserved; if the default address is deleted, the next remaining address becomes the first/default address, matching the Website's array-order contract.
- Address data is cached locally together with customer data and reused when available.
- Address changes update the local cache immediately after the Firebase write succeeds.

### Local persistence

- Added a local-only `customer_cache` table.
- SQLite database version increased from 5 to 6.
- Expo Web localStorage adapter supports the same cache contract.
- No new Firebase collections, documents, or APIs were introduced.

## Not changed

- Existing Firebase `customers/{mobile}` source of truth.
- Existing address schema.
- Existing checkout address selection and delivery-charge calculation.
- Existing orders, subscriptions, cart isolation, or mixed checkout logic.
- No Website pages or CMS functionality were added to Mobile.

## Validation

- `git diff --check` must pass.
- Full Expo TypeScript validation requires the project's installed Expo/React Native/Firebase dependencies; the source ZIP does not include `node_modules`.
