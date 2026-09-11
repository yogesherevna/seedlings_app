# Phase 20 — Customer App Folder Structure

- Reorganized the existing customer routes under the Expo Router `(customer)` route group.
- Customer UI and route files are now isolated from future Delivery and Admin route groups.
- Existing customer login UI and OTP flow were intentionally not redesigned or behaviorally changed.
- Route group `(customer)` does not add `customer` to URLs.
- No Firebase collections or authentication behavior were changed.
- `.git` is preserved; `.env.local` is excluded from the release ZIP.
