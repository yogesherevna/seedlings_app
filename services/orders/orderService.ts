import { addDoc, collection, doc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../core/firebaseClient';
import { normalizeIndianMobile } from '../clientOnboarding';
import type { CartItem } from '../cart/cartService';
import type { CustomerAddress } from '../customerAddresses';
import type { PaymentTransaction } from '../payments/paymentService';

export type CreateCustomerOrderInput = { mobile: string; items: CartItem[]; address: CustomerAddress; paymentMethod: string; deliverySlot?: { id: string; name?: string; date?: string; startTime?: string; endTime?: string; deliveryCharge?: number } };

function createOrderNumber() {
  const now = new Date();
  return `SM${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getTime()).slice(-6)}`;
}

export async function createCustomerOneTimeOrder(input: CreateCustomerOrderInput) {
  const mobile = normalizeIndianMobile(input.mobile);
  if (!mobile) throw new Error('Invalid customer mobile number.');
  if (!input.items.length) throw new Error('Your cart is empty.');
  const customerSnapshot = await getDoc(doc(db, 'customers', mobile));
  if (!customerSnapshot.exists()) throw new Error('Customer account not found.');
  const customer = customerSnapshot.data();
  if (customer.status === 'blocked') throw new Error('Your customer account is blocked.');
  const saved = Array.isArray(customer.addresses) ? customer.addresses : [];
  if (!saved.some((a) => String(a?.id ?? '') === input.address.id)) throw new Error('Selected delivery address is no longer available.');

  const productDocs = await getDocs(collection(db, 'salesProducts'));
  const products = new Map(productDocs.docs.map((s) => [s.id, s.data()]));
  const orderItems = input.items.map((item) => {
    const product = products.get(item.id);
    if (!product || product.active !== true) throw new Error(`${item.name} is no longer available.`);
    if (typeof product.sellingPrice !== 'number') throw new Error(`Price unavailable for ${item.name}.`);
    const unitMrp = typeof product.mrp === 'number' && product.mrp > 0 ? product.mrp : product.sellingPrice;
    const quantity = Math.max(1, Math.floor(item.quantity));
    return {
      productId: item.id, productName: String(product.name ?? item.name), productSku: typeof product.sku === 'string' ? product.sku : undefined,
      weightGrams: Number.isFinite(Number(item.selectedWeight)) ? Number(item.selectedWeight) : undefined, weightLabel: item.selectedWeight,
      quantity, unitMrp, mrp: unitMrp * quantity, unitPrice: product.sellingPrice, price: product.sellingPrice * quantity,
      discount: Math.max(0, (unitMrp - product.sellingPrice) * quantity), imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : undefined,
    };
  });
  const mrpTotal = orderItems.reduce((s, i) => s + i.mrp, 0);
  const subtotal = orderItems.reduce((s, i) => s + i.price, 0);
  const discount = Math.max(0, mrpTotal - subtotal);
  const deliveryFee = typeof input.deliverySlot?.deliveryCharge === 'number' ? Math.max(0, input.deliverySlot.deliveryCharge) : 40;
  const total = subtotal + deliveryFee;
  const addressSnapshot = { id: input.address.id, label: input.address.label ?? 'Home', name: input.address.name ?? '', mobileNumber: input.address.mobileNumber ?? mobile, addressLine1: input.address.addressLine1 ?? '', addressLine2: input.address.addressLine2 ?? '', landmark: input.address.landmark ?? '', city: input.address.city ?? '', state: input.address.state ?? '', pincode: input.address.pincode ?? '' };
  const orderNumber = createOrderNumber();
  const orderRef = await addDoc(collection(db, 'orders'), {
    orderNumber, customerId: mobile, customerName: typeof customer.name === 'string' ? customer.name : addressSnapshot.name, customerMobile: mobile,
    items: orderItems, subtotal, deliveryFee, discount, total, mrpTotal, discountTotal: discount, deliveryCharge: deliveryFee, walletApplied: 0, totalAmount: total, currency: 'INR',
    paymentStatus: 'pending', paymentMethod: input.paymentMethod, status: 'confirmed', deliveryStatus: 'pending', deliveryAddress: addressSnapshot, deliveryAddressSnapshot: addressSnapshot,
    deliverySlotId: input.deliverySlot?.id, deliveryChargeId: input.deliverySlot?.id, deliveryChargeName: input.deliverySlot?.name, deliveryChargeSnapshot: deliveryFee,
    scheduledDeliveryDate: input.deliverySlot?.date, orderType: 'one_time', packingStatus: 'pending', statusHistory: [{ status: 'confirmed', changedAt: new Date().toISOString(), source: 'customer_mobile' }], createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return { id: orderRef.id, orderNumber, total };
}


export type CustomerOrder = {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerName?: string;
  customerMobile?: string;
  items?: Array<Record<string, unknown>>;
  subtotal?: number;
  deliveryFee?: number;
  deliveryCharge?: number;
  discount?: number;
  discountTotal?: number;
  mrpTotal?: number;
  total?: number;
  totalAmount?: number;
  currency?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  status?: string;
  deliveryStatus?: string;
  deliveryAddress?: Record<string, unknown>;
  deliveryAddressSnapshot?: Record<string, unknown>;
  orderType?: string;
  packingStatus?: string;
  createdAt?: unknown;
  scheduledDeliveryDate?: string;
  paymentTransactions?: PaymentTransaction[];
};

function timestampMillis(value: unknown) {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'string') return Date.parse(value) || 0;
  return 0;
}

export async function getCustomerOrders(mobileInput: string): Promise<CustomerOrder[]> {
  const mobile = normalizeIndianMobile(mobileInput);
  if (!mobile) throw new Error('Invalid customer mobile number.');
  const snapshot = await getDocs(query(collection(db, 'orders'), where('customerId', '==', mobile)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<CustomerOrder, 'id'>) }))
    .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
}

export async function getCustomerOrder(mobileInput: string, orderId: string): Promise<CustomerOrder | null> {
  const mobile = normalizeIndianMobile(mobileInput);
  if (!mobile || !orderId) return null;
  const snapshot = await getDoc(doc(db, 'orders', orderId));
  if (!snapshot.exists()) return null;
  const order = { id: snapshot.id, ...(snapshot.data() as Omit<CustomerOrder, 'id'>) };
  if (order.customerId !== mobile) return null;
  return order;
}
