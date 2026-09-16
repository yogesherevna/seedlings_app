import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './core/firebaseClient';
import { normalizeIndianMobile } from './clientOnboarding';
import { clearCachedCustomer, getCachedCustomer, setCachedCustomer } from './customerCache';

export type CustomerProfile = {
  mobile: string;
  countryCode?: string;
  phoneE164?: string;
  name: string;
  email: string;
  status?: string;
  onboardingStatus?: string;
  preferredDeliveryDay?: string;
  deliveryDay?: string;
};

function customerRef(mobile: string) {
  const normalized = normalizeIndianMobile(mobile);
  if (!normalized) throw new Error('Invalid customer mobile number.');
  return doc(db, 'customers', normalized);
}

export async function getCustomerProfile(mobile: string): Promise<CustomerProfile> {
  const normalized = normalizeIndianMobile(mobile);
  if (!normalized) throw new Error('Invalid customer mobile number.');
  const cached = getCachedCustomer(normalized);
  if (cached && typeof cached.name === 'string' && typeof cached.email === 'string') {
    return {
      mobile: String(cached.mobile ?? normalized),
      countryCode: cached.countryCode,
      phoneE164: cached.phoneE164,
      name: cached.name,
      email: cached.email,
      status: cached.status,
      onboardingStatus: cached.onboardingStatus,
      preferredDeliveryDay: cached.preferredDeliveryDay,
      deliveryDay: cached.deliveryDay,
    };
  }
  const snapshot = await getDoc(customerRef(normalized));
  if (!snapshot.exists()) throw new Error('Customer profile not found.');

  const data = snapshot.data();
  const profile = {
    mobile: String(data.mobile ?? snapshot.id),
    countryCode: data.countryCode ? String(data.countryCode) : undefined,
    phoneE164: data.phoneE164 ? String(data.phoneE164) : undefined,
    name: typeof data.name === 'string' ? data.name : '',
    email: typeof data.email === 'string' ? data.email : '',
    status: data.status ? String(data.status) : undefined,
    onboardingStatus: data.onboardingStatus ? String(data.onboardingStatus) : undefined,
    preferredDeliveryDay: data.preferredDeliveryDay ? String(data.preferredDeliveryDay) : undefined,
    deliveryDay: data.deliveryDay ? String(data.deliveryDay) : undefined,
  };
  const existing = getCachedCustomer(snapshot.id);
  setCachedCustomer(snapshot.id, { ...(existing ?? {}), ...profile });
  return profile;
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
    preferredDeliveryDay: 'Saturday',
    updatedAt: serverTimestamp(),
  });
  clearCachedCustomer(normalized);
}
