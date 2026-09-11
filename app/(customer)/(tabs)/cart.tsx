import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { productImages } from '../../../data/imageMap';
import { getCartTotals } from '../../../services/cart/cartService';
import { useAppStore } from '../../../store/appStore';

export default function Cart() {
  const cart = useAppStore((s) => s.cart);
  const change = useAppStore((s) => s.changeQuantity);
  const remove = useAppStore((s) => s.removeFromCart);
  const totals = getCartTotals(cart);

  return (
    <Screen>
      <Text style={styles.title}>Your Cart</Text>
      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.muted}>Fresh microgreens are waiting for you.</Text>
          <View style={{ width: 190, marginTop: 12 }}>
            <Button title="Start Shopping" onPress={() => router.push('/(customer)/(tabs)/products')} />
          </View>
        </View>
      ) : (
        <>
          {cart.map((item) => {
            const itemMrp = item.mrp && item.mrp > 0 ? item.mrp : item.price;
            const itemSavings = Math.max(0, itemMrp - item.price) * item.quantity;
            const imageSource = item.imageUrl?.startsWith('http')
              ? { uri: item.imageUrl }
              : (productImages[item.image] ?? productImages['broccoli.jpg']);

            return (
              <View key={`${item.id}:${item.selectedWeight}`} style={styles.itemCard}>
                <Image source={imageSource} style={styles.image} resizeMode="contain" />
                <View style={styles.itemBody}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.muted}>{item.selectedWeight}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.price}</Text>
                    {itemMrp > item.price ? <Text style={styles.mrp}>₹{itemMrp}</Text> : null}
                  </View>
                  {itemSavings > 0 ? <Text style={styles.saving}>You save ₹{itemSavings}</Text> : null}
                  <View style={styles.controls}>
                    <Pressable onPress={() => change(item.id, -1, item.selectedWeight)} style={styles.stepButton}>
                      <Text style={styles.step}>−</Text>
                    </Pressable>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <Pressable onPress={() => change(item.id, 1, item.selectedWeight)} style={styles.stepButton}>
                      <Text style={styles.step}>+</Text>
                    </Pressable>
                    <Pressable onPress={() => remove(item.id, item.selectedWeight)} style={{ marginLeft: 'auto' }}>
                      <Text style={styles.remove}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.line}><Text style={styles.muted}>MRP</Text><Text style={styles.muted}>₹{totals.mrpSubtotal}</Text></View>
            <View style={styles.line}><Text style={styles.muted}>Subtotal</Text><Text style={styles.muted}>₹{totals.subtotal}</Text></View>
            {totals.savings > 0 ? <View style={styles.line}><Text style={styles.saving}>You save</Text><Text style={styles.saving}>−₹{totals.savings}</Text></View> : null}
            <View style={styles.line}><Text style={styles.muted}>Delivery</Text><Text style={styles.muted}>₹{totals.delivery}</Text></View>
            <View style={[styles.line, { borderBottomWidth: 0 }]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>₹{totals.total}</Text></View>
            <Button title="Proceed to Checkout" onPress={() => router.push('/(customer)/checkout')} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = {
  title: { fontSize: 24, fontWeight: '900' as const, color: colors.ink, marginTop: 10 },
  empty: { alignItems: 'center' as const, paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '900' as const, color: colors.ink },
  muted: { color: colors.inkSoft, fontSize: 13 },
  itemCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 14, padding: 10, flexDirection: 'row' as const, marginTop: 12 },
  image: { width: 82, height: 82, borderRadius: 10, backgroundColor: colors.block },
  itemBody: { flex: 1, marginLeft: 10 },
  name: { fontWeight: '800' as const, color: colors.ink },
  priceRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 7, marginTop: 5 },
  price: { fontSize: 16, fontWeight: '900' as const, color: colors.ink },
  mrp: { color: colors.inkFaint, fontSize: 12, textDecorationLine: 'line-through' as const },
  saving: { color: colors.greenDark, fontSize: 12, fontWeight: '800' as const, marginTop: 3 },
  controls: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 9 },
  stepButton: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: colors.line, alignItems: 'center' as const, justifyContent: 'center' as const },
  step: { fontSize: 20, color: colors.greenDark, fontWeight: '900' as const, lineHeight: 22 },
  quantity: { minWidth: 34, textAlign: 'center' as const, fontWeight: '900' as const, color: colors.ink },
  remove: { color: colors.danger, fontWeight: '800' as const, fontSize: 12 },
  summary: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 16, marginTop: 14 },
  summaryTitle: { fontWeight: '900' as const, fontSize: 17, color: colors.ink, marginBottom: 4 },
  line: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  totalLabel: { fontWeight: '900' as const, color: colors.ink },
  total: { fontWeight: '900' as const, fontSize: 19, color: colors.ink },
};
