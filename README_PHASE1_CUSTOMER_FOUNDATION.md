# Seedlings Mobile — Phase 1: Customer Foundation

## Scope
- Mobile-owned Firebase/service boundary.
- SQLite foundation using `expo-sqlite` 57.0.2 (aligned with Expo SDK 57).
- Persistent local cart storage.
- Cart hydration on app startup.
- Variant-aware cart persistence/removal/quantity changes.
- No dependency on Website or Admin services/APIs.

## Data ownership
- Firebase remains the remote source of truth.
- SQLite is local persistence/cache only.
- This phase does not add product caching yet; that is Phase 5.

## Validation
- Source audit confirms the Customer app currently imports its own `services/clientOnboarding.ts` only for login onboarding and does not import Website/Admin services.
- `npm install` could not be completed in the execution environment because the package installation command timed out. Therefore a full TypeScript/build verification could not be run here.
- The package dependency is recorded as `expo-sqlite@57.0.2`, matching Expo SDK 57.
