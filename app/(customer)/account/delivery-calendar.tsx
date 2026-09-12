import { ActivityIndicator, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { getCustomerSubscriptions, type CustomerSubscription } from '../../../services/subscriptions/subscriptionService';

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const dateKey = (d: Date) => d.toISOString().slice(0, 10);

function buildSaturdays(start?: string, end?: string, limit = 60) {
  const first = parseDate(start);
  if (!first) return [] as string[];
  const last = parseDate(end);
  const cursor = new Date(first);
  const offset = (6 - cursor.getDay() + 7) % 7;
  cursor.setDate(cursor.getDate() + offset);
  const result: string[] = [];
  while (result.length < limit && (!last || cursor <= last)) {
    result.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return result;
}

export default function DeliveryCalendar() {
  const mobile = useAppStore(s => s.mobile);
  const [subs, setSubs] = useState<CustomerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    if (!mobile) { router.replace('/(customer)/auth/login'); return () => { alive = false; }; }
    (async () => {
      try { setSubs(await getCustomerSubscriptions(mobile)); }
      catch (e) { if (alive) setError(e instanceof Error ? e.message : 'Unable to load delivery calendar.'); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [mobile]);

  const active = subs.find(s => s.status === 'active') || subs.find(s => s.status === 'paused');
  const dates = useMemo(() => {
    if (!active) return [] as string[];
    const all = buildSaturdays(active.startDate, active.endDate, Math.max(60, active.totalDeliveries || 0));
    return active.totalDeliveries ? all.slice(0, active.totalDeliveries) : all;
  }, [active]);
  const generated = Math.max(0, active?.deliveriesGenerated || 0);
  const next = active?.nextDeliveryDate;

  return <Screen>

    {loading ? <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.green} /><Text style={{ color: colors.inkSoft, marginTop: 12 }}>Loading delivery calendar…</Text></View> : error ? <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16 }}><Text style={{ color: '#a33', fontWeight: '800' }}>{error}</Text></View> : !active ? <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16 }}><Text style={{ fontSize: 17, fontWeight: '900', color: colors.ink }}>No active subscription</Text><Text style={{ color: colors.inkSoft, marginTop: 7 }}>Your delivery calendar will appear here when you have an active subscription.</Text></View> : <>
      <View style={{ backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: colors.lineSoft, padding: 16, marginBottom: 14 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>{active.productName || 'Subscription'}</Text>
        <Text style={{ color: colors.inkSoft, marginTop: 5 }}>{active.sellingOptionLabel || 'Pack'} × {active.quantity || 1} · {active.frequency || ''} · Saturday delivery</Text>
        <Text style={{ color: colors.inkSoft, marginTop: 10 }}>Next delivery: <Text style={{ color: colors.ink, fontWeight: '900' }}>{next || '—'}</Text></Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink, marginBottom: 10 }}>Scheduled deliveries</Text>
      {dates.length ? dates.map((key, index) => {
        const d = parseDate(key)!; const done = index < generated; const isNext = key === next;
        return <View key={key} style={{ backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: isNext ? colors.green : colors.lineSoft, padding: 14, marginBottom: 9 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View><Text style={{ fontWeight: '900', color: colors.ink }}>{formatDate(d)}</Text><Text style={{ color: colors.inkSoft, marginTop: 4 }}>Delivery {index + 1} of {active.totalDeliveries ?? dates.length}</Text></View><Text style={{ fontWeight: '900', color: done ? colors.greenDark : isNext ? colors.greenDark : colors.inkSoft }}>{done ? 'Delivered' : isNext ? 'Next' : 'Scheduled'}</Text></View>
        </View>;
      }) : <Text style={{ color: colors.inkSoft }}>No delivery dates are available for this subscription.</Text>}
      <Text style={{ fontSize: 11, color: colors.inkSoft, lineHeight: 17, marginTop: 4 }}>This calendar is read-only. It is derived from the subscription schedule and existing subscription delivery counters; the mobile client does not create or modify delivery records.</Text>
    </>}
  </Screen>;
}
