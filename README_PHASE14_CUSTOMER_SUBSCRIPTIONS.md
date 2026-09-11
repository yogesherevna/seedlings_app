# Seedlings Microgreens Mobile — Phase 14

## Customer Subscription Plans & Subscription Visibility

Phase 14 replaces the previous hardcoded subscription demo with real shared Firebase subscription data.

### Included
- Reads active `subscriptionPlans` from Firestore.
- Keeps the website's currently configured customer frequencies: Monthly and Quarterly.
- Reads the logged-in customer's existing `subscriptions` records from Firestore.
- Displays active subscription, delivery count, remaining deliveries and next delivery date when available.
- Reads subscription-eligible `salesProducts` using the existing `subscriptionPurchase` flag.
- Adds a Subscription Plans entry point from subscription-eligible product details.
- Reads the customer's existing saved addresses for subscription setup context.
- No new Firebase collection.

### Security / architecture
- Mobile does not call the Website or Admin API.
- Mobile does not directly create, pause, resume or cancel subscriptions in this phase.
- This is intentional: the website uses a trusted server route for subscription mutations. The mobile client must not become authoritative for subscription state or financial values.
- Phase 15 can add the trusted subscription mutation path once the supported Firebase/server mechanism is defined.

### Website alignment
The website reads `subscriptionPlans`, `subscriptions`, the customer's addresses, and subscription-eligible `salesProducts`. Its configured customer plans are Monthly and Quarterly, and delivery is Saturday. Mobile now uses those same shared records rather than the old hardcoded Weekly/Monthly/Quarterly demo.

### Verification
- Source changes were audited locally.
- Full `npm run typecheck` was not run because project dependencies are not installed in this working environment.
- Use the already-running Expo application for visual verification; do not restart it unnecessarily.
