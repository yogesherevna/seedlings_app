# Seedlings Mobile — Phase 7: Persistent Customer Cart

## Scope
- Customer cart is a local, persistent SQLite-backed user-controlled state.
- Cart is restored on app startup.
- Product + selected weight identifies a unique cart line.
- Quantity changes, additions, removals and clear-cart operations persist immediately.
- Cart displays MRP, selling price and savings when MRP is available.
- Cart totals include subtotal, delivery and total savings.
- Checkout now consumes the cart totals helper; final backend pricing validation remains Phase 8/9 scope.

## Architecture rules
- Mobile cart code is owned by the Mobile application.
- No Website or Admin service/API is imported or called.
- SQLite is local persistence; Firebase remains the source of truth for remote business data.
- Cart is not treated as a remote cache.
