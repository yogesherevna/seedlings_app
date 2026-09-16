import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Chip, PageTitle, ProductCard, Screen, SearchBar } from '../../../components/UI';
import { colors, spacing, typography } from '../../../constants/theme';
import { getProducts, refreshProducts } from '../../../services/products/productService';
import type { Product } from '../../../services/products/productService';

export default function Products() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [mood, setMood] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (forceRefresh = false) => {
    try {
      setError('');
      if (forceRefresh) setRefreshing(true); else setLoading(true);
      const result = await getProducts({ forceRefresh });
      setProducts(result.products);
      if (!forceRefresh) void refreshProducts().then((fresh) => setProducts(fresh)).catch(() => {});
    } catch { setError('Unable to load products. Please try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void load(); }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))], [products]);
  const moods = useMemo(() => ['All', ...Array.from(new Set(products.flatMap((p) => p.moods).filter(Boolean)))], [products]);
  const list = products.filter((p) => (cat === 'All' || p.category === cat) && (mood === 'All' || p.moods.some((value) => value.toLowerCase() === mood.toLowerCase())) && p.name.toLowerCase().includes(q.toLowerCase()));

  return <Screen>
    <PageTitle title="Products" subtitle="Fresh microgreens, ready for your table." />
    <SearchBar value={q} onChangeText={setQ} />

    <Text style={styles.filterLabel}>Category</Text>
    <View style={styles.chips}>{categories.map((c) => <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(c)} />)}</View>

    {moods.length > 1 ? <><Text style={styles.filterLabel}>Shop by mood</Text><View style={styles.chips}>{moods.map((m) => <Chip key={m} label={m} selected={mood === m} accent="orange" onPress={() => setMood(m)} />)}</View></> : null}

    {loading ? <View style={styles.state}><ActivityIndicator size="large" color={colors.greenDark} /><Text style={styles.stateText}>Loading fresh products…</Text></View> : error ? <View style={styles.state}><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => load(true)} style={styles.retry}><Text style={styles.retryText}>{refreshing ? 'Refreshing…' : 'Retry'}</Text></Pressable></View> : list.length === 0 ? <View style={styles.state}><Text style={styles.noTitle}>No products found</Text><Text style={styles.stateText}>Try another search or category.</Text></View> : <View style={styles.grid}>{list.map((p) => <ProductCard key={p.id} product={p} onPress={() => router.push({ pathname: '/(customer)/product/[id]', params: { id: p.id } })} />)}</View>}
  </Screen>;
}

const styles = {
  filterLabel: { fontFamily: typography.fontFamily, fontSize: 12, fontWeight: '900' as const, color: colors.inkSoft, marginTop: spacing.lg, marginBottom: 7 },
  chips: { flexDirection: 'row' as const, gap: 7, flexWrap: 'wrap' as const },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const, marginTop: spacing.lg },
  state: { alignItems: 'center' as const, paddingVertical: 52 },
  stateText: { fontFamily: typography.fontFamily, color: colors.inkSoft, fontSize: 13, marginTop: 9, textAlign: 'center' as const },
  noTitle: { fontFamily: typography.fontFamily, color: colors.ink, fontSize: 17, fontWeight: '900' as const },
  retry: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.greenTint },
  retryText: { fontFamily: typography.fontFamily, color: colors.greenDark, fontWeight: '900' as const, fontSize: 12 },
};
