import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../core/firebaseClient';
import { normalizeIndianMobile } from '../clientOnboarding';

export type CustomerFeedback = {
  id: string;
  customerId: string;
  orderId?: string;
  productId?: string;
  deliveryPartnerId?: string;
  rating: number;
  comment?: string;
  images?: string[];
  status?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CreateCustomerFeedbackInput = {
  mobile: string;
  rating: number;
  comment?: string;
  orderId?: string;
  productId?: string;
};

function clean(value?: string) {
  const v = value?.trim();
  return v ? v : undefined;
}

export async function getCustomerFeedback(mobileInput: string): Promise<CustomerFeedback[]> {
  const mobile = normalizeIndianMobile(mobileInput);
  if (!mobile) throw new Error('Invalid customer mobile number.');

  const snapshot = await getDocs(query(collection(db, 'feedback'), where('customerId', '==', mobile)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<CustomerFeedback, 'id'>) }))
    .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
}

export async function createCustomerFeedback(input: CreateCustomerFeedbackInput) {
  const mobile = normalizeIndianMobile(input.mobile);
  if (!mobile) throw new Error('Invalid customer mobile number.');
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error('Please select a rating from 1 to 5.');

  const comment = clean(input.comment);
  if (!comment) throw new Error('Please enter your feedback.');
  if (comment.length > 1000) throw new Error('Feedback must be 1000 characters or fewer.');

  const ref = await addDoc(collection(db, 'feedback'), {
    customerId: mobile,
    orderId: clean(input.orderId),
    productId: clean(input.productId),
    rating: input.rating,
    comment,
    images: [],
    status: 'new',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id };
}

function timestampMillis(value: unknown) {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'string') return Date.parse(value) || 0;
  if (typeof value === 'number') return value;
  return 0;
}
