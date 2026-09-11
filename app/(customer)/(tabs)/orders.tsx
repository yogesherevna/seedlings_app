import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getCustomerOrders, type CustomerOrder } from '../../../services/orders/orderService';
import { useAppStore } from '../../../store/appStore';

function money(value: unknown) { const n = Number(value ?? 0); return `₹${Number.isFinite(n) ? n : 0}`; }
function prettyStatus(value?: string) { return String(value ?? 'pending').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
function dateObject(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate();
  const d = new Date(String(value ?? '')); return Number.isNaN(d.getTime()) ? null : d;
}
function dateText(value: unknown) { const d = dateObject(value); return d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function orderType(order: CustomerOrder) { return String(order.orderType ?? '').toLowerCase() === 'subscription' ? 'subscription' : 'one_time'; }

export default function Orders() {
  const mobile = useAppStore((s) => s.customerMobile);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [filter, setFilter] = useState<'all' | 'one_time' | 'subscription' | 'past'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!mobile) { setOrders([]); setLoading(false); return; }
    setLoading(true); setError('');
    try { setOrders(await getCustomerOrders(mobile)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load your orders.'); }
    finally { setLoading(false); }
  }, [mobile]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = orders.filter((order) => {
    if (filter === 'one_time') return orderType(order) === 'one_time';
    if (filter === 'subscription') return orderType(order) === 'subscription';
    if (filter === 'past') {
      const date = dateObject(order.scheduledDeliveryDate ?? order.createdAt);
      return Boolean(date && date.getTime() < Date.now());
    }
    return true;
  });

  return <Screen>
    <Text style={{ fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: 10 }}>My Orders</Text>
    <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14, flexWrap: 'wrap' }}>
      {([['all', 'All'], ['one_time', 'One Time'], ['subscription', 'Subscription'], ['past', 'Past']] as const).map(([value, label]) => (
        <Pressable key={value} onPress={() => setFilter(value)} style={{ backgroundColor: filter === value ? colors.green : '#fff', borderWidth: 1, borderColor: filter === value ? colors.green : colors.line, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 }}>
          <Text style={{ color: filter === value ? '#fff' : colors.inkSoft, fontWeight: '800' }}>{label}</Text>
        </Pressable>
      ))}
    </View>
    {loading ? <View style={{ paddingTop: 35, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.green} /><Text style={{ color: colors.inkSoft, marginTop: 10 }}>Loading your orders…</Text></View>
      : error ? <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 16 }}><Text style={{ fontWeight: '800', color: colors.ink }}>{error}</Text><Pressable onPress={load} style={{ marginTop: 12 }}><Text style={{ color: colors.greenDark, fontWeight: '900' }}>Try again</Text></Pressable></View>
      : filtered.length === 0 ? <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 20, marginTop: 5 }}><Text style={{ fontWeight: '900', fontSize: 17, color: colors.ink }}>{orders.length ? 'No matching orders' : 'No orders yet'}</Text><Text style={{ color: colors.inkSoft, marginTop: 6, lineHeight: 20 }}>{orders.length ? 'Try another order filter.' : 'Your one-time purchases and subscription orders will appear here.'}</Text><Pressable onPress={() => router.push('/(customer)/(tabs)/products')} style={{ marginTop: 14 }}><Text style={{ color: colors.greenDark, fontWeight: '900' }}>Shop Fresh →</Text></Pressable></View>
      : filtered.map((o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        const summary = items.length === 1 ? String(items[0]?.productName ?? 'Product') : items.length > 1 ? `${String(items[0]?.productName ?? 'Product')} + ${items.length - 1} more` : 'Order';
        return <Pressable key={o.id} onPress={() => router.push(`/(customer)/order/${o.id}`)} style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 15, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={{ fontWeight: '900', color: colors.ink }}>{o.orderNumber ? `#${o.orderNumber}` : `#${o.id}`}</Text><Text style={{ fontWeight: '800', color: colors.greenDark }}>{prettyStatus(o.status)}</Text></View>
          <Text style={{ fontWeight: '800', color: colors.ink, marginTop: 8 }}>{summary}</Text>
          <Text style={{ color: colors.inkSoft, marginTop: 5 }}>Amount {money(o.total)} · Order {dateText(o.createdAt)}</Text>
          <Text style={{ color: colors.inkSoft, marginTop: 3 }}>Delivery {dateText(o.deliveryDate ?? o.scheduledDeliveryDate)} · {orderType(o) === 'subscription' ? 'Subscription' : 'One Time'}</Text>
          <Text style={{ color: colors.greenDark, fontWeight: '800', marginTop: 10 }}>View details ›</Text>
        </Pressable>;
      })}
  </Screen>;
}
