import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getProducts } from '../../../services/products/productService';
import { getUnifiedCartTotals } from '../../../services/cart/cartService';
import { useAppStore } from '../../../store/appStore';

const money = (value: number, currency = 'INR') => { try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); } catch { return `₹${value}`; } };

export default function Cart() {
  const cart = useAppStore((s) => s.cart);
  const subscriptionCart = useAppStore((s) => s.subscriptionCart);
  const change = useAppStore((s) => s.changeQuantity);
  const remove = useAppStore((s) => s.removeFromCart);
  const changeSubscription = useAppStore((s) => s.changeSubscriptionQuantity);
  const removeSubscription = useAppStore((s) => s.removeSubscriptionFromCart);
  const refreshCartProducts = useAppStore((s) => s.refreshCartProducts);
  const totals = getUnifiedCartTotals({ oneTimeItems: cart, subscriptionItems: subscriptionCart });
  const hasItems = cart.length > 0 || subscriptionCart.length > 0;

  useEffect(() => {
    let alive = true;
    void getProducts().then(async ({ products }) => {
      if (!alive) return;
      refreshCartProducts(products);
    }).catch(() => {});
    return () => { alive = false; };
  }, [refreshCartProducts, subscriptionCart.length]);

  return (
    <Screen>
      <Text style={styles.title}>Your Cart</Text>
      {!hasItems ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>Your cart is empty</Text><Text style={styles.muted}>Add fresh microgreens from the catalogue to get started.</Text><View style={{ width: 190, marginTop: 12 }}><Button title="Start Shopping" onPress={() => router.push('/(customer)/(tabs)/products')} /></View></View>
      ) : (
        <>
          {subscriptionCart.length ? <View><Text style={styles.sectionTitle}>Subscriptions</Text><Text style={styles.sectionHint}>Recurring deliveries selected from the product subscription option.</Text>{subscriptionCart.map((item) => {
            const itemMrp = item.mrp && item.mrp > 0 ? item.mrp : item.price; const savings = Math.max(0, itemMrp - item.price) * item.quantity; const imageSource = item.imageUrl?.startsWith('http') ? { uri: item.imageUrl } : require('../../../assets/products/placeholder.png');
            return <View key={`${item.id}:${item.planId}:${item.startDate}`} style={styles.itemCard}>
              <Image source={imageSource} style={styles.image} resizeMode="contain" /><View style={styles.itemBody}><Text style={styles.name}>{item.name}</Text><Text style={styles.subscriptionMeta}>{item.planName} · Starts {item.startDate}</Text><View style={styles.priceRow}><Text style={styles.price}>{money(item.price, item.currency)}</Text>{itemMrp > item.price ? <Text style={styles.mrp}>{money(itemMrp, item.currency)}</Text> : null}</View>{savings > 0 ? <Text style={styles.saving}>Save {money(savings, item.currency)}</Text> : null}<View style={styles.controls}><Pressable onPress={() => changeSubscription(item.id, item.planId, item.startDate, -1)} style={styles.stepButton}><Text style={styles.step}>−</Text></Pressable><Text style={styles.quantity}>{item.quantity}</Text><Pressable onPress={() => changeSubscription(item.id, item.planId, item.startDate, 1)} style={styles.stepButton}><Text style={styles.step}>+</Text></Pressable><Pressable onPress={() => removeSubscription(item.id, item.planId, item.startDate)} style={{ marginLeft: 'auto' }}><Text style={styles.remove}>Remove</Text></Pressable></View></View><Text style={styles.lineTotal}>{money(item.price * item.quantity, item.currency)}</Text>
            </View>;
          })}</View> : null}

          {cart.length ? <View><Text style={styles.sectionTitle}>One-time Purchases</Text>{cart.map((item) => {
            const itemMrp = item.mrp && item.mrp > 0 ? item.mrp : item.price; const savings = Math.max(0, itemMrp - item.price) * item.quantity; const imageSource = item.imageUrl?.startsWith('http') ? { uri: item.imageUrl } : require('../../../assets/products/placeholder.png');
            return <View key={item.id} style={styles.itemCard}><Image source={imageSource} style={styles.image} resizeMode="contain" /><View style={styles.itemBody}><Text style={styles.name}>{item.name}</Text><View style={styles.priceRow}><Text style={styles.price}>{money(item.price, item.currency)}</Text>{itemMrp > item.price ? <Text style={styles.mrp}>{money(itemMrp, item.currency)}</Text> : null}</View>{savings > 0 ? <Text style={styles.saving}>Save {money(savings, item.currency)}</Text> : null}<View style={styles.controls}><Pressable onPress={() => change(item.id, -1)} style={styles.stepButton}><Text style={styles.step}>−</Text></Pressable><Text style={styles.quantity}>{item.quantity}</Text><Pressable onPress={() => change(item.id, 1)} style={styles.stepButton}><Text style={styles.step}>+</Text></Pressable><Pressable onPress={() => remove(item.id)} style={{ marginLeft: 'auto' }}><Text style={styles.remove}>Remove</Text></Pressable></View></View><Text style={styles.lineTotal}>{money(item.price * item.quantity, item.currency)}</Text></View>;
          })}</View> : null}

          <View style={styles.summary}><Text style={styles.summaryTitle}>Order Summary</Text><View style={styles.line}><Text style={styles.muted}>MRP</Text><Text style={styles.muted}>{money(totals.mrpSubtotal, 'INR')}</Text></View><View style={styles.line}><Text style={styles.muted}>Subtotal</Text><Text style={styles.muted}>{money(totals.subtotal, 'INR')}</Text></View>{totals.savings > 0 ? <View style={styles.line}><Text style={styles.saving}>You save</Text><Text style={styles.saving}>{money(totals.savings, 'INR')}</Text></View> : null}<View style={[styles.line, { borderBottomWidth: 0 }]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{money(totals.total, 'INR')}</Text></View><Text style={styles.deliveryNote}>Delivery charges are calculated during checkout.</Text><Button title="Proceed to Checkout" onPress={() => router.push('/(customer)/checkout')} /></View>
        </>
      )}
    </Screen>
  );
}

