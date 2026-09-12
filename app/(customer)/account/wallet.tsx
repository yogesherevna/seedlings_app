import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getStoredCustomerMobile } from '../../../services/clientOnboarding';
import { getCustomerWallet, prettyWalletType, type CustomerWallet } from '../../../services/wallet/walletService';

function money(v: number | null) { return v == null ? '—' : `₹${v.toFixed(2)}`; }
function amountLabel(t: { amount: number; type: string }) {
  const type = t.type.toLowerCase();
  const credit = ['credit','credited','refund','cashback','reward','bonus','top_up','topup'].some(x => type.includes(x));
  return `${credit ? '+' : '-'}₹${Math.abs(t.amount).toFixed(2)}`;
}

export default function ScreenPage() {
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    const mobile = getStoredCustomerMobile();
    if (!mobile) { setError('Please sign in to view your wallet.'); setLoading(false); return; }
    if (refresh) setRefreshing(true); else setLoading(true);
    setError('');
    try { setWallet(await getCustomerWallet(mobile)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load wallet.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <Screen>

    {loading ? <View style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator /><Text style={{ marginTop: 10, color: colors.inkFaint }}>Loading wallet…</Text></View> :
      error ? <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 18 }}><Text style={{ color: colors.ink }}>{error}</Text></View> :
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: colors.greenTint, borderRadius: 16, padding: 22, alignItems: 'center' }}>
          <Text style={{ color: colors.greenDark, fontWeight: '800' }}>Available Balance</Text>
          <Text style={{ fontSize: 34, fontWeight: '900', color: colors.ink, marginTop: 5 }}>{money(wallet?.balance ?? null)}</Text>
          {wallet?.balance == null && <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 6, textAlign: 'center' }}>Balance is shown when the trusted wallet ledger provides it.</Text>}
        </View>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.ink, marginTop: 22 }}>Recent Activity</Text>
        {!wallet?.transactions.length ? <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 10 }}><Text style={{ color: colors.inkFaint }}>No wallet transactions found.</Text></View> : wallet.transactions.map(t => <View key={t.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 15, marginTop: 10 }}><Text style={{ fontWeight: '800', color: colors.greenDark }}>{amountLabel(t)} · {prettyWalletType(t.type)}</Text>{t.description ? <Text style={{ color: colors.ink, marginTop: 4 }}>{t.description}</Text> : null}{t.referenceId ? <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 4 }}>Reference: {t.referenceId}</Text> : null}{t.status ? <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 4 }}>Status: {t.status}</Text> : null}</View>)}
      </ScrollView>}
  </Screen>;
}
