# Seedlings Mobile — Phase 15

## Customer Subscription Trusted Actions

Phase 15 extends Phase 14 with the mobile-side boundary for subscription creation and customer subscription status actions.

### Included
- Create Subscription action from the Customer app.
- Quantity per delivery input.
- Uses the selected existing `subscriptionPlans`, subscription-eligible `salesProducts`, and the customer's saved address.
- Pause / Resume / Cancel actions for the customer's active/paused subscription.
- All mutations go through Firebase callable functions:
  - `createCustomerSubscription`
  - `updateCustomerSubscription`
- The mobile client does **not** directly write `subscriptions` documents.
- The server-side callable functions are expected to validate customer ownership, plan/product eligibility, address ownership, pricing, and status transitions.
- No payment gateway is introduced.
- No payment status is changed by the mobile client.
- No new Firebase collection is introduced.

### Important deployment note
The callable function names are a backend contract. This mobile phase does not include a Cloud Functions project because the supplied mobile project contains no trusted subscription backend implementation. Until those callable functions are deployed in the shared Firebase project, the mutation buttons will return the Firebase callable-function error rather than pretending the subscription was created/updated.

### Website alignment
The existing website creates and changes subscriptions through its trusted server flow. Phase 15 preserves that security model rather than calling the website API from mobile or allowing direct client writes.

### Commit
`c9d8e44 feat(mobile): add trusted subscription actions boundary`
