import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';

export default function Checkout(){const cart=useAppStore(s=>s.cart); const clear=useAppStore(s=>s.clearCart); const subtotal=cart.reduce((a,i)=>a+i.price*i.quantity,0); const total=subtotal+(cart.length?40:0);
 return <Screen><Header title="Checkout" onBack={()=>router.back()}/>
 <Text style={styles.heading}>Delivery Address</Text><View style={styles.card}><Text style={styles.bold}>Home</Text><Text style={styles.muted}>123, Green Park, Pune · 411001</Text></View>
 <Text style={styles.heading}>Delivery Slot</Text><View style={styles.card}><Text style={{color:colors.greenDark,fontWeight:'900'}}>● Sat, 30 Aug</Text><Text style={[styles.muted,{marginTop:8}]}>○ Sun, 31 Aug</Text></View>
 <Text style={styles.heading}>Payment Method</Text><View style={styles.card}><Text style={styles.bold}>◉ UPI</Text><Text style={[styles.muted,{marginTop:9}]}>○ Card</Text><Text style={[styles.muted,{marginTop:9}]}>○ Wallet — ₹50 available</Text></View>
 <View style={styles.card}><View style={styles.line}><Text>Subtotal</Text><Text>₹{subtotal}</Text></View><View style={styles.line}><Text>Delivery</Text><Text>₹40</Text></View><View style={styles.line}><Text style={styles.bold}>Total</Text><Text style={{fontSize:19,fontWeight:'900'}}>₹{total}</Text></View><Button title="Place Order" onPress={()=>{clear();router.replace('/(customer)/checkout/success')}}/></View>
 </Screen>}
const styles={heading:{fontSize:18,fontWeight:'900',color:colors.ink,marginTop:12,marginBottom:8},card:{backgroundColor:'#fff',borderRadius:14,borderWidth:1,borderColor:colors.lineSoft,padding:15,marginBottom:8},bold:{fontWeight:'900',color:colors.ink},muted:{color:colors.inkSoft,marginTop:4},line:{flexDirection:'row',justifyContent:'space-between',paddingVertical:7,borderBottomWidth:1,borderBottomColor:colors.lineSoft}};
