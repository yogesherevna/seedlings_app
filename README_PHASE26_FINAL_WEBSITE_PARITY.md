# Phase 26 — Final Customer App Scope Cleanup + Website Parity QA Preparation

This phase is based on the supplied Website Phase 19 source and the Mobile Phase 25 source.

## Scope rule

The Website is the reference for **customer business functionality and data flow**. The Mobile app is not a copy of the Website's marketing/CMS pages.

## Included
- Keep the customer app's existing transactional/account destinations that correspond to the Website customer flow:
  - Home
  - Products
  - Cart
  - Orders
  - Profile
  - Addresses
  - Subscriptions
  - Delivery Calendar
- Keep the Website-backed catalogue category and mood filtering where those product fields are present.
- Keep the customer profile's existing `preferredDeliveryDay` value because it is part of the Website customer profile data.
- Remove the Phase 26-added Mobile CMS pages for `Our Journey` and `Contact`.
- Remove the Mobile CMS service that existed only to support those incorrectly added pages/Home CMS mirroring.
- Do not add Website CMS/marketing pages to the Mobile app.

## Explicitly not added
- Website hero/CMS pages copied into Mobile
- Our Journey page
- Contact CMS page
- CMS testimonials/FAQ/trust-point pages
- Wallet parity
- Notifications parity
- Feedback parity
- Any new Firebase collection
- Any new payment gateway

## Verification
- No remaining app/service references to the removed Phase 26 CMS service/pages.
- `git diff --check` should pass.
- TypeScript typecheck is not claimed when project dependencies are unavailable.
