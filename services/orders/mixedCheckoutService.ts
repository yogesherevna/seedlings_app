import { collection, doc, getDoc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../core/firebaseClient';
import { normalizeIndianMobile } from '../clientOnboarding';
import { stripUndefined } from '../core/firestoreData';
import { checkProductAvailability, nextWeekSaturday } from './customerOrderAvailability';
import { calculateCheckoutDeliveryCharges } from './deliveryChargeService';
import type { CustomerAddress } from '../customerAddresses';
import type { CartItem, SubscriptionCartItem } from '../cart/cartService';
import type { Product } from '../products/productService';

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const mobileOf = (value: unknown) => normalizeIndianMobile(String(value ?? ''));
const orderNumber = () => `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const number = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export type MixedCheckoutInput = {
  mobile: string;
  addressId: string;
  deliverySlot: string;
  paymentMethod?: string;
  oneTimeItems: CartItem[];
  subscriptionItems: SubscriptionCartItem[];
  shortageDecision?: 'continue' | 'contact';
};

export type MixedCheckoutResult = {
  oneTimeOrderId: string;
  oneTimeOrderNumber: string;
  subscriptionOrderIds: string[];
  subscriptionNumbers: string[];
  total: number;
  primaryOrderId: string;
  primaryOrderNumber: string;
};

function productOrderItem(product: Record<string, unknown> & { id: string }, item: CartItem) {
  const components = Array.isArray(product.components) ? product.components : [];
  const weightGrams = components.reduce((sum, raw) => {
    const component = (raw ?? {}) as Record<string, unknown>;
    return sum + Math.max(0, number(component.quantityGrams));
  }, 0);
  const quantity = Math.max(1, Math.floor(number(item.quantity, 1)));
  const price = number(product.sellingPrice, number(item.price));
  const mrp = number(product.mrp, price);
  return {
    salableProductId: product.id,
    salableProductSku: clean(product.sku),
    salableProductType: product.type === 'multiple' ? 'multiple' : 'single',
    productId: product.id,
    productName: clean(product.name) || item.name,
    productSlug: clean(product.slug),
    sellingOptionId: product.id,
    sellingOptionLabel: product.type === 'multiple' ? 'Combo' : (components[0] && number((components[0] as Record<string, unknown>).quantityGrams) ? `${number((components[0] as Record<string, unknown>).quantityGrams)}g` : 'Single'),
    weightGrams,
    quantity,
    mrp,
    unitPrice: price,
    lineTotal: price * quantity,
    imageUrl: clean(product.imageUrl),
  };
}

export async function createCustomerMixedCheckout(input: MixedCheckoutInput): Promise<MixedCheckoutResult> {
  const mobile = mobileOf(input.mobile);
  if (mobile.length !== 10) throw new Error('Invalid customer mobile number.');
  if (!clean(input.addressId)) throw new Error('Delivery address is required.');
  if (!clean(input.deliverySlot)) throw new Error('Delivery slot/date is required.');
  if (!input.oneTimeItems.length && !input.subscriptionItems.length) throw new Error('Cart is empty.');

  const customerRef = doc(db, 'customers', mobile);
  const customerSnap = await getDoc(customerRef);
  if (!customerSnap.exists()) throw new Error('Customer account not found.');
  const customer = customerSnap.data() || {};
  if (customer.status === 'blocked') throw new Error('This customer account is blocked.');

  const addresses = Array.isArray(customer.addresses) ? customer.addresses : [];
  const address = addresses.find((raw) => String((raw as Record<string, unknown>)?.id ?? '') === input.addressId) as CustomerAddress | undefined;
  if (!address) throw new Error('Selected delivery address was not found.');

  const allIds = [...new Set([...input.oneTimeItems.map((item) => clean(item.id)), ...input.subscriptionItems.map((item) => clean(item.id))])];
  const productSnapshots = await Promise.all(allIds.map((id) => getDoc(doc(db, 'salesProducts', id))));
  const productById = new Map(allIds.map((id, index) => [id, productSnapshots[index]]));

  const plansSnapshot = await getDocs(query(collection(db, 'subscriptionPlans'), where('active', '==', true)));
  const planById = new Map(plansSnapshot.docs.map((item) => [item.id, item.data()]));

  const deliveryCharges = await calculateCheckoutDeliveryCharges({
    pincode: String(address.pincode ?? ''),
    oneTime: input.oneTimeItems.length > 0,
    subscriptions: input.subscriptionItems.map((item) => ({ planId: item.planId, planName: item.planName })),
  });

  const deliveryByPlan = new Map(deliveryCharges.subscriptions.map((item) => [item.planId, item]));
  const targetDate = nextWeekSaturday();
  let oneSubtotal = 0;
  let oneMrpSubtotal = 0;
  const oneOrderItems: Record<string, unknown>[] = [];
  const subscriptionWrites: Array<{ subscriptionRef: ReturnType<typeof doc>; subscription: Record<string, unknown>; orderRef: ReturnType<typeof doc>; order: Record<string, unknown> }> = [];
  const availabilityResults: Array<{ hasShortage: boolean; requestedGrams: number; availableGrams: number; shortageGrams: number }> = [];

  for (const item of input.oneTimeItems) {
    const snap = productById.get(item.id);
    if (!snap?.exists()) throw new Error(`Product "${item.name}" is no longer available.`);
    const product = snap.data() || {};
    if (product.active !== true || product.oneTimePurchase !== true) throw new Error(`Product "${clean(product.name) || item.name}" is not available for one-time purchase.`);
    const quantity = number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Item quantities must be at least 1.');
    const price = number(product.sellingPrice, item.price);
    const mrp = number(product.mrp, price);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(mrp) || mrp < price) throw new Error(`Invalid price for "${clean(product.name) || item.name}".`);

    const availability = await checkProductAvailability({ product: { id: snap.id, ...(product as Product) } as Product, quantity, deliveryDate: targetDate });
    availabilityResults.push(availability);
    const orderItem = productOrderItem({ id: snap.id, ...product }, item);
    oneOrderItems.push(orderItem);
    oneSubtotal += number(orderItem.lineTotal);
    oneMrpSubtotal += number(orderItem.mrp) * number(orderItem.quantity);
  }

  for (const item of input.subscriptionItems) {
    const snap = productById.get(item.id);
    if (!snap?.exists()) throw new Error(`Product "${item.name}" is no longer available.`);
    const product = snap.data() || {};
    if (product.active !== true) throw new Error(`Product "${clean(product.name) || item.name}" is no longer available.`);
    const quantity = number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Subscription quantities must be at least 1.');

    const plan = planById.get(item.planId);
    if (!plan || plan.active !== true) throw new Error(`Subscription plan "${item.planName}" is no longer active.`);
    const frequency = clean(plan.frequency).toLowerCase();
    if (!['monthly', 'quarterly', 'half_yearly', 'yearly'].includes(frequency)) throw new Error('Selected subscription plan is invalid.');
    const price = number(plan.price, number(product.sellingPrice));
    if (!Number.isFinite(price) || price < 0) throw new Error(`Invalid subscription price for "${clean(product.name) || item.name}".`);

    const components = Array.isArray(product.components) ? product.components : [];
    const component = components[0] as Record<string, unknown> | undefined;
    if (!component?.productId) throw new Error(`Product "${clean(product.name) || item.name}" has no production product component.`);
    const productionSnap = await getDoc(doc(db, 'products', String(component.productId)));
    if (!productionSnap.exists()) throw new Error('The underlying production product was not found.');
    const weight = number(component.quantityGrams);
    if (!Number.isFinite(weight) || weight <= 0) throw new Error(`Product "${clean(product.name) || item.name}" has an invalid pack quantity.`);

    const deliveries = Math.max(1, number(plan.deliveriesPerTerm, frequency === 'monthly' ? 4 : frequency === 'quarterly' ? 12 : 1));
    const first = clean(item.startDate) || targetDate;
    const end = new Date(`${first}T00:00:00`);
    end.setDate(end.getDate() + (deliveries - 1) * 7);
    const endDate = end.toISOString().slice(0, 10);
    const availability = await checkProductAvailability({ product: { id: snap.id, ...(product as Product) } as Product, quantity, deliveryDate: first });
    availabilityResults.push(availability);

    const charge = deliveryByPlan.get(item.planId);
    const deliveryFee = charge?.finalCharge ?? 0;
    const production = productionSnap.data() || {};
    const label = weight >= 1000 && weight % 1000 === 0 ? `${weight / 1000}kg box` : `${weight}g box`;
    const subscriptionRef = doc(collection(db, 'subscriptions'));
    const orderRef = doc(collection(db, 'orders'));
    const subscriptionNumber = `SUB-${subscriptionRef.id.slice(0, 8).toUpperCase()}`;
    const subscriptionOrderNumber = orderNumber();
    const customerName = clean(customer.name) || 'Unnamed customer';
    const customerMobile = clean(customer.mobileNumber || customer.mobile || mobile);
    const decision = input.shortageDecision || 'continue';

    const subscription = stripUndefined({
      subscriptionNumber,
      customerId: mobile,
      customerName,
      customerMobile: mobile,
      salableProductId: snap.id,
      productId: String(component.productId),
      productName: clean(production.name) || clean(product.name),
      sellingOptionId: '',
      sellingOptionLabel: label,
      weightGrams: weight,
      unitPrice: price,
      quantity,
      frequency,
      totalDeliveries: deliveries,
      deliveriesGenerated: 0,
      nextDeliveryDate: first,
      deliveryDay: 6,
      startDate: first,
      endDate,
      deliveryAddress: address,
      deliveryFeePerDelivery: deliveryFee,
      deliveryChargeDetails: charge?.snapshot || {},
      requiresCustomerContact: false,
      availabilityRequestedGrams: availability.requestedGrams,
      availabilityAvailableGrams: availability.availableGrams,
      availabilityShortageGrams: availability.shortageGrams,
      carryForwardQuantityGrams: availability.shortageGrams,
      availabilityDecision: decision,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const subscriptionOrder = stripUndefined({
      orderNumber: subscriptionOrderNumber,
      customerId: mobile,
      customerName: clean(customer.name),
      customerMobile,
      items: [{
        salableProductId: snap.id,
        salableProductType: product.type === 'multiple' ? 'multiple' : 'single',
        productId: String(component.productId),
        productName: clean(production.name) || clean(product.name),
        sellingOptionId: '',
        sellingOptionLabel: label,
        weightGrams: weight,
        quantity,
        unitPrice: price,
        lineTotal: price * quantity,
        imageUrl: clean(product.imageUrl),
      }],
      subtotal: price * quantity,
      deliveryFee,
      discount: 0,
      total: price * quantity + deliveryFee,
      currency: 'INR',
      paymentStatus: 'pending',
      paymentMethod: clean(input.paymentMethod) || 'online',
      status: 'active',
      deliveryAddress: address,
      scheduledDeliveryDate: first,
      deliveryDate: first,
      notes: '',
      orderType: 'subscription',
      subscriptionId: subscriptionRef.id,
      subscriptionNumber,
      subscriptionPlanId: item.planId,
      subscriptionPlanName: clean(plan.name) || frequency,
      subscriptionFrequency: frequency,
      deliveryChargeId: charge?.sourceId || '',
      deliveryChargeName: charge?.sourceName || '',
      deliveryChargeSnapshot: deliveryFee,
      deliveryChargeDetails: charge?.snapshot || {},
      packingStatus: 'pending',
      requiresCustomerContact: false,
      availabilityRequestedGrams: availability.requestedGrams,
      availabilityAvailableGrams: availability.availableGrams,
      availabilityShortageGrams: availability.shortageGrams,
      carryForwardQuantityGrams: availability.shortageGrams,
      availabilityDecision: decision,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    subscriptionWrites.push({ subscriptionRef, subscription, orderRef, order: subscriptionOrder });
  }

  if (availabilityResults.some((result) => result.hasShortage) && !input.shortageDecision) throw new Error('HARVEST_SHORTAGE_CONFIRMATION_REQUIRED');

  const oneDeliveryFee = deliveryCharges.oneTime.finalCharge;
  const productSavings = Math.max(0, oneMrpSubtotal - oneSubtotal);
  const oneOrderRef = oneOrderItems.length ? doc(collection(db, 'orders')) : null;
  const oneOrderNumber = oneOrderItems.length ? orderNumber() : '';
  const oneOrder = oneOrderRef ? stripUndefined({
    orderNumber: oneOrderNumber,
    customerId: mobile,
    customerName: clean(customer.name),
    customerMobile: clean(customer.mobileNumber || customer.mobile || mobile),
    items: oneOrderItems,
    subtotal: oneSubtotal,
    deliveryFee: oneDeliveryFee,
    discount: productSavings,
    total: oneSubtotal + oneDeliveryFee,
    currency: 'INR',
    paymentStatus: 'pending',
    paymentMethod: clean(input.paymentMethod) || 'online',
    status: 'pending_payment',
    deliveryAddress: address,
    scheduledDeliveryDate: targetDate,
    deliveryDate: targetDate,
    deliverySlot: input.deliverySlot.trim(),
    notes: '',
    orderType: 'one_time',
    subscriptionId: null,
    deliveryChargeId: deliveryCharges.oneTime.sourceId,
    deliveryChargeName: deliveryCharges.oneTime.sourceName,
    deliveryChargeSnapshot: oneDeliveryFee,
    deliveryChargeDetails: deliveryCharges.oneTime.snapshot,
    packingStatus: 'pending',
    requiresCustomerContact: input.shortageDecision === 'contact',
    availabilityDecision: input.shortageDecision || 'continue',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }) : null;

  const batch = writeBatch(db);
  if (oneOrderRef && oneOrder) batch.set(oneOrderRef, oneOrder);
  for (const item of subscriptionWrites) {
    batch.set(item.subscriptionRef, item.subscription);
    batch.set(item.orderRef, item.order);
  }
  await batch.commit();

  const subscriptionTotal = subscriptionWrites.reduce((sum, item) => sum + number(item.order.total), 0);
  return {
    oneTimeOrderId: oneOrderRef?.id || '',
    oneTimeOrderNumber: oneOrderNumber,
    subscriptionOrderIds: subscriptionWrites.map((item) => item.orderRef.id),
    subscriptionNumbers: subscriptionWrites.map((item) => String(item.subscription.subscriptionNumber)),
    total: oneSubtotal + oneDeliveryFee + subscriptionTotal,
    primaryOrderId: oneOrderRef?.id || subscriptionWrites[0]?.orderRef.id || '',
    primaryOrderNumber: oneOrderNumber || String(subscriptionWrites[0]?.order.orderNumber || ''),
  };
}
