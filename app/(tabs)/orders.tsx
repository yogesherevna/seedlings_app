import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/UI';
import { colors } from '../../constants/theme';

const orders=[['#SM001234','Sat, 30 Aug','₹270','Confirmed'],['#SM001200','Sun, 24 Aug','₹300','Delivered'],['#SM001190','Sat, 17 Aug','₹250','Delivered']];
export default function Orders(){return <Screen><Text style={{fontSize:24,fontWeight:'900',color:colors.ink,marginTop:10}}>My Orders</Text>
 <View style={{flexDirection:'row',gap:8,marginVertical:14}}><View style={{backgroundColor:colors.green,paddingVertical:8,paddingHorizontal:14,borderRadius:999}}><Text style={{color:'#fff',fontWeight:'800'}}>One Time</Text></View><Pressable onPress={()=>router.push('/account/subscriptions')} style={{backgroundColor:'#fff',borderWidth:1,borderColor:colors.line,paddingVertical:8,paddingHorizontal:14,borderRadius:999}}><Text style={{color:colors.inkSoft,fontWeight:'800'}}>Subscriptions</Text></Pressable></View>
 {orders.map(o=><View key={o[0]} style={{backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:colors.lineSoft,padding:15,marginBottom:10}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{fontWeight:'900',color:colors.ink}}>{o[0]}</Text><Text style={{fontWeight:'800',color:o[3]==='Delivered'?colors.greenDark:colors.orangeDark}}>{o[3]}</Text></View><Text style={{color:colors.inkSoft,marginTop:7}}>{o[1]} · {o[2]}</Text><Text style={{color:colors.greenDark,fontWeight:'800',marginTop:10}}>View details ›</Text></View>)}
 </Screen>}
