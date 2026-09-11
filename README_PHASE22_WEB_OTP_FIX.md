# Phase 22 — Web OTP / Local Persistence Fix

## Problem fixed

Customer OTP verification on Expo Web could fail with:

`ReferenceError: SharedArrayBuffer is not defined`

The failure occurred because `persistCustomerSession()` opened `expo-sqlite` synchronously in the browser. The Expo SQLite web implementation can require SharedArrayBuffer/WASM support that is not available in every Expo web/dev-server environment.

## Solution

- Native Android/iOS continues to use `expo-sqlite`.
- Expo Web uses a small localStorage-backed adapter implementing the existing synchronous persistence contract used by the app.
- Customer session, product cache, and cart persistence therefore continue to work on web without opening Expo SQLite.
- Firebase remains the source of truth for all remote business data.
- No Website/Admin API was introduced.
- Removed the previous COOP/COEP and WASM Metro workaround because the web build no longer needs Expo SQLite.

## OTP input

The existing Phase 22 OTP UX remains:

- Focus first box on screen entry.
- Typing a digit advances to the next box.
- Pasting multiple digits fills subsequent boxes.
- Backspace from an empty box moves to the previous box.
- OTP remains the existing demo value `1234`.

## Verification

After replacing the source, restart the already-running Expo dev server once because Metro/app configuration changed previously.

Then verify on Web:

1. Login with a valid 10-digit customer mobile.
2. Enter `1`, `2`, `3`, `4` in sequence.
3. Confirm the cursor advances automatically.
4. Press Verify.
5. Confirm no `SharedArrayBuffer` / `NativeDatabase` error appears.
6. Reload the page and confirm the customer session can still be restored locally.

Do not claim TypeScript passed unless dependencies are installed and `npm run typecheck` actually succeeds.
