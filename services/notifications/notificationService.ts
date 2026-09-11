import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../core/firebaseClient';

export type CustomerNotification = {
  id: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: unknown;
  orderId?: string;
  orderNumber?: string;
  subscriptionId?: string;
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toDateValue(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'object' && value !== null && 'toMillis' in value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  return 0;
}

function mapNotification(id: string, data: Record<string, unknown>): CustomerNotification {
  return {
    id,
    title: asString(data.title) ?? asString(data.heading) ?? 'Notification',
    message: asString(data.message) ?? asString(data.body) ?? asString(data.description) ?? '',
    type: asString(data.type),
    read: data.read === true || data.isRead === true,
    createdAt: data.createdAt ?? data.timestamp ?? data.sentAt,
    orderId: asString(data.orderId),
    orderNumber: asString(data.orderNumber),
    subscriptionId: asString(data.subscriptionId),
  };
}

export async function getCustomerNotifications(mobile: string): Promise<CustomerNotification[]> {
  const normalizedMobile = mobile.replace(/\D/g, '');
  if (!normalizedMobile) return [];

  const snapshot = await getDocs(
    query(collection(db, 'notifications'), where('customerId', '==', normalizedMobile)),
  );

  return snapshot.docs
    .map((doc) => mapNotification(doc.id, doc.data() as Record<string, unknown>))
    .sort((a, b) => toDateValue(b.createdAt) - toDateValue(a.createdAt));
}
