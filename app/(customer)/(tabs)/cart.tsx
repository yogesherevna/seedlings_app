import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getActiveSubscriptionPlans, isSubscriptionEligible, type SubscriptionPlan } from '../../../services/subscriptions/subscriptionService';
import { getProducts } from '../../../services/products/productService';
import { getCartTotals, type PurchaseMode } from '../../../services/cart/cartService';
import { useAppStore } from '../../../store/appStore';

const money = (value: number, currency = 'INR') => {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `₹${value}`; }
};

export default function Cart() {
  const cart = useAppStore((s) => s.cart);
  const change = useAppStore((s) => s.changeQuantity);
  const remove = useAppStore((s) => s.removeFromCart);
  const refreshCartProducts = useAppStore((s) => s.refreshCartProducts);
  const setPurchaseMode = useAppStore((s) => s.setCartPurchaseMode);
  const setSubscriptionPlan = useAppStore((s) => s.setCartSubscriptionPlan);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const totals = getCartTotals(cart);

  useEffect(() => {
    let alive = true;
    void getProducts().then(async ({ products }) => {
      if (!alive) return;
      refreshCartProducts(products);
      if (products.some(isSubscriptionEligible)) {
        setLoadingPlans(true);
        try { const result = await getActiveSubscriptionPlans(); if (alive) setPlans(result); }
        catch { if (alive) setPlans([]); }
        finally { if (alive) setLoadingPlans(false); }
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, [refreshCartProducts]);

  const continueSubscription = (item: typeof cart[number]) => {
    if (!item.subscriptionPlanId) return;
    router.push({ pathname: '/(customer)/account/subscriptions', params: { productId: item.id, planId: item.subscriptionPlanId, quantity: String(item.quantity) } });
  };

  return (
    <Screen>
      <Text style={styles.title}>Your Cart</Text>
      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.muted}>Add fresh microgreens from the catalogue to get started.</Text>
          <View style={{ width: 190, marginTop: 12 }}><Button title="Start Shopping" onPress={() => router.push('/(customer)/(tabs)/products')} /></View>
        </View>
      ) : (
        <>
          <Text style={styles.intro}>Review your products and choose one-time purchase or subscription where available.</Text>
          {cart.map((item) => {
            const itemMrp = item.mrp && item.mrp > 0 ? item.mrp : item.price;
            const itemSavings = Math.max(0, itemMrp - item.price) * item.quantity;
            const canSubscribe = isSubscriptionEligible(item);
            const imageSource = item.imageUrl?.startsWith('http') ? { uri: item.imageUrl } : require('../../../assets/products/placeholder.png');
            return (
              <View key={item.id} style={styles.itemCard}>
                <Image source={imageSource} style={styles.image} resizeMode="contain" />
                <View style={styles.itemBody}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View style={styles.priceRow}><Text style={styles.price}>{money(item.price, item.currency)}</Text>{itemMrp > item.price ? <Text style={styles.mrp}>{money(itemMrp, item.currency)}</Text> : null}</View>
                  {itemSavings > 0 ? <Text style={styles.saving}>Save {money(itemSavings, item.currency)}</Text> : null}
                  <View style={styles.controls}>
                    <Pressable onPress={() => change(item.id, -1)} style={styles.stepButton}><Text style={styles.step}>−</Text></Pressable>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <Pressable onPress={() => change(item.id, 1)} style={styles.stepButton}><Text style={styles.step}>+</Text></Pressable>
                    <Pressable onPress={() => remove(item.id)} style={{ marginLeft: 'auto' }}><Text style={styles.remove}>Remove</Text></Pressable>
                  </View>

                  {canSubscribe ? <View style={styles.purchaseBox}>
                    <Text style={styles.purchaseTitle}>How would you like to buy?</Text>
                    <Text style={styles.mutedSmall}>Choose one-time purchase or subscription for each product.</Text>
                    <View style={styles.modeRow}>
                      <Pressable onPress={() => setPurchaseMode(item.id, 'one-time')} style={[styles.mode, item.purchaseMode === 'one-time' && styles.modeSelected]}><Text style={item.purchaseMode === 'one-time' ? styles.modeTextSelected : styles.modeText}>One-time purchase</Text><Text style={styles.modeHint}>Buy this box once.</Text></Pressable>
                      <Pressable onPress={() => setPurchaseMode(item.id, 'subscription')} style={[styles.mode, item.purchaseMode === 'subscription' && styles.modeSelected]}><Text style={item.purchaseMode === 'subscription' ? styles.modeTextSelected : styles.modeText}>Subscribe</Text><Text style={styles.modeHint}>Recurring delivery.</Text></Pressable>
                    </View>
                    {item.purchaseMode === 'subscription' ? <>
                      {loadingPlans ? <View style={styles.planLoading}><ActivityIndicator size="small" color={colors.greenDark} /><Text style={styles.mutedSmall}>Loading subscription plans…</Text></View> : plans.length ? <View style={{ marginTop: 9 }}>
                        <Text style={styles.planLabel}>Choose a plan</Text>
                        {plans.map((plan) => <Pressable key={plan.id} onPress={() => setSubscriptionPlan(item.id, plan.id)} style={[styles.plan, item.subscriptionPlanId === plan.id && styles.planSelected]}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.mutedSmall}>{money(plan.price)}{plan.deliveriesPerTerm ? ` · ${plan.deliveriesPerTerm} deliveries` : ''}</Text></Pressable>)}
                      </View> : <Text style={styles.mutedSmall}>Subscription plans are currently unavailable.</Text>}
                      <View style={{ marginTop: 9 }}><Button title="Continue with subscription" onPress={() => continueSubscription(item)} /></View>
                    </> : null}
                  </View> : null}
                </View>
                <Text style={styles.lineTotal}>{money(item.price * item.quantity, item.currency)}</Text>
              </View>
            );
          })}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.line}><Text style={styles.muted}>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Text><Text style={styles.muted}>{money(totals.subtotal, cart[0]?.currency || 'INR')}</Text></View>
            {totals.savings > 0 ? <View style={styles.line}><Text style={styles.saving}>You save</Text><Text style={styles.saving}>{money(totals.savings, cart[0]?.currency || 'INR')}</Text></View> : null}
            <View style={[styles.line, { borderBottomWidth: 0 }]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{money(totals.total, cart[0]?.currency || 'INR')}</Text></View>
            <Text style={styles.deliveryNote}>Delivery charges are calculated during checkout.</Text>
            <Button title="Proceed to Checkout" onPress={() => router.push('/(customer)/checkout')} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = {
  title: { fontSize: 24, fontWeight: '900' as const, color: colors.ink, marginTop: 10 },
  intro: { color: colors.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 5 },
  empty: { alignItems: 'center' as const, paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '900' as const, color: colors.ink },
  muted: { color: colors.inkSoft, fontSize: 13 },
  mutedSmall: { color: colors.inkSoft, fontSize: 12, lineHeight: 17 },
  itemCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 14, padding: 10, flexDirection: 'row' as const, marginTop: 12, flexWrap: 'wrap' as const },
  image: { width: 82, height: 82, borderRadius: 10, backgroundColor: colors.block },
  itemBody: { flex: 1, marginLeft: 10, minWidth: 0 },
  name: { fontWeight: '800' as const, color: colors.ink },
  priceRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 7, marginTop: 5 },
  price: { fontSize: 16, fontWeight: '900' as const, color: colors.ink },
  mrp: { color: colors.inkFaint, fontSize: 12, textDecorationLine: 'line-through' as const },
  saving: { color: colors.greenDark, fontSize: 12, fontWeight: '800' as const, marginTop: 3 },
  controls: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 9 },
  stepButton: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: colors.line, alignItems: 'center' as const, justifyContent: 'center' as const },
  step: { fontSize: 20, color: colors.greenDark, fontWeight: '900' as const, lineHeight: 22 },
  quantity: { minWidth: 34, textAlign: 'center' as const, fontWeight: '900' as const, color: colors.ink },
  remove: { color: colors.danger, fontWeight: '800' as const, fontSize: 12 },
  lineTotal: { fontWeight: '900' as const, color: colors.ink, marginLeft: 'auto', marginTop: 8 },
  purchaseBox: { width: '100%', marginTop: 14, padding: 10, backgroundColor: '#fafaf7', borderRadius: 10 },
  purchaseTitle: { fontWeight: '900' as const, color: colors.ink },
  modeRow: { flexDirection: 'row' as const, gap: 8, marginTop: 9 },
  mode: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 9, padding: 9 },
  modeSelected: { borderColor: colors.greenDark, backgroundColor: colors.greenTint },
  modeText: { color: colors.inkSoft, fontWeight: '800' as const, fontSize: 12 },
  modeTextSelected: { color: colors.greenDark, fontWeight: '900' as const, fontSize: 12 },
  modeHint: { color: colors.inkSoft, fontSize: 10, marginTop: 3 },
  planLabel: { color: colors.ink, fontWeight: '800' as const, fontSize: 12 },
  plan: { borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 9, padding: 9, marginTop: 6 },
  planSelected: { borderColor: colors.green, backgroundColor: colors.greenTint },
  planName: { color: colors.ink, fontWeight: '800' as const },
  planLoading: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 9 },
  summary: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 16, marginTop: 14 },
  summaryTitle: { fontWeight: '900' as const, fontSize: 17, color: colors.ink, marginBottom: 4 },
  line: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  totalLabel: { fontWeight: '900' as const, color: colors.ink },
  total: { fontWeight: '900' as const, fontSize: 19, color: colors.ink },
  deliveryNote: { color: colors.inkSoft, fontSize: 12, marginBottom: 12, lineHeight: 17 },
};
