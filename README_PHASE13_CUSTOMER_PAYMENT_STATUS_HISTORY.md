# Seedlings Microgreens Mobile — Phase 13

## Customer Payment Status & Transaction History

Phase 13 continues from Phase 12 without introducing or assuming a payment gateway.

### Included
- Customer order details now show trusted `paymentTransactions` already present on the order.
- Each transaction can display method, amount, status, transaction id, and recorded time when those fields exist.
- Existing order-level payment status and transaction id remain visible.
- Payment status is presentation-only on the mobile client.

### Security / scope
- No client-side payment success/failure writes.
- No fake gateway, Razorpay, Stripe, UPI intent, card SDK, or wallet debit.
- No new Firebase collection.
- Mobile reads payment information from the existing order data and does not call the website or Admin API.
- A future trusted payment provider/backend can populate payment results; this phase will display them without changing their source of truth.

### Existing data reused
- `orders.paymentStatus`
- `orders.paymentMethod`
- `orders.transactionId`
- `orders.paymentTransactions[]` when present

### Commit
`feat(mobile): show customer payment transaction history`
