# Seedlings Microgreens Mobile — Static Navigation MVP

This is the first development cut of the Seedlings Microgreens customer mobile application.

## Included

- Expo + React Native + TypeScript
- Expo Router navigation
- Zustand cart/auth state
- NativeWind configured
- Static mobile-number validation (10 digits)
- Static OTP validation (`1234`)
- Seedlings supplied logo used for splash/app icon
- Product catalog driven by `data/products.json`
- Local product-image folder
- Home, Products, Product Detail, Cart, Checkout, Order Success, Orders
- Profile, Addresses, Subscriptions, Wallet, Notifications, Feedback, About
- No Firebase connection yet; this cut is intentionally static/demo-only

## Product images

Put actual image files in:

`assets/products/`

Then change only the `image` filename in:

`data/products.json`

After adding/replacing local images, run:

`npm run generate:image-map`

This regenerates `data/imageMap.ts` from the files actually present in `assets/products/`, so you do not have to edit application code for every product image.

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
