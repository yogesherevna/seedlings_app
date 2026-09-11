# Seedlings Mobile — Phase 16: Customer Subscription Delivery Calendar

## Scope
Phase 16 adds a read-only delivery calendar for the Customer app, aligned with the existing website subscription presentation.

## Added
- New Customer route: `app/(customer)/account/delivery-calendar.tsx`
- View Delivery Calendar action from My Subscriptions.
- Reads existing `subscriptions` records only.
- Uses subscription `startDate`, `endDate`, `totalDeliveries`, `deliveriesGenerated`, `nextDeliveryDate` and the existing Saturday delivery schedule.
- Shows each scheduled Saturday as Delivered, Next, or Scheduled.
- Handles missing dates or subscription data without inventing a backend record.

## Important
- No new Firebase collection.
- No direct writes to subscriptions or delivery records.
- No Website/Admin API.
- Calendar is read-only in this phase.
- Actual delivery generation/assignment remains a trusted backend/admin operation.
