import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { getCustomerOrders, type CustomerOrder } from '../../../services/orders/orderService';
import { createCustomerFeedback, getCustomerFeedback, type CustomerFeedback } from '../../../services/feedback/feedbackService';

function dateText(value: unknown) {
  if (!value) return '';
  try {
    const d = typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function' ? (value as any).toDate() : new Date(value as any);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export default function FeedbackScreen() {
  const mobile = useAppStore((s) => s.mobile);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [items, setItems] = useState<CustomerFeedback[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [orderId, setOrderId] = useState('');
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!mobile) { router.replace('/(customer)/auth/login'); return; }
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [feedback, customerOrders] = await Promise.all([getCustomerFeedback(mobile), getCustomerOrders(mobile)]);
      setItems(feedback); setOrders(customerOrders);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load feedback.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [mobile]);

  useEffect(() => { void load(); }, [load]);

  const selectedOrder = orders.find((o) => o.id === orderId);
  const orderProducts = useMemo(() => {
    if (!selectedOrder?.items?.length) return [];
    return selectedOrder.items.map((item) => ({ id: String(item.productId ?? ''), name: String(item.productName ?? 'Product') })).filter((x, i, a) => x.id && a.findIndex((y) => y.id === x.id) === i);
  }, [selectedOrder]);

  useEffect(() => { if (productId && !orderProducts.some((p) => p.id === productId)) setProductId(''); }, [orderProducts, productId]);

  const submit = async () => {
    if (!mobile) return;
    setSaving(true); setError('');
    try {
      await createCustomerFeedback({ mobile, rating, comment, orderId: orderId || undefined, productId: productId || undefined });
      setRating(0); setComment(''); setOrderId(''); setProductId('');
      Alert.alert('Feedback submitted', 'Thank you for sharing your experience.');
      setItems(await getCustomerFeedback(mobile));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit feedback.'); }
    finally { setSaving(false); }
  };

  return <Screen>

    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: colors.lineSoft }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>How was your experience?</Text>
        <Text style={{ color: colors.inkSoft, marginTop: 6, lineHeight: 20 }}>Tell us what you liked or what we can improve.</Text>
        <Text style={{ fontWeight: '900', color: colors.ink, marginTop: 16 }}>Rating</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>{[1,2,3,4,5].map((n) => <Pressable key={n} onPress={() => setRating(n)} accessibilityLabel={`${n} star rating`}><Text style={{ fontSize: 32, color: n <= rating ? '#d9a441' : '#cfd5cf' }}>★</Text></Pressable>)}</View>
        <Text style={{ fontWeight: '900', color: colors.ink, marginTop: 14 }}>Order (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          <Pressable onPress={() => { setOrderId(''); setProductId(''); }} style={{ borderWidth: 1, borderColor: !orderId ? colors.green : colors.lineSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 }}><Text style={{ color: !orderId ? colors.greenDark : colors.ink }}>General</Text></Pressable>
          {orders.slice(0, 10).map((o) => <Pressable key={o.id} onPress={() => { setOrderId(o.id); setProductId(''); }} style={{ borderWidth: 1, borderColor: orderId === o.id ? colors.green : colors.lineSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 }}><Text style={{ color: orderId === o.id ? colors.greenDark : colors.ink }}>{o.orderNumber || o.id.slice(0, 8)}{o.createdAt ? ` · ${dateText(o.createdAt)}` : ''}</Text></Pressable>)}
        </ScrollView>
        {!!orderProducts.length && <><Text style={{ fontWeight: '900', color: colors.ink, marginTop: 4 }}>Product (optional)</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>{orderProducts.map((p) => <Pressable key={p.id} onPress={() => setProductId(productId === p.id ? '' : p.id)} style={{ borderWidth: 1, borderColor: productId === p.id ? colors.green : colors.lineSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 }}><Text style={{ color: productId === p.id ? colors.greenDark : colors.ink }}>{p.name}</Text></Pressable>)}</ScrollView></>}
        <TextInput value={comment} onChangeText={setComment} multiline maxLength={1000} placeholder="Write your feedback" placeholderTextColor={colors.inkSoft} style={{ minHeight: 110, textAlignVertical: 'top', backgroundColor: '#fafcf9', borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 12, padding: 12, marginTop: 10, color: colors.ink }} />
        {!!error && <Text style={{ color: '#a33', marginTop: 10 }}>{error}</Text>}
        <Pressable disabled={saving} onPress={() => void submit()} style={{ backgroundColor: saving ? colors.line : colors.green, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 12 }}><Text style={{ color: '#fff', fontWeight: '900' }}>{saving ? 'Submitting…' : 'Submit Feedback'}</Text></Pressable>
      </View>

      <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink, marginTop: 20, marginBottom: 10 }}>Your previous feedback</Text>
      {loading ? <View style={{ padding: 30, alignItems: 'center' }}><ActivityIndicator /></View> : items.length === 0 ? <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16 }}><Text style={{ fontWeight: '900', color: colors.ink }}>No feedback submitted yet</Text></View> : items.map((item) => <View key={item.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 10 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: '#d9a441', fontSize: 18 }}>{'★'.repeat(Math.max(0, Math.min(5, item.rating)))}{'☆'.repeat(Math.max(0, 5 - Math.min(5, item.rating)))}</Text><Text style={{ color: colors.inkSoft, fontSize: 11 }}>{dateText(item.createdAt)}</Text></View>{!!item.comment && <Text style={{ color: colors.ink, lineHeight: 20, marginTop: 8 }}>{item.comment}</Text>}{item.status && <Text style={{ color: colors.inkSoft, fontSize: 11, marginTop: 7 }}>Status: {item.status}</Text>}</View>)}
      <Text style={{ fontSize: 11, color: colors.inkSoft, marginTop: 6, lineHeight: 17 }}>Feedback is stored against your customer account. Product reviews are not published publicly by this screen.</Text>
    </ScrollView>
  </Screen>;
}
