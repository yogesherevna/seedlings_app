import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './core/firebaseClient';
import { normalizeIndianMobile } from './clientOnboarding';

export type CustomerProfile = {
  mobile: string;
  countryCode?: string;
  phoneE164?: string;
  name: string;
  email: string;
  status?: string;
  onboardingStatus?: string;
};

function customerRef(mobile: string) {
  const normalized = normalizeIndianMobile(mobile);
  if (!normalized) throw new Error('Invalid customer mobile number.');
  return doc(db, 'customers', normalized);
}

export async function getCustomerProfile(mobile: string): Promise<CustomerProfile> {
  const snapshot = await getDoc(customerRef(mobile));
  if (!snapshot.exists()) throw new Error('Customer profile not found.');

  const data = snapshot.data();
  return {
    mobile: String(data.mobile ?? snapshot.id),
    countryCode: data.countryCode ? String(data.countryCode) : undefined,
    phoneE164: data.phoneE164 ? String(data.phoneE164) : undefined,
    name: typeof data.name === 'string' ? data.name : '',
    email: typeof data.email === 'string' ? data.email : '',
    status: data.status ? String(data.status) : undefined,
    onboardingStatus: data.onboardingStatus ? String(data.onboardingStatus) : undefined,
  };
}

export async function updateCustomerProfile(
  mobile: string,
  values: Pick<CustomerProfile, 'name' | 'email'>,
): Promise<void> {
  const normalized = normalizeIndianMobile(mobile);
  if (!normalized) throw new Error('Invalid customer mobile number.');

  const name = values.name.trim();
  const email = values.email.trim();

  if (!name) throw new Error('Please enter your name.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address.');
  }

  await updateDoc(customerRef(normalized), {
    name,
    email,
    updatedAt: serverTimestamp(),
  });
}
