import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ProductCard, Screen, SearchBar } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getProducts } from '../../../services/products/productService';
import type { Product } from '../../../services/products/productService';

export default function Products() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
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
    } catch {
      setError('Unable to load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const list = products.filter((p) => (cat === 'All' || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()));

  return <Screen>
    <Text style={{ fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: 10 }}>Products</Text>
    <SearchBar value={q} onChangeText={setQ} />
    <View style={{ flexDirection: 'row', gap: 7, marginVertical: 12, flexWrap: 'wrap' }}>
      {categories.map((c) => <Pressable key={c} onPress={() => setCat(c)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: cat === c ? colors.greenTint : '#fff', borderWidth: 1, borderColor: cat === c ? colors.greenDark : colors.line }}><Text style={{ fontSize: 12, fontWeight: '700', color: cat === c ? colors.greenDark : colors.inkSoft }}>{c}</Text></Pressable>)}
    </View>
    {loading ? <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator color={colors.greenDark} /><Text style={{ color: colors.inkSoft, marginTop: 8 }}>Loading products…</Text></View> : error ? <View style={{ paddingVertical: 30, alignItems: 'center' }}><Text style={{ color: colors.inkSoft }}>{error}</Text><Pressable onPress={() => load(true)} style={{ marginTop: 12 }}><Text style={{ color: colors.greenDark, fontWeight: '800' }}>{refreshing ? 'Refreshing…' : 'Retry'}</Text></Pressable></View> : list.length === 0 ? <Text style={{ color: colors.inkSoft, paddingVertical: 30 }}>No products found.</Text> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{list.map((p) => <ProductCard key={p.id} product={p} onPress={() => router.push({ pathname: '/(customer)/product/[id]', params: { id: p.id } })} />)}</View>}
  </Screen>;
}
