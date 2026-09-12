import { Stack, usePathname, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { getCustomerAddresses } from '../../services/customerAddresses';
import { useAppStore } from '../../store/appStore';

function CustomerHeader() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const mobile = useAppStore((state) => state.mobile);
  const [addressLabel, setAddressLabel] = useState('Add delivery address');

  const rootTabPaths = [
    '/(customer)/(tabs)',
    '/(customer)/(tabs)/',
    '/(customer)/(tabs)/index',
    '/(customer)/(tabs)/products',
    '/(customer)/(tabs)/cart',
    '/(customer)/(tabs)/orders',
    '/(customer)/(tabs)/profile',
  ];
  const isRootTab = rootTabPaths.includes(pathname);

  useEffect(() => {
    let alive = true;
    if (!mobile) {
      setAddressLabel('Add delivery address');
      return () => { alive = false; };
    }

    void getCustomerAddresses(mobile)
      .then((addresses) => {
        if (!alive) return;
        const address = addresses[0];
        if (address) {
          setAddressLabel(`${address.label || 'Home'} · ${address.pincode || address.city || ''}`.replace(/ · $/, ''));
        } else {
          setAddressLabel('Add delivery address');
        }
      })
      .catch(() => {
        if (alive) setAddressLabel('Add delivery address');
      });

    return () => { alive = false; };
  }, [mobile]);

  return (
    <View style={[styles.header, { paddingTop: insets.top, height: 62 + insets.top }]}>
      <View style={styles.left}>
        {!isRootTab ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        ) : null}
        <Text style={styles.brand}>Seedlings</Text>
      </View>
      <View style={styles.delivery}>
        <Text style={styles.deliveryCaption}>Deliver to</Text>
        <Text style={styles.deliveryValue} numberOfLines={1}>{addressLabel}⌄</Text>
      </View>
    </View>
  );
}

export default function CustomerLayout() {
  const authenticated = useAppStore((state) => state.authenticated);

  return (
    <View style={styles.shell}>
      {authenticated ? <CustomerHeader /> : null}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
      </View>
    </View>
  );
}

const styles = {
  shell: { flex: 1, backgroundColor: colors.paper },
  content: { flex: 1 },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  left: { flexDirection: 'row' as const, alignItems: 'center' as const, flex: 1 },
  backButton: { width: 32, height: 40, alignItems: 'flex-start' as const, justifyContent: 'center' as const, marginRight: 2 },
  backText: { fontSize: 36, lineHeight: 40, color: colors.ink },
  brand: { fontSize: 21, fontWeight: '900' as const, color: colors.greenDark },
  delivery: { alignItems: 'flex-end' as const, maxWidth: '52%' as const },
  deliveryCaption: { fontSize: 10, color: colors.inkSoft },
  deliveryValue: { fontSize: 12, fontWeight: '800' as const, color: colors.ink, marginTop: 2 },
};
