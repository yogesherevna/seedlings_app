import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
const plans=[['Weekly','Every weekend','₹240 / month'],['Monthly','4 deliveries','₹900'],['Quarterly','12 deliveries','₹2,400']];
export default function Subscriptions(){return <Screen><Header title="Subscriptions" onBack={()=>router.back()}/>{plans.map((p,i)=><View key={p[0]} style={{backgroundColor:'#fff',borderRadius:15,borderWidth:1,borderColor:colors.lineSoft,padding:16,marginBottom:10}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><View><Text style={{fontSize:17,fontWeight:'900',color:colors.ink}}>{p[0]}</Text><Text style={{color:colors.inkSoft,marginTop:4}}>{p[1]}</Text></View><Pressable style={{backgroundColor:colors.green,paddingHorizontal:14,paddingVertical:8,borderRadius:999}}><Text style={{color:'#fff',fontWeight:'900'}}>Subscribe</Text></Pressable></View><Text style={{fontSize:20,fontWeight:'900',color:colors.greenDark,marginTop:12}}>{p[2]}</Text></View>)}</Screen>}
