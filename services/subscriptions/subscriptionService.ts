import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../core/firebaseClient';
import { normalizeIndianMobile } from '../clientOnboarding';
import { app } from '../core/firebaseClient';

export type SubscriptionPlan = { id:string; name:string; frequency:string; price:number; deliveriesPerTerm?:number; active:boolean; sortOrder:number; deliveryChargeMode?:string; deliveryCharge?:number };
export type CustomerSubscription = { id:string; subscriptionNumber?:string; customerId:string; productId?:string; productName?:string; sellingOptionLabel?:string; quantity?:number; frequency?:string; status?:string; totalDeliveries?:number; deliveriesGenerated?:number; remainingDeliveries?:number; nextDeliveryDate?:string; deliveryAddress?:Record<string,unknown>; startDate?:string; endDate?:string; price?:number; planId?:string; createdAt?:unknown };
function num(v:unknown,f=0){const n=Number(v);return Number.isFinite(n)?n:f}
function str(v:unknown,f=''){return typeof v==='string'?v:f}
export async function getActiveSubscriptionPlans():Promise<SubscriptionPlan[]>{
 const s=await getDocs(query(collection(db,'subscriptionPlans'),where('active','==',true)));
 return s.docs.map(d=>{const x=d.data();return {id:d.id,name:str(x.name,str(x.frequency,'Subscription plan')),frequency:str(x.frequency),price:num(x.price),...(x.deliveriesPerTerm!=null?{deliveriesPerTerm:num(x.deliveriesPerTerm)}:{}),active:x.active===true,sortOrder:num(x.sortOrder),...(x.deliveryChargeMode?{deliveryChargeMode:str(x.deliveryChargeMode)}:{}),...(x.deliveryCharge!=null?{deliveryCharge:num(x.deliveryCharge)}:{})}}).filter(p=>['monthly','quarterly'].includes(p.frequency)).sort((a,b)=>a.sortOrder-b.sortOrder||a.price-b.price)
}
export async function getCustomerSubscriptions(input:string):Promise<CustomerSubscription[]>{
 const mobile=normalizeIndianMobile(input);if(!mobile)throw new Error('Invalid customer mobile number.');
 const s=await getDocs(query(collection(db,'subscriptions'),where('customerId','==',mobile)));
 return s.docs.map(d=>{const x=d.data();const total=x.totalDeliveries==null?undefined:num(x.totalDeliveries);const generated=num(x.deliveriesGenerated);return {id:d.id,customerId:str(x.customerId,mobile),...(x.subscriptionNumber?{subscriptionNumber:str(x.subscriptionNumber)}:{}),...(x.productId?{productId:str(x.productId)}:{}),...(x.productName?{productName:str(x.productName)}:{}),...(x.sellingOptionLabel?{sellingOptionLabel:str(x.sellingOptionLabel)}:{}),...(x.quantity!=null?{quantity:Math.max(1,Math.floor(num(x.quantity,1)))}:{}),...(x.frequency?{frequency:str(x.frequency)}:{}),...(x.status?{status:str(x.status)}:{}),...(total!==undefined?{totalDeliveries:total,remainingDeliveries:Math.max(0,total-generated)}:{}),...(x.deliveriesGenerated!=null?{deliveriesGenerated:generated}:{}),...(x.nextDeliveryDate?{nextDeliveryDate:str(x.nextDeliveryDate)}:{}),...(x.deliveryAddress?{deliveryAddress:x.deliveryAddress as Record<string,unknown>}:{}),...(x.startDate?{startDate:str(x.startDate)}:{}),...(x.endDate?{endDate:str(x.endDate)}:{}),...(x.price!=null?{price:num(x.price)}:{}),...(x.planId?{planId:str(x.planId)}:{}),...(x.createdAt?{createdAt:x.createdAt}: {})}}).sort((a,b)=>String(b.createdAt??'').localeCompare(String(a.createdAt??'')))
}
export function isSubscriptionEligible(product:{subscriptionPurchase?:boolean;active?:boolean}){return product.active===true&&product.subscriptionPurchase===true}
export function prettySubscriptionStatus(status?:string){const v=String(status??'').trim().toLowerCase();return v?v.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()):'Unknown'}


export type CreateSubscriptionInput = {
  mobile: string;
  productId: string;
  planId: string;
  addressId: string;
  quantity: number;
  startDate: string;
  shortageDecision?: 'continue' | 'contact';
};

export type SubscriptionAction = 'pause' | 'resume' | 'cancel';

const subscriptionFunctions = getFunctions(app);

/**
 * Trusted mutation boundary for customer subscriptions.
 * The mobile client never writes subscription documents directly.
 * The callable functions must validate customer ownership, product/plan eligibility,
 * address ownership, pricing and allowed status transitions on the server.
 */
export async function createCustomerSubscription(input: CreateSubscriptionInput) {
  const mobile = normalizeIndianMobile(input.mobile);
  if (!mobile) throw new Error('Invalid customer mobile number.');
  if (!input.productId || !input.planId || !input.addressId) throw new Error('Choose a product, plan and delivery address.');
  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
  if (!input.startDate) throw new Error('Choose a subscription start date.');

  const fn = httpsCallable(subscriptionFunctions, 'createCustomerSubscription');
  const result = await fn({ ...input, mobile, quantity });
  return result.data as { subscriptionId?: string; subscriptionNumber?: string };
}

export async function updateCustomerSubscription(input: { mobile: string; subscriptionId: string; action: SubscriptionAction }) {
  const mobile = normalizeIndianMobile(input.mobile);
  if (!mobile) throw new Error('Invalid customer mobile number.');
  if (!input.subscriptionId) throw new Error('Subscription is required.');
  const fn = httpsCallable(subscriptionFunctions, 'updateCustomerSubscription');
  const result = await fn({ ...input, mobile });
  return result.data as { subscriptionId?: string; status?: string };
}
