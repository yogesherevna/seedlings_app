import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../../components/UI';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import { getProducts, refreshProducts, type Product } from '../../../services/products/productService';
import { getActiveSubscriptionPlans, type SubscriptionPlan } from '../../../services/subscriptions/subscriptionService';
import { useAppStore } from '../../../store/appStore';

const money = (value: number, currency = 'INR') => {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `₹${value}`; }
};

function nextWeekSaturday() {
  const date = new Date();
  const day = date.getDay();
  const days = day === 6 ? 7 : (6 - day + 7) % 7;
  date.setDate(date.getDate() + (days || 7));
  return date.toISOString().slice(0, 10);
}

/** The website stores descriptions as HTML rich text. Keep the same content on native UI without adding a web page. */
function richTextToNativeText(value?: string) {
  if (!value?.trim()) return '';
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [planId, setPlanId] = useState('');
  const [subscriptionQuantity, setSubscriptionQuantity] = useState(1);
  const [startDate, setStartDate] = useState(nextWeekSaturday());
  const addToCart = useAppStore((s) => s.addToCart);
  const addSubscriptionToCart = useAppStore((s) => s.addSubscriptionToCart);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const result = await getProducts();
        if (!alive) return;
        setProducts(result.products);
        void refreshProducts().then((fresh) => { if (alive) setProducts(fresh); }).catch(() => {});
        const product = result.products.find((item) => item.id === id);
        if (product?.active) {
          try {
            const activePlans = await getActiveSubscriptionPlans();
            if (!alive) return;
            setPlans(activePlans.filter((plan) => plan.active === true && Number(plan.price ?? 0) >= 0));
          } catch {
            if (alive) setPlans([]);
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const product = useMemo(() => products.find((item) => item.id === id), [products, id]);
  const canSubscribe = Boolean(product?.active && plans.length > 0);
  const canBuyOneTime = Boolean(product?.oneTimePurchase);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.greenDark} /></View>;
  if (!product) return <View style={styles.screen}><Text style={styles.muted}>Product not found.</Text></View>;

  const imageSource = product.imageUrl?.startsWith('http') ? { uri: product.imageUrl } : require('../../../assets/products/placeholder.png');
  const saving = Math.max(0, (product.mrp ?? product.price) - product.price);
  const shortDescription = richTextToNativeText(product.shortDescription);
  const description = richTextToNativeText(product.description) || 'Freshly grown microgreens, harvested with care and prepared for delivery.';

  const add = () => {
    if (!canBuyOneTime || !product.inStock) return;
    addToCart(product, product.defaultWeight);
    for (let i = 1; i < quantity; i += 1) addToCart(product, product.defaultWeight);
    router.push('/(customer)/(tabs)/cart');
  };

  const subscribe = () => {
    if (!canSubscribe || !planId) return;
    const plan = plans.find((item) => item.id === planId);
    if (!plan) return;
    addSubscriptionToCart(product, {
      id: plan.id,
      name: plan.name,
      frequency: plan.frequency,
      deliveriesPerTerm: plan.deliveriesPerTerm,
    }, startDate, subscriptionQuantity);
    setSheetOpen(false);
    router.push('/(customer)/(tabs)/cart');
  };

  const quantity = subscriptionQuantity;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.screen}>
          <Image source={imageSource} style={styles.productImage} resizeMode="contain" />
          <Text style={styles.tag}>{product.type === 'multiple' ? 'Salable combo' : 'Fresh microgreen'}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.rating}>{product.popular ? 'Featured · Fresh availability' : 'Fresh availability'}</Text>

          {shortDescription ? <Text style={styles.shortDescription}>{shortDescription}</Text> : null}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(product.price, product.currency)}</Text>
            {product.mrp && product.mrp > product.price ? <Text style={styles.mrp}>{money(product.mrp, product.currency)}</Text> : null}
            {saving > 0 ? <Text style={styles.saving}>Save {money(saving, product.currency)}</Text> : null}
          </View>

          {canBuyOneTime ? <View style={styles.oneTimeContent}>
            <Text style={styles.purchaseHeading}>One-time purchase</Text>
            <Button title={product.inStock ? `Add to Cart — ${money(product.price, product.currency)}` : 'Currently Unavailable'} onPress={add} disabled={!product.inStock} />
          </View> : null}

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Availability</Text>
            <Text style={styles.muted}>{product.inStock ? 'Available for purchase.' : 'Current packed stock is limited.'}</Text>
            <Text style={[styles.infoLabel, { marginTop: 12 }]}>Purchase</Text>
            <Text style={styles.muted}>{canBuyOneTime ? 'One-time purchase available.' : 'Purchase unavailable.'}</Text>
            <Text style={[styles.infoLabel, { marginTop: 12 }]}>Delivery</Text>
            <Text style={styles.muted}>Weekend delivery slots.</Text>
          </View>

          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Product description</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={{ height: canSubscribe ? 150 : 100 }} />
        </View>
      </ScrollView>

      {canSubscribe ? <View style={styles.fixedActions}>
        <Pressable onPress={() => setSheetOpen(true)} style={styles.subscribeCta}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subscribeTitle}>Subscribe</Text>
            <Text style={styles.subscribeSubtitle}>Set it once and enjoy automatic deliveries</Text>
          </View>
          <Text style={styles.subscribeArrow}>›</Text>
        </Pressable>
      </View> : null}

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setSheetOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>Subscribe</Text>
                <Text style={styles.sheetTitle}>{product.name}</Text>
                <Text style={styles.muted}>Set it once and enjoy automatic deliveries.</Text>
              </View>
              <Pressable onPress={() => setSheetOpen(false)} hitSlop={10}><Text style={styles.close}>×</Text></Pressable>
            </View>

            <View style={styles.subscribeProductCard}>
              <Image source={imageSource} style={styles.thumb} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bold}>{product.name}</Text>
                <Text style={styles.muted}>{product.type === 'multiple' ? 'Combo' : 'Fresh microgreen'}</Text>
              </View>
              <Text style={styles.planPrice}>{money(product.price, product.currency)}</Text>
            </View>

            <Text style={styles.stepTitle}>1 · Select plan</Text>
            {plans.map((plan) => (
              <Pressable key={plan.id} onPress={() => setPlanId(plan.id)} style={[styles.plan, planId === plan.id && styles.planSelected]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bold}>{plan.name}</Text>
                  <Text style={styles.muted}>{money(Number(plan.price ?? 0), product.currency)} / term</Text>
                  <Text style={styles.planMeta}>{Number(plan.deliveriesPerTerm ?? 0) > 0 ? `${Number(plan.deliveriesPerTerm)} deliveries / term` : 'Ongoing deliveries'} · {plan.deliveryChargeMode === 'per_delivery' && Number(plan.deliveryCharge ?? 0) > 0 ? `+ ${money(Number(plan.deliveryCharge), product.currency)} / delivery` : 'Delivery included'}</Text>
                </View>
                {planId === plan.id ? <Text style={styles.selected}>Selected</Text> : null}
              </Pressable>
            ))}

            <Text style={styles.stepTitle}>2 · Quantity</Text>
            <View style={styles.quantityControl}>
              <Pressable onPress={() => setSubscriptionQuantity((value) => Math.max(1, value - 1))} style={styles.quantityButton}><Text style={styles.quantityText}>−</Text></Pressable>
              <Text style={styles.quantityValue}>{subscriptionQuantity}</Text>
              <Pressable onPress={() => setSubscriptionQuantity((value) => value + 1)} style={styles.quantityButton}><Text style={styles.quantityText}>+</Text></Pressable>
            </View>

            <Text style={styles.stepTitle}>3 · Start date</Text>
            <View style={styles.dateBox}><TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" style={styles.dateInput} /><Text style={styles.muted}>Saturday delivery</Text></View>

            <View style={styles.benefit}><Text style={styles.bold}>Delivery included</Text><Text style={styles.muted}>Delivery address will be selected on the subscription screen.</Text></View>
            <Button title={planId ? 'Subscribe' : 'Select a subscription'} onPress={subscribe} disabled={!planId} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  root: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, backgroundColor: colors.paper, alignItems: 'center' as const, justifyContent: 'center' as const },
  screen: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  scroll: { paddingBottom: 12 },
  productImage: { width: '100%' as const, height: 250, backgroundColor: colors.block, borderRadius: radius.xl },
  tag: { color: colors.greenDark, fontSize: typography.caption, fontWeight: '900' as const, marginTop: spacing.lg, textTransform: 'uppercase' as const },
  title: { fontSize: 25, lineHeight: 30, fontWeight: '900' as const, color: colors.ink, marginTop: 6 },
  rating: { color: colors.inkSoft, fontSize: 12, marginTop: 4 },
  shortDescription: { color: colors.inkSoft, fontSize: 14, lineHeight: 21, marginTop: 12 },
  priceRow: { flexDirection: 'row' as const, alignItems: 'baseline' as const, gap: 8, flexWrap: 'wrap' as const, marginTop: 12 },
  price: { fontSize: 23, fontWeight: '900' as const, color: colors.ink },
  mrp: { color: colors.inkFaint, textDecorationLine: 'line-through' as const },
  saving: { color: colors.greenDark, fontWeight: '800' as const },
  infoCard: { backgroundColor: colors.greenTint, borderRadius: 14, padding: 14, marginTop: 18 },
  infoLabel: { color: colors.ink, fontWeight: '900' as const },
  muted: { color: colors.inkSoft, marginTop: 3, lineHeight: 19 },
  descriptionCard: { backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 15, marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '900' as const, color: colors.ink },
  description: { color: colors.inkSoft, lineHeight: 21, marginTop: 7 },
  fixedActions: { position: 'absolute' as const, left: 0, right: 0, bottom: 0, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 12 },
  oneTimeContent: { marginTop: 18 },
  purchaseHeading: { fontSize: 12, fontWeight: '900' as const, color: colors.ink, marginBottom: 6 },
  subscribeCta: { minHeight: 60, borderRadius: 14, backgroundColor: colors.orange, flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 15 },
  subscribeTitle: { color: colors.white, fontSize: 16, fontWeight: '900' as const },
  subscribeSubtitle: { color: colors.white, fontSize: 11, marginTop: 2 },
  subscribeArrow: { color: colors.white, fontSize: 30, fontWeight: '300' as const, marginLeft: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' as const },
  modalDismiss: { flex: 1 },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.lg, maxHeight: '90%' as const },
  handle: { width: 42, height: 4, borderRadius: 4, backgroundColor: colors.line, alignSelf: 'center' as const, marginBottom: 12 },
  sheetHead: { flexDirection: 'row' as const, alignItems: 'flex-start' as const },
  eyebrow: { color: colors.orangeDark, fontSize: 11, fontWeight: '900' as const, textTransform: 'uppercase' as const },
  sheetTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' as const, marginTop: 3 },
  close: { color: colors.inkSoft, fontSize: 30, lineHeight: 30 },
  subscribeProductCard: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 13, padding: 10, marginTop: 14 },
  thumb: { width: 58, height: 58, borderRadius: 10, backgroundColor: colors.block },
  bold: { color: colors.ink, fontWeight: '900' as const },
  planPrice: { color: colors.greenDark, fontWeight: '900' as const },
  stepTitle: { color: colors.ink, fontWeight: '900' as const, marginTop: 15, marginBottom: 7 },
  plan: { flexDirection: 'row' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 12, padding: 11, marginBottom: 7, backgroundColor: colors.panel },
  planSelected: { borderColor: colors.green, backgroundColor: colors.greenTint },
  planMeta: { color: colors.inkSoft, fontSize: 11, marginTop: 2 },
  selected: { color: colors.greenDark, fontSize: 11, fontWeight: '900' as const },
  quantityControl: { flexDirection: 'row' as const, alignItems: 'center' as const, alignSelf: 'flex-start' as const, gap: 12 },
  quantityButton: { width: 40, height: 40, borderRadius: 11, borderWidth: 1, borderColor: colors.line, alignItems: 'center' as const, justifyContent: 'center' as const },
  quantityText: { fontSize: 22, color: colors.greenDark, fontWeight: '900' as const },
  quantityValue: { minWidth: 30, textAlign: 'center' as const, color: colors.ink, fontWeight: '900' as const },
  dateBox: { borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 12, backgroundColor: colors.panel, padding: 11 },
  dateValue: { color: colors.ink, fontWeight: '900' as const },
  dateInput: { color: colors.ink, fontWeight: '900' as const, paddingVertical: 2 },
  benefit: { backgroundColor: colors.greenTint, borderRadius: 12, padding: 11, marginVertical: 14 },
};
