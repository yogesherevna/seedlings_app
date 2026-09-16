import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors, typography } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';

function TabIcon({ symbol, active }: { symbol: string; active: boolean }) {
  return <Text style={{ fontFamily: typography.fontFamily, fontSize: 19, lineHeight: 22, color: active ? colors.greenDark : colors.inkSoft }}>{symbol}</Text>;
}

export default function TabLayout() {
  const cartCount = useAppStore((s) => s.cart.reduce((sum, item) => sum + item.quantity, 0) + s.subscriptionCart.reduce((sum, item) => sum + item.quantity, 0));
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.greenDark,
    tabBarInactiveTintColor: colors.inkSoft,
    tabBarStyle: { height: 72, paddingBottom: 9, paddingTop: 7, backgroundColor: colors.panel, borderTopColor: colors.lineSoft, borderTopWidth: 1 },
    tabBarLabelStyle: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: '800', marginTop: 2 },
    tabBarIconStyle: { marginBottom: 1 },
    tabBarIcon: ({ focused }) => {
      const symbol = route.name === 'index' ? '⌂' : route.name === 'products' ? '▦' : route.name === 'cart' ? '🛒' : route.name === 'orders' ? '▤' : '●';
      return <TabIcon symbol={symbol} active={focused} />;
    },
    tabBarBadge: route.name === 'cart' && cartCount > 0 ? cartCount : undefined,
    tabBarBadgeStyle: { backgroundColor: colors.orange, color: colors.white, fontSize: 9, minWidth: 17, height: 17, lineHeight: 17 },
  })}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="products" options={{ title: 'Products' }} />
    <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
    <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
  </Tabs>;
}
