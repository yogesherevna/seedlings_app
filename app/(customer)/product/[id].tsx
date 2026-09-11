import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getProducts, refreshProducts, isSubscriptionEligible, type Product } from '../../../services/products/productService';
import { getActiveSubscriptionPlans, type SubscriptionPlan } from '../../../services/subscriptions/subscriptionService';
import { useAppStore } from '../../../store/appStore';

const money = (value: number, currency = 'INR') => {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `₹${value}`; }
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseMode, setPurchaseMode] = useState<'one-time' | 'subscription'>('one-time');
  const [planId, setPlanId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAppStore((s) => s.addToCart);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const result = await getProducts();
        if (!alive) return;
        setProducts(result.products);
        void refreshProducts().then((fresh) => { if (alive) setProducts(fresh); }).catch(() => {});
        const product = result.products.find((item) => item.id === id);
        if (product && !product.oneTimePurchase && isSubscriptionEligible(product)) setPurchaseMode('subscription');
        if (product && isSubscriptionEligible(product)) {
          try { setPlans(await getActiveSubscriptionPlans()); } catch { if (alive) setPlans([]); }
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const product = useMemo(() => products.find((item) => item.id === id), [products, id]);
  const canSubscribe = Boolean(product && isSubscriptionEligible(product));
  const canBuyOneTime = Boolean(product?.oneTimePurchase);

  if (loading) return <Screen><ActivityIndicator color={colors.greenDark} style={{ marginTop: 40 }} /></Screen>;
  if (!product) return <Screen><Header title="Product" onBack={() => router.back()} /><Text style={{ color: colors.inkSoft }}>Product not found.</Text></Screen>;

  const imageSource = product.imageUrl?.startsWith('http') ? { uri: product.imageUrl } : require('../../../assets/products/placeholder.png');
  const saving = Math.max(0, (product.mrp ?? product.price) - product.price);

  const add = () => {
    if (!canBuyOneTime || !product.inStock) return;
    addToCart(product, product.defaultWeight);
    if (quantity > 1) {
      for (let i = 1; i < quantity; i += 1) addToCart(product, product.defaultWeight);
    }
    router.push('/(customer)/(tabs)/cart');
  };

  const subscribe = () => {
    if (!canSubscribe || !planId) return;
    router.push({
      pathname: '/(customer)/account/subscriptions',
      params: { productId: product.id, planId, quantity: String(quantity) },
    });
  };

  return (
    <Screen>
      <Header title="" onBack={() => router.back()} />
      <Image source={imageSource} style={{ width: '100%', height: 250, backgroundColor: colors.block, borderRadius: 16 }} resizeMode="contain" />
      <Text style={{ fontSize: 25, fontWeight: '900', color: colors.ink, marginTop: 16 }}>{product.name}</Text>
      <Text style={{ color: colors.inkSoft, marginTop: 5, lineHeight: 20 }}>{product.description || 'Freshly grown microgreens, harvested with care and prepared for delivery.'}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <Text style={{ fontSize: 23, fontWeight: '900', color: colors.ink }}>{money(product.price, product.currency)}</Text>
        {product.mrp && product.mrp > product.price ? <Text style={{ color: colors.inkFaint, textDecorationLine: 'line-through' }}>{money(product.mrp, product.currency)}</Text> : null}
        {saving > 0 ? <Text style={{ color: colors.greenDark, fontWeight: '800' }}>Save {money(saving, product.currency)}</Text> : null}
      </View>

      <View style={{ backgroundColor: colors.greenTint, borderRadius: 12, padding: 12, marginTop: 18 }}>
        <Text style={{ color: product.inStock ? colors.greenDark : colors.danger, fontWeight: '800' }}>{product.inStock ? 'Available for purchase.' : 'Current packed stock is limited.'}</Text>
      </View>

      {(canBuyOneTime || canSubscribe) ? <>
        <Text style={{ fontWeight: '800', color: colors.ink, marginTop: 18, marginBottom: 8 }}>{canBuyOneTime && canSubscribe ? 'Choose purchase option' : 'Purchase option'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {canBuyOneTime ? <Pressable onPress={() => { setPurchaseMode('one-time'); setPlanId(''); }} style={[styles.option, purchaseMode === 'one-time' && styles.optionSelected]}><Text style={purchaseMode === 'one-time' ? styles.optionTextSelected : styles.optionText}>One-time purchase</Text></Pressable> : null}
          {canSubscribe ? <Pressable onPress={() => setPurchaseMode('subscription')} style={[styles.option, purchaseMode === 'subscription' && styles.optionSelected]}><Text style={purchaseMode === 'subscription' ? styles.optionTextSelected : styles.optionText}>Subscribe</Text></Pressable> : null}
        </View>
      </> : null}

      <Text style={{ fontWeight: '800', color: colors.ink, marginTop: 18, marginBottom: 8 }}>Quantity</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={styles.step}><Text style={styles.stepText}>−</Text></Pressable>
        <Text style={{ minWidth: 34, textAlign: 'center', fontWeight: '900', color: colors.ink }}>{quantity}</Text>
        <Pressable onPress={() => setQuantity((value) => value + 1)} style={styles.step}><Text style={styles.stepText}>+</Text></Pressable>
      </View>

      {purchaseMode === 'subscription' && canSubscribe ? <View style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.lineSoft, padding: 12 }}>
        <Text style={{ fontWeight: '900', color: colors.ink }}>Choose a subscription</Text>
        {plans.length ? plans.map((plan) => <Pressable key={plan.id} onPress={() => setPlanId(plan.id)} style={[styles.plan, planId === plan.id && styles.planSelected]}><Text style={{ fontWeight: '900', color: colors.ink }}>{plan.name}</Text><Text style={{ color: colors.inkSoft, marginTop: 3 }}>{money(plan.price)}{plan.deliveriesPerTerm ? ` · ${plan.deliveriesPerTerm} deliveries` : ''}</Text></Pressable>) : <Text style={{ color: colors.inkSoft, marginTop: 6 }}>Subscription plans are currently unavailable.</Text>}
      </View> : null}

      <Text style={{ fontSize: 17, fontWeight: '900', color: colors.ink, marginTop: 20 }}>Product Info</Text>
      <Text style={{ color: colors.inkSoft, lineHeight: 20, marginTop: 6 }}>Grown with care and packed fresh. Keep refrigerated after delivery and consume while fresh.</Text>

      <View style={{ marginTop: 20, marginBottom: 30 }}>
        {purchaseMode === 'subscription' && canSubscribe ? <Button title={planId ? 'Subscribe' : 'Select a subscription'} onPress={subscribe} /> : <Button title={canBuyOneTime && product.inStock ? `Add to Cart — ${money(product.price, product.currency)}` : 'Currently Unavailable'} onPress={add} />}
      </View>
    </Screen>
  );
}

const styles = {
  option: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, alignItems: 'center' as const },
  optionSelected: { borderColor: colors.greenDark, backgroundColor: colors.greenTint },
  optionText: { color: colors.inkSoft, fontWeight: '800' as const },
  optionTextSelected: { color: colors.greenDark, fontWeight: '900' as const },
  step: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: 'center' as const, justifyContent: 'center' as const },
  stepText: { fontSize: 22, color: colors.greenDark, fontWeight: '900' as const },
  plan: { borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 10, padding: 11, marginTop: 8 },
  planSelected: { borderColor: colors.green, backgroundColor: colors.greenTint },
};
