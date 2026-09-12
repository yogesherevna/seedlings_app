import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getCustomerNotifications, CustomerNotification } from '../../../services/notifications/notificationService';
import { getStoredCustomerMobile } from '../../../services/auth/customerSession';

function formatDate(value: unknown) {
  if (!value) return '';
  try {
    const date = typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function'
      ? (value as any).toDate()
      : new Date(value as any);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function NotificationCard({ item }: { item: CustomerNotification }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: item.read ? 0 : 1, borderColor: item.read ? '#fff' : '#dfe7df' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ flex: 1, fontWeight: '900', color: colors.ink }}>{item.title}</Text>
        {!item.read && <Text style={{ fontSize: 11, fontWeight: '800', color: colors.inkSoft }}>NEW</Text>}
      </View>
      {!!item.message && <Text style={{ color: colors.inkSoft, marginTop: 6, lineHeight: 20 }}>{item.message}</Text>}
      {!!item.createdAt && <Text style={{ color: colors.inkSoft, fontSize: 11, marginTop: 8 }}>{formatDate(item.createdAt)}</Text>}
    </View>
  );
}

export default function ScreenPage() {
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    const mobile = getStoredCustomerMobile();
    if (!mobile) { setItems([]); setLoading(false); return; }
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try { setItems(await getCustomerNotifications(mobile)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load notifications.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <Screen>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />} contentContainerStyle={{ paddingBottom: 30 }}>
        {loading ? <View style={{ padding: 30, alignItems: 'center' }}><ActivityIndicator /></View> : error ? <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16 }}><Text style={{ color: colors.ink }}>{error}</Text></View> : items.length === 0 ? <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 20 }}><Text style={{ fontWeight: '900', color: colors.ink }}>No notifications</Text><Text style={{ color: colors.inkSoft, marginTop: 6 }}>You’ll see order and subscription updates here.</Text></View> : items.map((item) => <NotificationCard key={item.id} item={item} />)}
      </ScrollView>
    </Screen>
  );
}
