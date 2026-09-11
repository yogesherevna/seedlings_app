import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '../firebase';

const CUSTOMERS_COLLECTION = 'customers';

export function normalizeIndianMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? digits : '';
}

/**
 * Ensures the Firebase client has an authenticated identity before accessing
 * customer data. The current OTP is intentionally static; real phone auth
 * will replace this flow later.
 */
async function ensureAnonymousAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/**
 * Finds the customer by the normalized mobile number. The mobile number is
 * also the deterministic document id, preventing duplicate customer records.
 * Returns whether this was a new onboarding record.
 */
export async function ensureClientOnboarding(mobile: string) {
  const normalizedMobile = normalizeIndianMobile(mobile);
  if (!normalizedMobile) {
    throw new Error('Invalid mobile number.');
  }

  await ensureAnonymousAuth();

  const customerRef = doc(db, CUSTOMERS_COLLECTION, normalizedMobile);
  const existing = await getDoc(customerRef);

  if (existing.exists()) {
    return {
      customerId: existing.id,
      isNew: false,
    };
  }

  await setDoc(customerRef, {
    mobile: normalizedMobile,
    countryCode: '+91',
    phoneE164: `+91${normalizedMobile}`,
    onboardingStatus: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    customerId: customerRef.id,
    isNew: true,
  };
}
