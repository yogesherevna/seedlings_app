# Phase 25 — Customer Orders + Subscription Parity

Based on the actual Website Phase 19 customer flow. This phase aligns Mobile Orders and Subscriptions with the Website behavior and shared Firebase order/subscription contract.

## Orders
- Customer order creation now uses the Website order item contract: salableProductId, salableProductSku, salableProductType, productId, productName, productSlug, sellingOptionId, sellingOptionLabel, weightGrams, quantity, mrp, unitPrice, lineTotal, imageUrl.
- Initial one-time order status is `pending_payment`, matching Website Phase 19.
- Payment remains `pending` and `online` because the Website has no connected gateway.
- Website order number format `ORD-...` is used.
- Removed Mobile-only order fields from new one-time order writes.
- Existing customer-specific Firestore order loading remains unchanged.
- My Orders now matches Website filters: All, One Time, Subscription, Past.
- Order list now shows product summary, amount, order date, delivery date, order type, status, and opens the real order detail.

## Subscriptions
- Subscription screen now follows Website Phase 19 flow.
- A product is selected from the Product Detail Subscribe action; Mobile no longer silently selects the first eligible product.
- Plan selection can be passed from Product Detail/Cart.
- Customer selects a delivery address.
- Customer enters quantity per delivery.
- Customer can enter the subscription start date.
- Availability is checked for the Website delivery date before creation.
- Website-equivalent harvest shortage confirmation is shown when required.
- Existing trusted callable subscription mutation boundary is retained; Mobile does not directly write subscription records.
- Pause, resume, cancel, active subscription summary and delivery calendar remain available.

## Scope
No wallet, notifications, feedback, new Firebase collections, payment gateway, or unrelated features were added.

## Verification
- `git diff --check` must pass.
- TypeScript typecheck is not claimed unless dependencies are installed and the command completes successfully.
