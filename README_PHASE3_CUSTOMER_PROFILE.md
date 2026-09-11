# Seedlings Mobile — Phase 3: Customer Profile

## Scope

Phase 3 implements the real Customer Profile workflow on top of the Phase 2 customer authentication/session foundation.

### Implemented
- Mobile-owned `customerProfile` service.
- Reads `customers/{10-digit-mobile}` directly from Firebase.
- Displays the authenticated customer's mobile number, name and optional email.
- Allows the customer to edit name and email.
- Validates required name and optional email format.
- Updates the existing customer document and `updatedAt`.
- Profile screen now uses loading/error/saving states.
- Profile tab summary reads the real customer name instead of the previous hardcoded demo name.

### Architecture rules
- No Website service/API is imported or called.
- No Admin service/API is imported or called.
- Firebase remains the source of truth for profile data.
- Profile is intentionally not persisted as a long-lived SQLite cache; it is dynamic customer data and is fetched directly when needed.
- Existing login/OTP flow is unchanged.

## Verification
Run:

```bash
npm install
npm run typecheck
```

Then visually verify the already-running Expo application. Do not restart the development server unnecessarily.
