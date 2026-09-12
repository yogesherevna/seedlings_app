# Phase 27 — Common Customer App Header & Fixed Navigation

## Scope

Create one common customer-app header at the `(customer)` layout level. The header is outside the individual page ScrollViews, so it remains fixed while page content scrolls. The existing Expo Router bottom tabs remain fixed as well.

## Behaviour

- One shared header for customer app screens.
- Header shows `Seedlings` and the current customer delivery address label.
- Address is loaded from the existing `customers/{mobile}.addresses` data through the existing customer address service.
- Customer tab root screens do not show a back button.
- Inner customer screens show a back button in the same common header.
- Login and OTP screens do not show the customer header.
- Home no longer owns a duplicate header/address block.
- Individual customer screens no longer render their own `Header`.
- No Firebase collection/schema changes.
- No product, cart, checkout, order, subscription, payment, or business-logic changes.

## Layout

```text
Customer Layout
├── Fixed common header
├── Expo Router screen content
│   └── individual page content may scroll
└── Fixed bottom tab navigation (for tab routes)
```

## Verification

`git diff --check` passed. TypeScript was not claimed because dependencies are not installed in the working source environment.
