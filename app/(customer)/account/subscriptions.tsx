import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { getCustomerAddresses, type CustomerAddress } from '../../../services/customerAddresses';
import { getProducts, isSubscriptionEligible, type Product } from '../../../services/products/productService';
import { getActiveSubscriptionPlans, getCustomerSubscriptions, prettySubscriptionStatus, createCustomerSubscription, updateCustomerSubscription, type CustomerSubscription, type SubscriptionPlan } from '../../../services/subscriptions/subscriptionService';
import { checkProductAvailability, nextWeekSaturday } from '../../../services/orders/customerOrderAvailability';
import { confirmHarvestShortage } from '../../../services/orders/customerAlerts';

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const addressText = (a: CustomerAddress) => [a.addressLine1, a.addressLine2, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(', ');
const today = () => new Date().toISOString().slice(0, 10);

export default function Subscriptions() {
  const mobile = useAppStore((s) => s.customerMobile);
  const params = useLocalSearchParams<{ productId?: string; planId?: string; quantity?: string }>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subs, setSubs] = useState<CustomerSubscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [startDate, setStartDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!mobile) { router.replace('/(customer)/auth/login'); return () => { alive = false; }; }
    (async () => {
      try {
        const [p, s, pr, a] = await Promise.all([getActiveSubscriptionPlans(), getCustomerSubscriptions(mobile), getProducts(), getCustomerAddresses(mobile)]);
        if (!alive) return;
        const eligible = pr.products.filter(isSubscriptionEligible);
        setPlans(p); setSubs(s); setProducts(eligible); setAddresses(a);
        setSelectedProduct(params.productId && eligible.some((x) => x.id === params.productId) ? params.productId : '');
        setSelectedPlan(params.planId && p.some((x) => x.id === params.planId) ? params.planId : '');
        setSelectedAddress(a[0]?.id || '');
        setQuantity(params.quantity && Number(params.quantity) > 0 ? String(Math.max(1, Math.floor(Number(params.quantity)))) : '1');
        setStartDate(today());
      } catch (e) {
        if (alive) Alert.alert('Unable to load subscriptions', e instanceof Error ? e.message : 'Please try again.');
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [mobile, params.productId, params.planId, params.quantity]);

  const active = subs.find((s) => s.status === 'active');
  const product = products.find((p) => p.id === selectedProduct);
  const selectedAddressObject = addresses.find((a) => a.id === selectedAddress);

  const create = async () => {
    if (!mobile || !product || !selectedPlan || !selectedAddressObject) {
      Alert.alert('Incomplete subscription', 'Choose a subscription plan and delivery address before continuing.'); return;
    }
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) { Alert.alert('Invalid start date', 'Enter the start date as YYYY-MM-DD.'); return; }
    setBusy(true);
    try {
      const availability = await checkProductAvailability({ product, quantity: qty, deliveryDate: nextWeekSaturday() });
      let shortageDecision: 'continue' | 'contact' | undefined;
      if (availability.hasShortage) {
        shortageDecision = await confirmHarvestShortage({ mode: 'subscription', availableGrams: availability.availableGrams, requestedGrams: availability.requestedGrams, shortageGrams: availability.shortageGrams });
      }
      const result = await createCustomerSubscription({ mobile, productId: product.id, planId: selectedPlan, addressId: selectedAddressObject.id, quantity: qty, startDate, shortageDecision });
      Alert.alert('Subscription created', result.subscriptionNumber ? `Subscription ${result.subscriptionNumber} was created.` : 'Your subscription was created.');
      setSubs(await getCustomerSubscriptions(mobile));
    } catch (e) {
      if (e instanceof Error && e.message === 'HARVEST_SHORTAGE_CONFIRMATION_REQUIRED') Alert.alert('Limited harvest available', 'Please review the harvest availability before continuing.');
      else Alert.alert('Unable to create subscription', e instanceof Error ? e.message : 'Please try again.');
    } finally { setBusy(false); }
  };

  const update = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!mobile || !active) return;
    setBusy(true);
    try { await updateCustomerSubscription({ mobile, subscriptionId: active.id, action }); setSubs(await getCustomerSubscriptions(mobile)); }
    catch (e) { Alert.alert('Unable to update subscription', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };

  if (loading) return <Screen><Header title="Subscriptions" onBack={() => router.back()} /><ActivityIndicator size="large" color={colors.green} style={{ marginTop: 45 }} /></Screen>;

  return <Screen>
    <Header title="Subscriptions" onBack={() => router.back()} />
    <View style={styles.panel}><Text style={styles.title}>My Subscription</Text>{active ? <><Text style={styles.productName}>{active.productName || 'Subscription'}</Text><Text style={styles.muted}>{active.sellingOptionLabel || 'Pack'} × {active.quantity || 1} · {active.frequency || ''} · Saturday delivery</Text><View style={styles.kpis}>{[['Status', prettySubscriptionStatus(active.status)], ['Deliveries', String(active.totalDeliveries ?? '—')], ['Remaining', String(active.remainingDeliveries ?? '—')]].map(([label, value]) => <View key={label} style={styles.kpi}><Text style={styles.small}>{label}</Text><Text style={styles.kpiValue}>{value}</Text></View>)}</View><Text style={styles.muted}>Next delivery: <Text style={styles.bold}>{active.nextDeliveryDate || '—'}</Text></Text><View style={styles.actions}>{active.status === 'active' ? <Pressable disabled={busy} onPress={() => update('pause')} style={styles.outline}><Text style={styles.greenText}>Pause</Text></Pressable> : null}{active.status === 'paused' ? <Pressable disabled={busy} onPress={() => update('resume')} style={styles.primary}><Text style={styles.white}>Resume</Text></Pressable> : null}{['active', 'paused'].includes(String(active.status)) ? <Pressable disabled={busy} onPress={() => Alert.alert('Cancel subscription', 'Cancel this subscription?', [{ text: 'Keep', style: 'cancel' }, { text: 'Cancel', style: 'destructive', onPress: () => { void update('cancel'); } }])} style={styles.outline}><Text style={{ color: '#a33', fontWeight: '900' }}>Cancel</Text></Pressable> : null}</View></> : <Text style={styles.muted}>No active subscription found.</Text>}</View>

    <Text style={styles.section}>Available plans</Text>{plans.length ? plans.map((plan) => <Pressable key={plan.id} onPress={() => setSelectedPlan(plan.id)} style={[styles.plan, selectedPlan === plan.id && styles.planSelected]}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.muted}>{plan.frequency}{plan.deliveriesPerTerm ? ` · ${plan.deliveriesPerTerm} deliveries` : ''} · Saturday</Text></View><Text style={styles.price}>{money(plan.price)}</Text></View>{selectedPlan === plan.id ? <Text style={styles.greenText}>Selected</Text> : null}</Pressable>) : <Text style={styles.muted}>No active subscription plans are available.</Text>}

    {selectedProduct ? <><Text style={styles.section}>Start subscription</Text><View style={styles.panel}><Text style={styles.muted}>Product: <Text style={styles.bold}>{product?.name || 'Product'}</Text></Text><Text style={styles.label}>Delivery address</Text>{addresses.length ? addresses.map((a) => <Pressable key={a.id} onPress={() => setSelectedAddress(a.id)} style={[styles.address, selectedAddress === a.id && styles.planSelected]}><Text style={styles.bold}>{a.label || 'Address'}</Text><Text style={styles.muted}>{addressText(a)}</Text></Pressable>) : <Text style={styles.muted}>Add a delivery address before creating a subscription.</Text>}<Text style={styles.label}>Packs per delivery</Text><TextInput value={quantity} onChangeText={setQuantity} keyboardType="number-pad" style={styles.input} /><Text style={styles.label}>Start date</Text><TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" style={styles.input} autoCapitalize="none" /><Text style={styles.muted}>Delivery is Saturday ({nextWeekSaturday()}). Monthly and Quarterly are the configured customer subscription plans.</Text><Pressable disabled={busy || !selectedPlan || !selectedAddress} onPress={() => void create()} style={[styles.primaryButton, (busy || !selectedPlan || !selectedAddress) && styles.disabled]}><Text style={styles.white}>{busy ? 'Creating…' : 'Create Subscription'}</Text></Pressable></View></> : <View style={styles.panel}><Text style={styles.title}>Start subscription</Text><Text style={styles.muted}>Choose Subscribe on a subscription-eligible product from Microgreens to select the product here.</Text><Pressable onPress={() => router.push('/(customer)/(tabs)/products')} style={{ marginTop: 12 }}><Text style={styles.greenText}>Shop Fresh →</Text></Pressable></View>}

    <Text style={styles.section}>My Subscriptions</Text>{subs.length ? subs.map((s) => <View key={s.id} style={styles.panel}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.planName}>{s.productName || 'Subscription'}</Text><Text style={styles.muted}>{s.sellingOptionLabel || ''} × {s.quantity || 1} · {s.frequency || ''} · Saturday delivery</Text></View><Text style={styles.greenText}>{prettySubscriptionStatus(s.status)}</Text></View><Text style={styles.muted}>Next delivery: <Text style={styles.bold}>{s.nextDeliveryDate || '—'}</Text></Text></View>) : <Text style={styles.muted}>No subscriptions found for this customer.</Text>}
    <Pressable onPress={() => router.push('/(customer)/account/delivery-calendar')} style={styles.outlineButton}><Text style={styles.greenText}>View Delivery Calendar</Text></Pressable>
  </Screen>;
}

