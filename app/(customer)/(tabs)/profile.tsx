import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { getCustomerProfile } from '../../../services/customerProfile';

const items=[['My Profile','/(customer)/account/profile'],['Delivery Addresses','/(customer)/account/addresses'],['My Orders','/(customer)/(tabs)/orders'],['My Subscriptions','/(customer)/account/subscriptions'],['Delivery Calendar','/(customer)/account/delivery-calendar']];
export default function Profile(){const mobile=useAppStore(s=>s.mobile); const logout=useAppStore(s=>s.logout); const [name,setName]=useState(''); const [loading,setLoading]=useState(true); useEffect(()=>{let active=true; if(!mobile){setLoading(false);return;} void getCustomerProfile(mobile).then(profile=>{if(active)setName(profile.name)}).catch(error=>console.warn('Profile summary load failed:',error)).finally(()=>{if(active)setLoading(false)}); return ()=>{active=false}},[mobile]); return <Screen>
 <View style={{alignItems:'center',paddingTop:12,paddingBottom:18}}><View style={{width:72,height:72,borderRadius:36,backgroundColor:colors.greenTint,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:30}}>👤</Text></View><Text style={{fontSize:22,fontWeight:'900',color:colors.ink,marginTop:8}}>{loading ? 'Loading…' : (name || 'Customer')}</Text><Text style={{color:colors.inkSoft}}>+91 {mobile||'9876543210'}</Text></View>
 <View style={{backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:colors.lineSoft}}>{items.map(([label,path])=><Pressable key={label} onPress={()=>router.push(path as any)} style={{padding:16,borderBottomWidth:1,borderBottomColor:colors.lineSoft,flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:colors.ink,fontWeight:'700'}}>{label}</Text><Text style={{color:colors.inkFaint}}>›</Text></Pressable>)}</View>
 <Pressable onPress={()=>{logout();router.replace('/(customer)/auth/login')}} style={{padding:16,alignItems:'center'}}><Text style={{color:colors.danger,fontWeight:'900'}}>Logout</Text></Pressable>
 </Screen>}
