import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ProductCard, Screen, SearchBar, SectionHeader } from '../../../components/UI';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import { getProducts, refreshProducts } from '../../../services/products/productService';
import type { Product } from '../../../services/products/productService';
import { useAppStore } from '../../../store/appStore';
import { getCustomerProfile } from '../../../services/customerProfile';

export default function Home() {
  const [q, setQ] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const mobile = useAppStore((s) => s.mobile);

  useEffect(() => {
    let alive = true;
    void getProducts().then(r => {
      if (alive) setProducts(r.products);
      void refreshProducts().then(fresh => { if (alive) setProducts(fresh); }).catch(() => {});
    }).catch(() => { if (alive) setProducts([]); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!mobile) return;
    let alive = true;
    void getCustomerProfile(mobile).then(profile => { if (alive) setName(profile.name || ''); }).catch(() => {});
    return () => { alive = false; };
  }, [mobile]);

  const popular = products.filter(p => p.popular).filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  return <Screen>
    <View style={styles.greeting}>
      <Text style={styles.eyebrow}>Fresh from Seedlings</Text>
      <Text style={styles.greetingTitle}>Hello{name ? `, ${name.split(' ')[0]}` : ''}! 🌿</Text>
    </View>
    <SearchBar value={q} onChangeText={setQ} />

    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroKicker}>FRESH • LOCAL • WEEKLY</Text>
        <Text style={styles.heroTitle}>Small Greens.{`\n`}Big Nutrition.</Text>
        <Text style={styles.heroText}>Freshly harvested microgreens delivered with care.</Text>
        <Pressable onPress={() => router.push('/(customer)/(tabs)/products')} style={({ pressed }) => [styles.heroButton, pressed && { opacity: 0.82 }]}><Text style={styles.heroButtonText}>Shop Fresh</Text></Pressable>
      </View>
      <Text style={styles.heroLeaf}>🌱</Text>
    </View>

    <View style={styles.quickRow}>
      <Pressable onPress={() => router.push('/(customer)/(tabs)/products')} style={[styles.quickCard, styles.quickGreen]}>
        <Text style={styles.quickTitle}>One Time</Text><Text style={styles.quickText}>Fresh this weekend</Text><Text style={styles.quickArrow}>→</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/(customer)/account/subscriptions')} style={[styles.quickCard, styles.quickOrange]}>
        <Text style={[styles.quickTitle, { color: colors.orangeDark }]}>Subscriptions</Text><Text style={styles.quickText}>Save on every delivery</Text><Text style={[styles.quickArrow, { color: colors.orangeDark }]}>→</Text>
      </Pressable>
    </View>

    <SectionHeader title="Popular Products" action="View all" onAction={() => router.push('/(customer)/(tabs)/products')} />
    <View style={styles.grid}>{popular.slice(0, 4).map(p => <ProductCard key={p.id} product={p} onPress={() => router.push({ pathname: '/(customer)/product/[id]', params: { id: p.id } })} />)}</View>
  </Screen>;
}

const styles = {
  greeting: { marginTop: spacing.sm, marginBottom: spacing.sm },
  eyebrow: { fontFamily: typography.fontFamily, color: colors.greenDark, fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' as const },
  greetingTitle: { fontFamily: typography.fontFamily, color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: 2 },
  hero: { marginTop: spacing.md, minHeight: 190, backgroundColor: colors.greenDark, borderRadius: radius.xl, padding: spacing.xl, overflow: 'hidden', position: 'relative' as const },
  heroCopy: { maxWidth: '82%' as const },
  heroKicker: { fontFamily: typography.fontFamily, color: colors.greenTint, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { fontFamily: typography.fontFamily, color: colors.white, fontSize: 24, lineHeight: 28, fontWeight: '900', marginTop: 7 },
  heroText: { fontFamily: typography.fontFamily, color: colors.panel, fontSize: 12, lineHeight: 18, marginTop: 7 },
  heroButton: { alignSelf: 'flex-start' as const, backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, marginTop: 14 },
  heroButtonText: { fontFamily: typography.fontFamily, color: colors.greenDeep, fontSize: 12, fontWeight: '900' },
  heroLeaf: { position: 'absolute' as const, right: -5, bottom: -18, fontSize: 82, opacity: 0.17 },
  quickRow: { flexDirection: 'row' as const, gap: 10, marginTop: spacing.md },
  quickCard: { flex: 1, minHeight: 92, borderRadius: radius.lg, padding: spacing.md, position: 'relative' as const },
  quickGreen: { backgroundColor: colors.greenTint },
  quickOrange: { backgroundColor: colors.orangeTint },
  quickTitle: { fontFamily: typography.fontFamily, color: colors.greenDark, fontSize: 14, fontWeight: '900' },
  quickText: { fontFamily: typography.fontFamily, color: colors.inkSoft, fontSize: 11, marginTop: 3, maxWidth: '85%' as const },
  quickArrow: { position: 'absolute' as const, right: 12, bottom: 11, color: colors.greenDark, fontSize: 18, fontWeight: '900' },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const },
};
