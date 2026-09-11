# Seedlings Microgreens Mobile — Customer MVP

This is the first development cut of the Seedlings Microgreens customer mobile application.

## Included

- Expo + React Native + TypeScript
- Expo Router navigation
- Zustand cart/auth state
- NativeWind configured
- Static mobile-number validation (10 digits)
- Static OTP validation (`1234`)
- Seedlings supplied logo used for splash/app icon
- Customer product catalogue driven by the existing Firebase `salesProducts` collection
- SQLite product cache with Firebase refresh and offline fallback
- Product weight/sale options derived from active salable-product records
- Home, Products, Product Detail, Cart, Checkout, Order Success, Orders
- Profile, Addresses, Subscriptions, Wallet, Notifications, Feedback, About
- No Firebase connection yet; this cut is intentionally static/demo-only

## Product catalogue

The customer catalogue does not contain hardcoded product names, prices, weights, or product counts. The source of truth is the existing Firebase `salesProducts` collection. Only active salable products are shown.

For single products, active salable records built from the same production product are exposed on Product Detail as weight/sale options (for example 100g and 200g), with the price, MRP, image, and availability belonging to the selected salable record.

SQLite remains a persistent cache for offline fallback. When Firebase is reachable, the remote `salesProducts` result replaces the cache so stale products do not remain in the catalogue.

## Development

1. Install Node.js LTS.
2. Run `npm install`.
3. Run `npx expo start`.
4. Open with Expo Go or an Android emulator.

## Android APK

For a preview APK:

`npm install --global eas-cli`

`eas login`

`eas build:configure`

Then:

`eas build --platform android --profile preview`

The preview profile is configured for an APK.

For a production Android build:

`eas build --platform android --profile production`

## Important

Do not add NestJS, PostgreSQL, Prisma, or another API backend. The confirmed architecture for the project is Firebase-only. Firebase Auth, Firestore, Storage and Cloud Functions will be connected in the next development phase.

- Phase 11: Customer delivery slot selection using existing deliverySlots collection.

Phase 16: Customer Subscription Delivery Calendar

- Phase 17: Customer wallet reads existing walletTransactions with no client-side financial mutations.


## Phase 18
Customer notifications are now read from the existing `notifications` collection. See `README_PHASE18_CUSTOMER_NOTIFICATIONS.md`.