const styles = {
  panel: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 16, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '900' as const, color: colors.ink },
  productName: { fontSize: 17, fontWeight: '900' as const, color: colors.greenDark, marginTop: 12 },
  muted: { color: colors.inkSoft, marginTop: 5, lineHeight: 20 as const },
  bold: { fontWeight: '900' as const, color: colors.ink },
  small: { fontSize: 10, color: colors.inkSoft, fontWeight: '800' as const },
  kpis: { flexDirection: 'row' as const, gap: 8, marginTop: 14 },
  kpi: { flex: 1, backgroundColor: colors.greenTint, borderRadius: 10, padding: 10 },
  kpiValue: { fontSize: 14, color: colors.greenDark, fontWeight: '900' as const, marginTop: 3 },
  actions: { flexDirection: 'row' as const, gap: 8, marginTop: 12 },
  outline: { flex: 1, borderWidth: 1, borderColor: colors.green, borderRadius: 12, padding: 13, alignItems: 'center' as const },
  primary: { flex: 1, backgroundColor: colors.green, borderRadius: 12, padding: 13, alignItems: 'center' as const },
  white: { color: '#fff', fontWeight: '900' as const },
  greenText: { color: colors.greenDark, fontWeight: '900' as const },
  section: { fontSize: 18, fontWeight: '900' as const, color: colors.ink, marginTop: 6, marginBottom: 10 },
  plan: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 15, marginBottom: 10 },
  planSelected: { borderColor: colors.green, backgroundColor: colors.greenTint },
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, gap: 10 },
  planName: { fontSize: 16, fontWeight: '900' as const, color: colors.ink },
  price: { fontSize: 18, fontWeight: '900' as const, color: colors.greenDark },
  address: { borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 10, padding: 11, marginTop: 8 },
  label: { fontWeight: '900' as const, color: colors.ink, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 10, padding: 11 },
  primaryButton: { backgroundColor: colors.green, borderRadius: 13, padding: 15, alignItems: 'center' as const, marginTop: 14 },
  disabled: { backgroundColor: colors.line },
  outlineButton: { borderWidth: 1, borderColor: colors.green, borderRadius: 12, padding: 13, alignItems: 'center' as const, marginTop: 4, marginBottom: 20 },
};
