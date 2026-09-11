import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getCustomerOrders, type CustomerOrder } from '../../../services/orders/orderService';
import { useAppStore } from '../../../store/appStore';

function money(value: unknown) { const n = Number(value ?? 0); return `₹${Number.isFinite(n) ? n : 0}`; }
function prettyStatus(value?: string) { return String(value ?? 'pending').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
function dateText(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const d = new Date(String(value ?? '')); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Orders() {
  const mobile = useAppStore((s) => s.customerMobile);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!mobile) { setOrders([]); setLoading(false); return; }
    setLoading(true); setError('');
    try { setOrders(await getCustomerOrders(mobile)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load your orders.'); }
    finally { setLoading(false); }
  }, [mobile]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return <Screen><Text style={{fontSize:24,fontWeight:'900',color:colors.ink,marginTop:10}}>My Orders</Text>
    <View style={{flexDirection:'row',gap:8,marginVertical:14}}><View style={{backgroundColor:colors.green,paddingVertical:8,paddingHorizontal:14,borderRadius:999}}><Text style={{color:'#fff',fontWeight:'800'}}>One Time</Text></View><Pressable onPress={()=>router.push('/(customer)/account/subscriptions')} style={{backgroundColor:'#fff',borderWidth:1,borderColor:colors.line,paddingVertical:8,paddingHorizontal:14,borderRadius:999}}><Text style={{color:colors.inkSoft,fontWeight:'800'}}>Subscriptions</Text></Pressable></View>
    {loading ? <View style={{paddingTop:35,alignItems:'center'}}><ActivityIndicator size="large" color={colors.green}/><Text style={{color:colors.inkSoft,marginTop:10}}>Loading your orders…</Text></View> : error ? <View style={{backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:colors.lineSoft,padding:16}}><Text style={{fontWeight:'800',color:colors.ink}}>{error}</Text><Pressable onPress={load} style={{marginTop:12}}><Text style={{color:colors.greenDark,fontWeight:'900'}}>Try again</Text></Pressable></View> : orders.length === 0 ? <View style={{backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:colors.lineSoft,padding:20,marginTop:5}}><Text style={{fontWeight:'900',fontSize:17,color:colors.ink}}>No orders yet</Text><Text style={{color:colors.inkSoft,marginTop:6,lineHeight:20}}>Your one-time orders will appear here after you place an order.</Text><Pressable onPress={()=>router.push('/(customer)/(tabs)/products')} style={{marginTop:14}}><Text style={{color:colors.greenDark,fontWeight:'900'}}>Start shopping →</Text></Pressable></View> : orders.map((o)=><Pressable key={o.id} onPress={()=>router.push(`/(customer)/order/${o.id}`)} style={{backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:colors.lineSoft,padding:15,marginBottom:10}}><View style={{flexDirection:'row',justifyContent:'space-between',gap:8}}><Text style={{fontWeight:'900',color:colors.ink}}>{o.orderNumber ? `#${o.orderNumber}` : `#${o.id}`}</Text><Text style={{fontWeight:'800',color:colors.greenDark}}>{prettyStatus(o.status)}</Text></View><Text style={{color:colors.inkSoft,marginTop:7}}>{dateText(o.createdAt)} · {money(o.totalAmount ?? o.total)}</Text><Text style={{color:colors.greenDark,fontWeight:'800',marginTop:10}}>View details ›</Text></Pressable>)}
  </Screen>;
}
