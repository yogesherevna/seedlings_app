# Seedlings Mobile — Phase 2: Customer Authentication & Session

## Scope
- Hardened the existing Customer login/session flow without changing the visible login workflow.
- Preserved 10-digit Indian mobile + static development OTP `1234` + 60-second OTP timer.
- Customer onboarding continues to use the Mobile-owned `services/clientOnboarding.ts` service.
- Added persistent Customer session state in the existing SQLite database.
- Restores the logged-in customer after app restart.
- Re-establishes anonymous Firebase Auth when restoring a stored session.
- Validates the stored customer document when connectivity is available.
- Treats blocked customer records as logged out.
- Logout clears the local Customer session, cart, and Firebase anonymous auth session.
- Splash routing now waits for session restoration before choosing Login vs Customer tabs.

## Architecture boundary
- Mobile uses its own authentication/session service.
- No Website API/service is imported or called.
- No Admin API/service is imported or called.
- Firebase remains the shared backend/source of truth.
- SQLite is local persistence only.

## SQLite
The existing `app_meta` table stores:
- `database_version`
- `customer_mobile`

The SQLite database version is now `2`.

## Validation
- The environment did not have installed project dependencies after extracting the ZIP, so `npm run typecheck` could not perform a meaningful project check. It reports missing installed modules/Expo base configuration rather than project-level TypeScript diagnostics.
- No package dependency was added in this phase.
