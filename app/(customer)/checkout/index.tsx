import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { getCartTotals } from '../../../services/cart/cartService';
import { getCustomerAddresses, type CustomerAddress } from '../../../services/customerAddresses';
import { createCustomerOneTimeOrder } from '../../../services/orders/orderService';
import { CUSTOMER_PAYMENT_METHODS, type CustomerPaymentMethod, isPaymentGatewayConfigured } from '../../../services/payments/paymentService';
import { getDeliverySlots, type DeliverySlot } from '../../../services/orders/deliverySlotService';

const PAYMENT_METHODS = CUSTOMER_PAYMENT_METHODS;
type PaymentMethod = CustomerPaymentMethod;

function formatAddress(address: CustomerAddress) {
  return [address.addressLine1, address.addressLine2, address.landmark, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ');
}

export default function Checkout() {
  const cart = useAppStore((s) => s.cart);
  const mobile = useAppStore((s) => s.mobile);
  const totals = useMemo(() => getCartTotals(cart), [cart]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotError, setSlotError] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSlotError('');
    try {
      const result = await getDeliverySlots();
      setDeliverySlots(result);
      setSelectedSlotId((current) => result.some((slot) => slot.id === current) ? current : result[0]?.id ?? '');
    } catch (error) {
      setDeliverySlots([]);
      setSelectedSlotId('');
      setSlotError(error instanceof Error ? error.message : 'Unable to load delivery slots.');
    } finally {
      setLoadingSlots(false);
    }
  }, []);

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

  useEffect(() => {
    void loadAddresses();
    void loadSlots();
  }, [loadAddresses, loadSlots]);

  useFocusEffect(useCallback(() => {
    void loadAddresses();
    void loadSlots();
  }, [loadAddresses, loadSlots]));

  const selectedAddress = addresses.find((item) => item.id === selectedAddressId);
  const selectedSlot = deliverySlots.find((slot) => slot.id === selectedSlotId);
  const deliveryFee = selectedSlot?.deliveryCharge ?? totals.delivery;
  const checkoutTotal = totals.subtotal + deliveryFee;
  const canContinue = cart.length > 0 && Boolean(selectedAddress);

  const validateCheckout = async () => {
    setValidationError('');
    if (cart.length === 0) {
      setValidationError('Your cart is empty.');
      return;
    }
    if (!selectedAddress) {
      setValidationError('Please select a delivery address.');
      return;
    }
    if (!mobile) { setValidationError('Customer session not found. Please log in again.'); return; }
    if (deliverySlots.length > 0 && !selectedSlot) { setValidationError('Please select a delivery slot.'); return; }
    setPlacingOrder(true);
    try {
      const order = await createCustomerOneTimeOrder({ mobile, items: cart, address: selectedAddress, paymentMethod, deliverySlot: selectedSlot });
      useAppStore.getState().clearCart();
      router.replace({ pathname: '/(customer)/checkout/success', params: { orderId: order.id, orderNumber: order.orderNumber, total: String(order.total), paymentMethod } });
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Unable to place your order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <Screen>
      <Header title="Checkout" onBack={() => router.back()} />

      <Text style={styles.heading}>Delivery Address</Text>
      {loadingAddresses ? (
        <View style={styles.stateCard}><ActivityIndicator color={colors.greenDark} /><Text style={styles.muted}>Loading your addresses…</Text></View>
      ) : addresses.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.bold}>No saved address</Text>
          <Text style={styles.muted}>Add a delivery address before continuing.</Text>
          <View style={{ marginTop: 12 }}><Button title="Add Address" onPress={() => router.push('/(customer)/account/addresses')} /></View>
        </View>
      ) : (
        <>
          {addresses.map((address) => {
            const selected = address.id === selectedAddressId;
            return (
              <Pressable key={address.id} onPress={() => { setSelectedAddressId(address.id); setValidationError(''); }} style={[styles.card, selected && styles.selectedCard]}>
                <View style={styles.addressHeader}>
                  <Text style={styles.bold}>{address.label || 'Address'}</Text>
                  <Text style={selected ? styles.selectedMark : styles.radio}>{selected ? '●' : '○'}</Text>
                </View>
                {address.name ? <Text style={styles.bold}>{address.name}</Text> : null}
                <Text style={styles.muted}>{formatAddress(address)}</Text>
                {address.mobileNumber ? <Text style={styles.muted}>+91 {address.mobileNumber}</Text> : null}
              </Pressable>
            );
          })}
          <Button title="Manage Addresses" secondary onPress={() => router.push('/(customer)/account/addresses')} />
        </>
      )}

      <Text style={styles.heading}>Delivery Slot</Text>
      {loadingSlots ? (
        <View style={styles.stateCard}><ActivityIndicator color={colors.greenDark} /><Text style={styles.muted}>Loading delivery slots…</Text></View>
      ) : deliverySlots.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.bold}>Standard delivery</Text>
          <Text style={styles.muted}>{slotError || 'No selectable delivery slots are configured yet. Standard delivery will be used.'}</Text>
        </View>
      ) : (
        <View>
          {deliverySlots.map((slot) => {
            const selected = slot.id === selectedSlotId;
            const timing = [slot.date, slot.startTime && slot.endTime ? `${slot.startTime}–${slot.endTime}` : slot.startTime || slot.endTime].filter(Boolean).join(' · ');
            return (
              <Pressable key={slot.id} onPress={() => { setSelectedSlotId(slot.id); setValidationError(''); }} style={[styles.card, selected && styles.selectedCard]}>
                <View style={styles.addressHeader}>
                  <Text style={styles.bold}>{slot.name}</Text>
                  <Text style={selected ? styles.selectedMark : styles.radio}>{selected ? '●' : '○'}</Text>
                </View>
                {timing ? <Text style={styles.muted}>{timing}</Text> : null}
                <Text style={styles.muted}>Delivery charge: ₹{slot.deliveryCharge ?? totals.delivery}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.heading}>Payment Method</Text>
      <View style={styles.card}>
        {!isPaymentGatewayConfigured() ? <Text style={styles.paymentNotice}>Online payment gateway is not connected yet. Your order will be created with Payment Pending; the payment result must be recorded by the trusted payment flow.</Text> : null}
        {PAYMENT_METHODS.map((method) => {
          const selected = paymentMethod === method;
          return (
            <Pressable key={method} onPress={() => setPaymentMethod(method)} style={styles.paymentRow}>
              <Text style={[styles.paymentText, selected && styles.selectedText]}>{selected ? '●' : '○'}  {method}</Text>
              {method === 'Wallet' ? <Text style={styles.muted}>Balance validated at checkout</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.heading}>Order Summary</Text>
      <View style={styles.card}>
        <View style={styles.line}><Text style={styles.muted}>MRP</Text><Text style={styles.muted}>₹{totals.mrpSubtotal}</Text></View>
        <View style={styles.line}><Text style={styles.muted}>Subtotal</Text><Text style={styles.muted}>₹{totals.subtotal}</Text></View>
        {totals.savings > 0 ? <View style={styles.line}><Text style={styles.saving}>You save</Text><Text style={styles.saving}>−₹{totals.savings}</Text></View> : null}
        <View style={styles.line}><Text style={styles.muted}>Delivery</Text><Text style={styles.muted}>₹{deliveryFee}</Text></View>
        <View style={[styles.line, { borderBottomWidth: 0 }]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>₹{checkoutTotal}</Text></View>
      </View>

      {addressError ? <Text style={styles.error}>{addressError}</Text> : null}
      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      <View style={{ marginBottom: 18 }}>
        <Button title={placingOrder ? "Placing Order…" : "Place Order"} onPress={placingOrder ? () => {} : validateCheckout} />
      </View>
    </Screen>
  );
}

const styles = {
  heading: { fontSize: 18, fontWeight: '900' as const, color: colors.ink, marginTop: 12, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 15, marginBottom: 8 },
  selectedCard: { borderColor: colors.green, borderWidth: 2 },
  stateCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 18, marginBottom: 8, alignItems: 'center' as const, gap: 8 },
  addressHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 5 },
  bold: { fontWeight: '900' as const, color: colors.ink },
  muted: { color: colors.inkSoft, marginTop: 4, lineHeight: 19 },
  radio: { color: colors.inkFaint, fontSize: 18 },
  selectedMark: { color: colors.greenDark, fontSize: 18 },
  selectedText: { color: colors.greenDark, fontWeight: '900' as const },
  paymentRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  paymentText: { color: colors.ink, fontWeight: '800' as const },
  paymentNotice: { color: colors.inkSoft, backgroundColor: '#f7f7f2', borderRadius: 10, padding: 10, marginBottom: 4, lineHeight: 18 },
  line: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  saving: { color: colors.greenDark, fontWeight: '800' as const },
  totalLabel: { fontWeight: '900' as const, color: colors.ink },
  total: { fontWeight: '900' as const, fontSize: 19, color: colors.ink },
  error: { color: colors.danger, fontSize: 13, fontWeight: '700' as const, marginVertical: 6 },
};
