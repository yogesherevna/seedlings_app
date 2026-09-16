# Mobile Phase 35 — Final UAT & Production Readiness

## Source

- Mobile source: `UAT_FIX_PHASE_34_MOBILE_ADDRESS_CUSTOMER_DATA_PARITY.zip`
- Website reference: `UAT_FIX_PHASE_18_WEBSITE_PRODUCTION_READINESS(1).zip`

## Status

This is the **final planned Mobile Customer parity/UAT phase** in the current Phase 29–35 sequence.

It is a hardening phase only. It does not introduce new customer business functionality or new Firebase collections.

## Implemented

### 1. Root application hydration fix

- Removed the stale `hydrateCart` dependency from the root `useEffect` dependency array.
- Session hydration remains the single startup hydration entry point; it already restores the correctly account-scoped cart.
- Prevents a reference to an unavailable render-scope variable.

### 2. Production OTP safety

The current project intentionally has no real OTP provider configured.

- The static development OTP `1234` is now available only under Expo development mode (`__DEV__`).
- The development OTP is not displayed in production builds.
- Production login/verification is explicitly blocked until the real OTP verification flow is integrated.
- This prevents a production build from accepting a hardcoded OTP.
- The existing development/UAT flow remains usable with OTP `1234` when running in Expo development mode.

No OTP provider, SMS service, Firebase Phone Auth flow, or backend API was invented or added because no approved production OTP implementation exists in the supplied source/requirements.

### 3. Existing payment safety retained

- No fake payment gateway was added.
- `online` remains the established customer payment method.
- The existing checkout correctly communicates that gateway processing is not connected and the created order remains payment-pending.
- No client-side code marks payment as paid.

### 4. Final parity scope retained

The following phases remain included without changing their established business rules:

- Product/catalogue parity
- Product detail + subscription CTA
- Unified one-time/subscription cart
- Customer cart account isolation
- Website-parity delivery charges
- Unified mixed checkout
- Address + customer data parity
- Orders and order detail
- Subscriptions and delivery calendar
- Customer notifications, wallet and feedback screens already present in the app
- Common authenticated header and navigation

## Explicitly not changed

- Firebase collection model
- Existing customer address schema
- Harvest/availability rules
- Delivery-day rule (Saturday)
- Delivery charge precedence/calculation
- Order/subscription creation model
- Cart account isolation
- Payment status authority
- Website CMS/marketing pages
- Admin/Delivery application functionality

## Production prerequisites outside this parity phase

The Mobile Customer app is **final for the currently defined parity/UAT development sequence**, but this does not mean the entire platform is production-launch complete.

Before a real customer production release, the following externally dependent items still require their approved implementation/configuration:

1. Real customer OTP sending and verification.
2. Real payment gateway integration and trusted payment/webhook handling, if online payment is required for launch.
3. Production Firebase security rules/configuration and deployment verification.
4. Production EAS/app-store signing and release configuration.

These are launch prerequisites, not missing Mobile parity phases, and were deliberately not invented in Phase 35.

## Validation

- `git diff --check` passes.
- Full Expo TypeScript validation could not be completed because the supplied source ZIP intentionally excludes `node_modules`, and dependency installation timed out in the development environment.
- No hardcoded production OTP is exposed in the production UI.

## Commit

`feat(mobile): complete final customer uat hardening`
