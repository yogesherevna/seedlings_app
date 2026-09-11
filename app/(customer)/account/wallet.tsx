import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';

export default function ScreenPage() {
 return <Screen><Header title="My Wallet" onBack={()=>router.back()}/><View style={{backgroundColor:colors.greenTint,borderRadius:16,padding:22,alignItems:'center'}}><Text style={{color:colors.greenDark,fontWeight:'800'}}>Available Balance</Text><Text style={{fontSize:34,fontWeight:'900',color:colors.ink,marginTop:5}}>₹50.00</Text></View><Text style={{fontSize:18,fontWeight:'900',color:colors.ink,marginTop:22}}>Recent Activity</Text><View style={{backgroundColor:'#fff',borderRadius:14,padding:15,marginTop:10}}><Text style={{fontWeight:'800',color:colors.greenDark}}>+₹50 · Welcome Reward</Text><Text style={{color:colors.inkFaint,fontSize:12,marginTop:4}}>24 Aug 2026</Text></View></Screen>;
}
