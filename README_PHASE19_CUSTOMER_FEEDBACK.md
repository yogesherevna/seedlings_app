# Phase 19 — Customer Feedback

## Scope
Connect the existing Customer Feedback screen to the shared Firebase `feedback` collection.

## Implemented
- 1–5 star rating.
- Required feedback comment, max 1000 characters.
- Optional order association from the customer's own existing orders.
- Optional product association from the selected order's item snapshot.
- Writes only the existing `feedback` collection.
- Stores `customerId`, optional `orderId`/`productId`, `rating`, `comment`, `images: []`, `status: "new"`, and timestamps.
- Loads the customer's previous feedback from the same collection.
- Pull-to-refresh, loading, empty and error states.
- No public product-review behavior is introduced.

## Security
The mobile client sends the customer mobile as the business identity, but Firestore Security Rules remain responsible for enforcing ownership. The app does not write wallet, payment, order status, subscription status, or other privileged business fields.

If the current Firebase rules do not permit customer feedback creation, submission will fail visibly rather than pretending it succeeded. Rules should allow only authenticated customers to create feedback for themselves and should prevent changing another customer's `customerId` or privileged fields.

## Not included
- Feedback images upload.
- Admin moderation UI.
- Public product reviews.
- Rating aggregation.
- New collection or Website/Admin API.

## Validation
Dependencies were not installed in this environment, so a full TypeScript check was not claimed.

## Commit
`feat(mobile): implement customer feedback`
