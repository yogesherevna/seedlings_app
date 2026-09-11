import { doc, getDoc } from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';
import { auth, db } from '../core/firebaseClient';
import { getDatabase } from '../../storage/sqlite';
import { normalizeIndianMobile } from '../clientOnboarding';

const SESSION_KEY = 'customer_mobile';

export async function restoreCustomerSession(): Promise<string | null> {
  const database = getDatabase();
  const row = database.getFirstSync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    SESSION_KEY,
  );

  if (!row?.value) return null;

  const mobile = normalizeIndianMobile(row.value);
  if (!mobile) {
    clearCustomerSession();
    return null;
  }

  try {
    if (!auth.currentUser) await signInAnonymously(auth);

    const customerSnapshot = await getDoc(doc(db, 'customers', mobile));
    if (!customerSnapshot.exists()) {
      clearCustomerSession();
      await signOut(auth);
      return null;
    }

    const customer = customerSnapshot.data();
    if (customer.status === 'blocked' || customer.onboardingStatus === 'blocked') {
      clearCustomerSession();
      await signOut(auth);
      return null;
    }

    return mobile;
  } catch (error) {
    console.warn('Customer session restore could not validate remote customer:', error);
    return mobile;
  }
}

export function persistCustomerSession(mobile: string): void {
  const normalizedMobile = normalizeIndianMobile(mobile);
  if (!normalizedMobile) throw new Error('Invalid customer mobile number.');

  getDatabase().runSync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    SESSION_KEY,
    normalizedMobile,
  );
}

export function clearCustomerSession(): void {
  getDatabase().runSync('DELETE FROM app_meta WHERE key = ?', SESSION_KEY);
}

export async function logoutCustomer(): Promise<void> {
  clearCustomerSession();
  await signOut(auth);
}
