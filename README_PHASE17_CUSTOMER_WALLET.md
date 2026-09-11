# Phase 17 — Customer Wallet

## Scope
- Replaced the hardcoded wallet balance and Welcome Reward demo transaction.
- Customer Wallet now reads the existing `walletTransactions` collection for the signed-in customer.
- Displays available balance when the trusted ledger provides a `balance` value.
- If no running balance is stored, derives a display balance only from recognizable settled credit/debit ledger entries.
- Displays recent transaction type, amount, description, reference and status when present.
- Pull-to-refresh and loading/error/empty states added.

## Security
- Customer wallet is read-only in this phase.
- No wallet credit/debit/top-up/refund action is exposed to the client.
- No direct wallet balance mutation is performed.
- Financial mutations remain a trusted backend responsibility.

## Data
- Existing `walletTransactions` collection only.
- No new Firebase collection.
- No Website/Admin API.

## Validation
- Full TypeScript check was not claimed because the development environment does not have the mobile dependencies installed.
