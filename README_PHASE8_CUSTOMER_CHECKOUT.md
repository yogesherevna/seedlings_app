# Seedlings Microgreens Mobile — Phase 8

## Customer Checkout

Implemented on top of Phase 7.

### Scope
- Real customer addresses loaded from `customers/{mobile}`.
- Address selection during checkout.
- Manage Addresses navigation.
- Checkout pricing summary using the existing local cart calculation.
- MRP, subtotal, savings, delivery and total display.
- Payment method selection for UPI, Card and Wallet.
- No hardcoded customer address, delivery date or wallet balance.
- Checkout validation for empty cart and missing delivery address.
- Standard delivery presentation without inventing a backend delivery-slot API.
- Mobile-owned implementation only; no Website/Admin service imports.
- Order creation is intentionally NOT implemented in Phase 8. It belongs to Phase 9.
- Checkout preview makes it clear that no order has been created yet.

### Data rules
- Customer addresses use the existing `customers/{10-digit-mobile}` document.
- Firebase remains the source of truth for addresses.
- Product/cart data comes from the existing Mobile product/cart services.
- Final product/price/delivery/payment validation and trusted order creation are Phase 9 work.