const styles = {
  title: { fontSize: 24, fontWeight: '900' as const, color: colors.ink, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900' as const, color: colors.ink, marginTop: 18, marginBottom: 3 },
  sectionHint: { color: colors.inkSoft, fontSize: 12, lineHeight: 17 },
  empty: { alignItems: 'center' as const, paddingTop: 80 }, emptyTitle: { fontSize: 20, fontWeight: '900' as const, color: colors.ink }, muted: { color: colors.inkSoft, fontSize: 13 }, mutedSmall: { color: colors.inkSoft, fontSize: 12 },
  itemCard: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 14, padding: 10, flexDirection: 'row' as const, marginTop: 10, flexWrap: 'wrap' as const }, image: { width: 82, height: 82, borderRadius: 10, backgroundColor: colors.block }, itemBody: { flex: 1, marginLeft: 10, minWidth: 0 }, name: { fontWeight: '800' as const, color: colors.ink }, subscriptionMeta: { color: colors.inkSoft, fontSize: 11, marginTop: 3 }, priceRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 7, marginTop: 5 }, price: { fontSize: 16, fontWeight: '900' as const, color: colors.ink }, mrp: { color: colors.inkFaint, fontSize: 12, textDecorationLine: 'line-through' as const }, saving: { color: colors.greenDark, fontSize: 12, fontWeight: '800' as const, marginTop: 3 }, controls: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 9 }, stepButton: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: colors.line, alignItems: 'center' as const, justifyContent: 'center' as const }, step: { fontSize: 20, color: colors.greenDark, fontWeight: '900' as const, lineHeight: 22 }, quantity: { minWidth: 34, textAlign: 'center' as const, fontWeight: '900' as const, color: colors.ink }, remove: { color: colors.danger, fontWeight: '800' as const, fontSize: 12 }, lineTotal: { fontWeight: '900' as const, color: colors.ink, marginLeft: 'auto', marginTop: 8 }, planLoading: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 10 }, summary: { backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 16, marginTop: 16 }, summaryTitle: { fontWeight: '900' as const, fontSize: 17, color: colors.ink, marginBottom: 4 }, line: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.lineSoft }, totalLabel: { fontWeight: '900' as const, color: colors.ink }, total: { fontWeight: '900' as const, fontSize: 19, color: colors.ink }, deliveryNote: { color: colors.inkSoft, fontSize: 12, marginBottom: 12, lineHeight: 17 },
};
