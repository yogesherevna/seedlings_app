import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getCustomerOrder, type CustomerOrder } from '../../../services/orders/orderService';
import { useAppStore } from '../../../store/appStore';
import { paymentStatusMessage, prettyPaymentStatus } from '../../../services/payments/paymentService';

function money(value: unknown) {
  const n = Number(value ?? 0);
  return `₹${Number.isFinite(n) ? n : 0}`;
}
function prettyStatus(value?: string) {
  return String(value ?? 'pending').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
function formatDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  const date = new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mobile = useAppStore((s) => s.customerMobile);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      if (!mobile || !id) { if (active) { setLoading(false); setError('Order not available.'); } return; }
      try {
        const result = await getCustomerOrder(mobile, String(id));
        if (!active) return;
        if (!result) setError('This order could not be found.');
        else setOrder(result);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load order.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [mobile, id]);

  const address = order?.deliveryAddressSnapshot ?? order?.deliveryAddress;
  const items = order?.items ?? [];
  const total = order?.totalAmount ?? order?.total ?? 0;
  const delivery = order?.deliveryCharge ?? order?.deliveryFee ?? 0;
  const discount = order?.discountTotal ?? order?.discount ?? 0;

  if (loading) return <Screen><Header title="Order Details" onBack={() => router.back()} /><View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.green} /><Text style={{ color: colors.inkSoft, marginTop: 12 }}>Loading order…</Text></View></Screen>;
  if (error || !order) return <Screen><Header title="Order Details" onBack={() => router.back()} /><View style={{ paddingTop: 35 }}><Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>{error || 'Order not found.'}</Text><Text style={{ color: colors.inkSoft, marginTop: 8, marginBottom: 18 }}>Only your own customer orders can be viewed here.</Text><Button title="Back to My Orders" onPress={() => router.replace('/(customer)/(tabs)/orders')} /></View></Screen>;

  return <Screen>
    <Header title="Order Details" onBack={() => router.back()} />
    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 14, padding: 16, marginTop: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink }}>{order.orderNumber ? `#${order.orderNumber}` : `#${order.id}`}</Text>
        <Text style={{ fontWeight: '900', color: colors.greenDark }}>{prettyStatus(order.status)}</Text>
      </View>
      <Text style={{ color: colors.inkSoft, marginTop: 7 }}>{formatDate(order.createdAt)}</Text>
      <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 14 }}>
        <Text style={{ fontWeight: '900', color: colors.ink, marginBottom: 10 }}>Items</Text>
        {items.map((item, index) => {
          const name = String(item.productName ?? 'Product');
          const qty = Number(item.quantity ?? 1);
          const weight = item.weightLabel ?? item.weightGrams;
          const price = Number(item.price ?? (Number(item.unitPrice ?? 0) * qty));
          return <View key={`${String(item.productId ?? index)}-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 }}><View style={{ flex: 1, paddingRight: 10 }}><Text style={{ fontWeight: '800', color: colors.ink }}>{name}</Text><Text style={{ color: colors.inkSoft, marginTop: 3 }}>{weight ? `${weight} · ` : ''}Qty {qty}</Text></View><Text style={{ fontWeight: '900', color: colors.ink }}>{money(price)}</Text></View>;
        })}
      </View>
    </View>

    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 14, padding: 16, marginTop: 12 }}>
      <Text style={{ fontWeight: '900', color: colors.ink, marginBottom: 10 }}>Delivery Address</Text>
      <Text style={{ fontWeight: '800', color: colors.ink }}>{String(address?.name ?? '')}</Text>
      <Text style={{ color: colors.inkSoft, marginTop: 4 }}>{String(address?.addressLine1 ?? '')}</Text>
      {address?.addressLine2 ? <Text style={{ color: colors.inkSoft }}>{String(address.addressLine2)}</Text> : null}
      <Text style={{ color: colors.inkSoft }}>{[address?.city, address?.state, address?.pincode].filter(Boolean).join(', ')}</Text>
      <Text style={{ color: colors.inkSoft, marginTop: 4 }}>{String(address?.mobileNumber ?? order.customerMobile ?? '')}</Text>
    </View>

    <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 14, padding: 16, marginTop: 12 }}>
      <Text style={{ fontWeight: '900', color: colors.ink, marginBottom: 10 }}>Payment & Total</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}><Text style={{ color: colors.inkSoft }}>Subtotal</Text><Text>{money(order.subtotal)}</Text></View>
      {discount > 0 ? <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}><Text style={{ color: colors.greenDark }}>Discount</Text><Text style={{ color: colors.greenDark }}>−{money(discount)}</Text></View> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}><Text style={{ color: colors.inkSoft }}>Delivery</Text><Text>{money(delivery)}</Text></View>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink }}>Total</Text><Text style={{ fontSize: 17, fontWeight: '900', color: colors.ink }}>{money(total)}</Text></View>
      <Text style={{ color: colors.inkSoft, marginTop: 10 }}>Payment: {prettyStatus(order.paymentMethod)} · {prettyPaymentStatus(order.paymentStatus)}</Text>
      <Text style={{ color: colors.inkSoft, marginTop: 5 }}>{paymentStatusMessage(order.paymentStatus)}</Text>
      {order.transactionId ? <Text style={{ color: colors.inkSoft, marginTop: 5 }}>Transaction: {order.transactionId}</Text> : null} 
    </View>

    <View style={{ marginTop: 16, marginBottom: 18 }}><Button title="Back to My Orders" onPress={() => router.replace('/(customer)/(tabs)/orders')} /></View>
  </Screen>;
}
