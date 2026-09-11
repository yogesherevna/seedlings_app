import { collection, getDocs } from 'firebase/firestore';
import { db } from '../core/firebaseClient';

export type DeliveryCharge = {
  id: string;
  name: string;
  mode: 'free' | 'fixed' | string;
  amount: number;
};

/** Same master used by the Website order flow. */
export async function getActiveOneTimeDeliveryCharge(): Promise<DeliveryCharge | null> {
  const snapshot = await getDocs(collection(db, 'deliveryCharges'));
  const active = snapshot.docs
    .map((doc) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        name: typeof data.name === 'string' ? data.name.trim() : '',
        mode: typeof data.mode === 'string' ? data.mode : 'fixed',
        amount: Number.isFinite(Number(data.amount)) ? Math.max(0, Number(data.amount)) : 0,
        active: data.active === true,
        scope: typeof data.scope === 'string' ? data.scope : '',
      };
    })
    .filter((charge) => charge.active && charge.scope === 'one_time_order');

  if (active.length > 1) throw new Error('Multiple active one-time delivery charges are configured. Please configure one active charge before accepting website orders.');
  if (!active[0]) return null;
  return { id: active[0].id, name: active[0].name, mode: active[0].mode, amount: active[0].mode === 'free' ? 0 : active[0].amount };
}
