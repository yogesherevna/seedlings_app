# Seedlings Mobile — Phase 18: Customer Notifications

Based on Phase 17 Customer Wallet.

## Scope
- Replace the hardcoded notification card with real customer-specific notifications from the existing `notifications` Firestore collection.
- Read-only notification inbox.
- Loading, error, empty and pull-to-refresh states.
- Display title, message, read/new state and timestamp when present.
- Supports common existing notification field names without changing the Firestore schema.

## Security
The mobile customer app only reads notifications addressed to the authenticated customer's normalized mobile identifier through `customerId`.
It does not create, delete, edit, or mark notifications as read.

## Not included
- Push notification registration or token management.
- New notification collection/schema.
- Notification writes.
- Website/Admin API.

## Commit
`9c5a8f1 feat(mobile): connect customer notifications`
