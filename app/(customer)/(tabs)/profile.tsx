import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';

const items=[['My Profile','/(customer)/account/profile'],['Delivery Addresses','/(customer)/account/addresses'],['My Orders','/(customer)/(tabs)/orders'],['My Subscriptions','/(customer)/account/subscriptions'],['My Wallet','/(customer)/account/wallet'],['Notifications','/(customer)/account/notifications'],['Feedback','/(customer)/account/feedback'],['About','/(customer)/account/about']];
export default function Profile(){const mobile=useAppStore(s=>s.mobile); const logout=useAppStore(s=>s.logout); return <Screen>
 <View style={{alignItems:'center',paddingTop:12,paddingBottom:18}}><View style={{width:72,height:72,borderRadius:36,backgroundColor:colors.greenTint,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:30}}>👤</Text></View><Text style={{fontSize:22,fontWeight:'900',color:colors.ink,marginTop:8}}>Yogesh</Text><Text style={{color:colors.inkSoft}}>+91 {mobile||'9876543210'}</Text></View>
 <View style={{backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:colors.lineSoft}}>{items.map(([label,path])=><Pressable key={label} onPress={()=>router.push(path as any)} style={{padding:16,borderBottomWidth:1,borderBottomColor:colors.lineSoft,flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:colors.ink,fontWeight:'700'}}>{label}</Text><Text style={{color:colors.inkFaint}}>›</Text></Pressable>)}</View>
 <Pressable onPress={()=>{logout();router.replace('/(customer)/auth/login')}} style={{padding:16,alignItems:'center'}}><Text style={{color:colors.danger,fontWeight:'900'}}>Logout</Text></Pressable>
 </Screen>}
