# Seedlings Microgreens Mobile — Phase 12

## Customer Payment Foundation

This phase builds the customer-side payment foundation without pretending that a payment gateway is connected.

### Included
- Central payment method/status types in `services/payments/paymentService.ts`.
- Checkout clearly shows that the payment gateway is not configured yet.
- Orders continue to use the existing `orders` collection and remain `paymentStatus: pending` until a trusted payment flow records the result.
- Order details display payment status and transaction id when present.
- Added a transaction-ready `paymentTransactions` type for reading future transaction history.

### Important security rule
The mobile client does **not** mark an order paid, write a successful payment transaction, or change financial status. Final payment results must come from a trusted gateway/webhook/server-side mechanism.

### Not included
- Razorpay/Stripe/etc. integration — no provider has been finalized.
- Fake/simulated successful payments.
- Client-side manipulation of payment status.
- Wallet debit/credit logic.

### Existing data reused
- `orders`
- existing order payment fields
- future `paymentTransactions` data can be consumed without creating a duplicate order/payment model.

## Regenerated correction
- Added the optional `transactionId` field to the mobile `CustomerOrder` type because order details already supports displaying a trusted transaction id when present.
- No payment gateway was added or assumed.
