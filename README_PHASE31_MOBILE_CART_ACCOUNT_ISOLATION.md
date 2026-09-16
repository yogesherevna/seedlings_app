# Phase 31 — Mobile Cart Account Isolation

## Reference
- Approved Website UAT baseline: Website Phase 18 / Website Phase 16 cart account-scoping implementation
- Starting Mobile source: Mobile Phase 30

## Implemented
- Mobile cart persistence is now account-scoped using the existing local SQLite/Web persistence layer.
- Guest cart scope is isolated from authenticated customer carts.
- Authenticated customer cart scope is keyed by normalized customer mobile number.
- One-time entries remain independently keyed by product.
- Subscription entries remain independently keyed by product + plan + start date.
- The same product can exist independently in one-time and subscription sections.
- Guest cart is merged into the authenticated customer's cart during login, using the same merge identities as the Website.
- Existing customer cart is preserved when the customer logs out.
- Logging into a different customer loads only that customer's cart; the previous customer's cart is not exposed.
- Logging back into the original customer restores that customer's previously persisted cart.
- Logout no longer deletes the persisted account cart.
- `clearCart` clears only the currently active scope.
- Product refresh writes back only to the currently active cart scope.
- Legacy Phase 30 unscoped cart rows are migrated exactly once to the active scope so local cart data is not silently discarded.
- No Firebase cart collection, API, or remote cart schema was introduced.
- SQLite database version advanced to 5; the existing `cart_items` schema remains unchanged.

## Hydration / session order
- Root startup now hydrates the customer session first.
- Cart hydration then uses the correct customer or guest scope.
- Login explicitly merges guest cart into the customer scope before entering the authenticated shell.
- This prevents the previous race where cart hydration could occur before session restoration and load a shared cart.

## Boundary
- This phase changes cart persistence/isolation only.
- Mixed checkout creation remains the Phase 33 scope.
- No payment, order, subscription, availability, delivery-charge, or Firebase business rules were changed.

## Validation
- `git diff --check`: PASS
- `.git` preserved in the output ZIP.
- No `node_modules`, build output, or environment secrets included.
- Full TypeScript validation depends on the project's installed Expo/React Native dependencies, which are not present in the supplied source ZIP.
