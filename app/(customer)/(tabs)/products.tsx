import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ProductCard, Screen, SearchBar } from '../../../components/UI';
import { colors } from '../../../constants/theme';
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
      if (!forceRefresh) {
        void refreshProducts().then((fresh) => setProducts(fresh)).catch(() => {});
      }
    } catch {
      setError('Unable to load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const moods = useMemo(() => ['All', ...Array.from(new Set(products.flatMap((p) => p.moods).filter(Boolean)))], [products]);
  const list = products.filter((p) => (cat === 'All' || p.category === cat) && (mood === 'All' || p.moods.some((value) => value.toLowerCase() === mood.toLowerCase())) && p.name.toLowerCase().includes(q.toLowerCase()));

  return <Screen>
    <Text style={{ fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: 10 }}>Products</Text>
    <SearchBar value={q} onChangeText={setQ} />
    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.inkSoft, marginTop: 12 }}>Category</Text>
    <View style={{ flexDirection: 'row', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
      {categories.map((c) => <Pressable key={c} onPress={() => setCat(c)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: cat === c ? colors.greenTint : '#fff', borderWidth: 1, borderColor: cat === c ? colors.greenDark : colors.line }}><Text style={{ fontSize: 12, fontWeight: '700', color: cat === c ? colors.greenDark : colors.inkSoft }}>{c}</Text></Pressable>)}
    </View>
    {moods.length > 1 ? <><Text style={{ fontSize: 13, fontWeight: '800', color: colors.inkSoft, marginTop: 9 }}>Shop by mood</Text><View style={{ flexDirection: 'row', gap: 7, marginTop: 7, marginBottom: 10, flexWrap: 'wrap' }}>{moods.map((m) => <Pressable key={m} onPress={() => setMood(m)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: mood === m ? colors.orangeTint : '#fff', borderWidth: 1, borderColor: mood === m ? colors.orange : colors.line }}><Text style={{ fontSize: 12, fontWeight: '700', color: mood === m ? colors.orangeDark : colors.inkSoft }}>{m}</Text></Pressable>)}</View></> : null}
    {loading ? <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={colors.greenDark} /><Text style={{ color: colors.inkSoft, marginTop: 8 }}>Loading products…</Text></View> : error ? <View style={{ paddingVertical: 30, alignItems: 'center' }}><Text style={{ color: colors.inkSoft }}>{error}</Text><Pressable onPress={() => load(true)} style={{ marginTop: 12 }}><Text style={{ color: colors.greenDark, fontWeight: '800' }}>{refreshing ? 'Refreshing…' : 'Retry'}</Text></Pressable></View> : list.length === 0 ? <Text style={{ color: colors.inkSoft, paddingVertical: 30 }}>No products found.</Text> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{list.map((p) => <ProductCard key={p.id} product={p} onPress={() => router.push({ pathname: '/(customer)/product/[id]', params: { id: p.id } })} />)}</View>}
  </Screen>;
}
