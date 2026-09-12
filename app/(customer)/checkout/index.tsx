import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { getCartTotals } from '../../../services/cart/cartService';
import { getCustomerAddresses, type CustomerAddress } from '../../../services/customerAddresses';
import { createCustomerOneTimeOrder } from '../../../services/orders/orderService';
import { checkProductAvailability, nextWeekSaturday } from '../../../services/orders/customerOrderAvailability';
import { confirmHarvestShortage } from '../../../services/orders/customerAlerts';
import { getActiveOneTimeDeliveryCharge } from '../../../services/orders/deliveryChargeService';
import { isPaymentGatewayConfigured } from '../../../services/payments/paymentService';
import { getProducts, type Product } from '../../../services/products/productService';

function formatAddress(address: CustomerAddress) {
  return [address.addressLine1, address.addressLine2, address.landmark, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}

const DELIVERY_SLOTS = ['Saturday morning', 'Saturday evening'] as const;
type DeliverySlot = (typeof DELIVERY_SLOTS)[number];

export default function Checkout() {
  const cart = useAppStore((s) => s.cart);
  const mobile = useAppStore((s) => s.mobile);
  const totals = useMemo(() => getCartTotals(cart), [cart]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | ''>('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState<{ name: string; amount: number } | null>(null);
  const [chargeLoading, setChargeLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    if (!mobile) return;
    setLoadingAddresses(true);
    setAddressError('');
    try {
      const result = await getCustomerAddresses(mobile);
      setAddresses(result);
      setSelectedAddressId((current) => result.some((item) => item.id === current) ? current : result[0]?.id ?? '');
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Unable to load your addresses.');
    } finally {
      setLoadingAddresses(false);
    }
  }, [mobile]);

  const loadDeliveryCharge = useCallback(async () => {
    setChargeLoading(true);
    try {
      const charge = await getActiveOneTimeDeliveryCharge();
      setDeliveryCharge(charge ? { name: charge.name, amount: charge.amount } : null);
    } catch (error) {
      setDeliveryCharge(null);
      setValidationError(error instanceof Error ? error.message : 'Unable to load the configured delivery charge.');
    } finally {
      setChargeLoading(false);
    }
  }, []);

  useEffect(() => { void loadAddresses(); void loadDeliveryCharge(); }, [loadAddresses, loadDeliveryCharge]);
  useFocusEffect(useCallback(() => { void loadAddresses(); void loadDeliveryCharge(); }, [loadAddresses, loadDeliveryCharge]));

  const selectedAddress = addresses.find((item) => item.id === selectedAddressId);
  const checkoutTotal = totals.subtotal + (deliveryCharge?.amount ?? 0);

  const validateCheckout = async () => {
    setValidationError('');
    if (cart.length === 0) return setValidationError('Your cart is empty.');
    if (!selectedAddress) return setValidationError('Please select a delivery address.');
    if (!mobile) return setValidationError('Customer session not found. Please log in again.');
    if (!selectedSlot) return setValidationError('Please select a weekend delivery slot.');
    if (chargeLoading) return setValidationError('Delivery charge is still loading. Please try again.');
    if (!deliveryCharge) return setValidationError('No active one-time delivery charge is configured. Please try again later.');
    if (cart.some((item) => item.purchaseMode !== 'one-time')) return setValidationError('Subscription items must be continued from Cart using the subscription flow.');

    setPlacingOrder(true);
    try {
      const { products } = await getProducts({ forceRefresh: true });
      const productMap = new Map(products.map((product) => [product.id, product]));
      const deliveryDate = nextWeekSaturday();
      const availabilityResults = await Promise.all(cart.map(async (item) => {
        const product = productMap.get(item.id);
        if (!product || !product.active || !product.oneTimePurchase) throw new Error(`Product "${item.name}" is no longer available for one-time purchase.`);
        return { item, result: await checkProductAvailability({ product, quantity: item.quantity, deliveryDate }) };
      }));

      const shortages = availabilityResults.filter(({ result }) => result.hasShortage);
      let shortageDecision: 'continue' | 'contact' | undefined;
      if (shortages.length) {
        const availableGrams = Math.min(...shortages.map(({ result }) => result.availableGrams));
        const requestedGrams = shortages.reduce((sum, { result }) => sum + result.requestedGrams, 0);
        const shortageGrams = shortages.reduce((sum, { result }) => sum + result.shortageGrams, 0);
        shortageDecision = await confirmHarvestShortage({ mode: 'one-time', availableGrams, requestedGrams, shortageGrams });
      }

      const order = await createCustomerOneTimeOrder({ mobile, items: cart, address: selectedAddress, paymentMethod: 'online', deliverySlot: selectedSlot, shortageDecision });
      useAppStore.getState().clearCart();
      router.replace({ pathname: '/(customer)/checkout/success', params: { orderId: order.id, orderNumber: order.orderNumber, total: String(order.total), paymentMethod: 'online' } });
    } catch (error) {
      if (error instanceof Error && error.message === 'HARVEST_SHORTAGE_CONFIRMATION_REQUIRED') {
        setValidationError('Limited harvest is available. Please try placing the order again to review the availability decision.');
      } else {
        setValidationError(error instanceof Error ? error.message : 'Unable to place your order. Please try again.');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <Screen>


      <Text style={styles.heading}>Delivery details</Text>
      <Text style={styles.subheading}>Confirm your delivery</Text>
      {loadingAddresses ? (
        <View style={styles.stateCard}><ActivityIndicator color={colors.greenDark} /><Text style={styles.muted}>Loading your addresses…</Text></View>
      ) : addresses.length === 0 ? (
        <View style={styles.card}><Text style={styles.bold}>No saved address</Text><Text style={styles.muted}>Add a delivery address before continuing.</Text><View style={{ marginTop: 12 }}><Button title="Add Address" onPress={() => router.push('/(customer)/account/addresses')} /></View></View>
      ) : (
        <>
          {addresses.map((address) => {
            const selected = address.id === selectedAddressId;
            return <Pressable key={address.id} onPress={() => { setSelectedAddressId(address.id); setValidationError(''); }} style={[styles.card, selected && styles.selectedCard]}>
              <View style={styles.addressHeader}><Text style={styles.bold}>{address.label || 'Address'}</Text><Text style={selected ? styles.selectedMark : styles.radio}>{selected ? '●' : '○'}</Text></View>
              {address.name ? <Text style={styles.bold}>{address.name}</Text> : null}
              <Text style={styles.muted}>{formatAddress(address)}</Text>
              {address.mobileNumber ? <Text style={styles.muted}>+91 {address.mobileNumber}</Text> : null}
            </Pressable>;
          })}
          <Button title="Manage Addresses" secondary onPress={() => router.push('/(customer)/account/addresses')} />
        </>
      )}

      <Text style={styles.heading}>Delivery slot</Text>
      <Text style={styles.muted}>Choose your preferred Saturday delivery slot for {nextWeekSaturday()}.</Text>
      {DELIVERY_SLOTS.map((slot) => {
        const selected = selectedSlot === slot;
        return <Pressable key={slot} onPress={() => { setSelectedSlot(slot); setValidationError(''); }} style={[styles.card, selected && styles.selectedCard]}>
          <View style={styles.addressHeader}><Text style={styles.bold}>{slot}</Text><Text style={selected ? styles.selectedMark : styles.radio}>{selected ? '●' : '○'}</Text></View>
          <Text style={styles.muted}>{nextWeekSaturday()}</Text>
        </Pressable>;
      })}

      <Text style={styles.heading}>Payment</Text>
      <View style={styles.card}>
        <Text style={styles.paymentText}>Online payment</Text>
        {!isPaymentGatewayConfigured() ? <Text style={styles.paymentNotice}>Payment gateway processing is not connected yet. The order is created with payment status Pending.</Text> : null}
      </View>

      <Text style={styles.heading}>Order summary</Text>
      <View style={styles.card}>
        <View style={styles.line}><Text style={styles.muted}>MRP</Text><Text style={styles.muted}>₹{totals.mrpSubtotal}</Text></View>
        <View style={styles.line}><Text style={styles.muted}>Subtotal</Text><Text style={styles.muted}>₹{totals.subtotal}</Text></View>
        {totals.savings > 0 ? <View style={styles.line}><Text style={styles.saving}>You save</Text><Text style={styles.saving}>−₹{totals.savings}</Text></View> : null}
        <View style={styles.line}><Text style={styles.muted}>Delivery</Text><Text style={styles.muted}>Calculated on order</Text></View>
        <View style={[styles.line, { borderBottomWidth: 0 }]}><Text style={styles.totalLabel}>Items subtotal</Text><Text style={styles.total}>₹{totals.subtotal}</Text></View>
        <Text style={styles.muted}>The configured active one-time delivery charge is applied when the order is created.</Text>
      </View>

      {deliveryCharge ? <Text style={styles.muted}>Configured delivery charge: {deliveryCharge.name || 'Delivery'} — ₹{deliveryCharge.amount}</Text> : null}
      {addressError ? <Text style={styles.error}>{addressError}</Text> : null}
      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      <View style={{ marginBottom: 18 }}><Button title={placingOrder ? 'Placing Order…' : 'Place Order'} onPress={placingOrder ? () => {} : validateCheckout} /></View>
    </Screen>
  );
}

const styles = {
  heading: { fontSize: 18, fontWeight: '900' as const, color: colors.ink, marginTop: 16, marginBottom: 4 },
  subheading: { fontSize: 16, fontWeight: '800' as const, color: colors.ink, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 15, marginBottom: 8 },
  selectedCard: { borderColor: colors.green, borderWidth: 2 },
  stateCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 18, marginBottom: 8, alignItems: 'center' as const, gap: 8 },
  addressHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 5 },
  bold: { fontWeight: '900' as const, color: colors.ink },
  muted: { color: colors.inkSoft, marginTop: 4, lineHeight: 19 },
  radio: { color: colors.inkFaint, fontSize: 18 },
  selectedMark: { color: colors.greenDark, fontSize: 18 },
  paymentText: { color: colors.ink, fontWeight: '800' as const },
  paymentNotice: { color: colors.inkSoft, backgroundColor: '#f7f7f2', borderRadius: 10, padding: 10, marginTop: 8, lineHeight: 18 },
  line: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  saving: { color: colors.greenDark, fontWeight: '800' as const },
  totalLabel: { fontWeight: '900' as const, color: colors.ink },
  total: { fontWeight: '900' as const, fontSize: 19, color: colors.ink },
  error: { color: colors.danger, fontSize: 13, fontWeight: '700' as const, marginVertical: 6 },
};
