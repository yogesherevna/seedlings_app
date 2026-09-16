import { Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { getCustomerProfile } from '../../../services/customerProfile';

const items = [
  ['My Profile', '/(customer)/account/profile', '👤'],
  ['Delivery Addresses', '/(customer)/account/addresses', '⌖'],
  ['My Orders', '/(customer)/(tabs)/orders', '▤'],
  ['My Subscriptions', '/(customer)/account/subscriptions', '↻'],
  ['Delivery Calendar', '/(customer)/account/delivery-calendar', '□'],
] as const;

export default function Profile() {
  const mobile = useAppStore(s => s.mobile);
  const logout = useAppStore(s => s.logout);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (!mobile) { setLoading(false); return; }
    void getCustomerProfile(mobile).then(profile => { if (active) setName(profile.name); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mobile]);

  return <Screen>
    <View style={styles.profileHero}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{name ? name.trim().charAt(0).toUpperCase() : 'S'}</Text></View>
      <Text style={styles.name}>{loading ? 'Loading…' : (name || 'Customer')}</Text>
      <Text style={styles.mobile}>+91 {mobile || '—'}</Text>
    </View>
    <Text style={styles.sectionTitle}>Account</Text>
    <View style={styles.menu}>
      {items.map(([label, path, icon], index) => <Pressable key={label} onPress={() => router.push(path as any)} style={({ pressed }) => [styles.menuRow, index < items.length - 1 && styles.menuDivider, pressed && styles.pressed]}>
        <View style={styles.menuLeft}><View style={styles.menuIcon}><Text style={styles.menuIconText}>{icon}</Text></View><Text style={styles.menuLabel}>{label}</Text></View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>)}
    </View>
    <Pressable onPress={() => { void logout(); router.replace('/(customer)/auth/login'); }} style={styles.logout}><Text style={styles.logoutText}>Sign out</Text></Pressable>
    <Text style={styles.version}>Seedlings Microgreens • Customer</Text>
  </Screen>;
}
const styles = {
  profileHero: { alignItems: 'center' as const, paddingVertical: spacing.xl },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: colors.greenTint, borderWidth: 2, borderColor: colors.green, alignItems: 'center' as const, justifyContent: 'center' as const },
  avatarText: { fontFamily: typography.fontFamily, color: colors.greenDark, fontSize: 30, fontWeight: '900' as const },
  name: { fontFamily: typography.fontFamily, color: colors.ink, fontSize: 22, fontWeight: '900' as const, marginTop: 9 },
  mobile: { fontFamily: typography.fontFamily, color: colors.inkSoft, fontSize: 12, marginTop: 3 },
  sectionTitle: { fontFamily: typography.fontFamily, fontSize: 15, fontWeight: '900' as const, color: colors.inkSoft, marginBottom: 8 },
  menu: { backgroundColor: colors.panel, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, overflow: 'hidden' as const },
  menuRow: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  menuLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, flex: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.greenTint, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 11 },
  menuIconText: { fontSize: 16, color: colors.greenDark },
  menuLabel: { fontFamily: typography.fontFamily, color: colors.ink, fontSize: 14, fontWeight: '800' as const },
  arrow: { fontFamily: typography.fontFamily, color: colors.inkFaint, fontSize: 25, lineHeight: 25 },
  pressed: { backgroundColor: colors.paper },
  logout: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center' as const, justifyContent: 'center' as const, marginTop: 18 },
  logoutText: { fontFamily: typography.fontFamily, color: colors.danger, fontSize: 14, fontWeight: '900' as const },
  version: { fontFamily: typography.fontFamily, color: colors.inkFaint, textAlign: 'center' as const, fontSize: 10, marginTop: 14 },
};
