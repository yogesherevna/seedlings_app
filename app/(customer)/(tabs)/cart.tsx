import { Text, View, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { productImages } from '../../../data/imageMap';
import { useAppStore } from '../../../store/appStore';

export default function Cart() {
 const cart=useAppStore(s=>s.cart); const change=useAppStore(s=>s.changeQuantity); const remove=useAppStore(s=>s.removeFromCart);
 const subtotal=cart.reduce((a,i)=>a+i.price*i.quantity,0); const delivery=cart.length?40:0; const total=subtotal+delivery;
 return <Screen><Text style={{fontSize:24,fontWeight:'900',color:colors.ink,marginTop:10}}>Your Cart</Text>
 {cart.length===0?<View style={{alignItems:'center',paddingTop:80}}><Text style={{fontSize:20,fontWeight:'900',color:colors.ink}}>Your cart is empty</Text><Text style={{color:colors.inkSoft,marginVertical:8}}>Fresh microgreens are waiting for you.</Text><View style={{width:190,marginTop:12}}><Button title="Start Shopping" onPress={()=>router.push('/(customer)/(tabs)/products')}/></View></View>:
 <>
 {cart.map(i=><View key={i.id+i.selectedWeight} style={{backgroundColor:'#fff',borderWidth:1,borderColor:colors.lineSoft,borderRadius:14,padding:10,flexDirection:'row',marginBottom:10}}>
 <Image source={productImages[i.image]} style={{width:75,height:75,borderRadius:10,backgroundColor:colors.block}} resizeMode="contain"/>
 <View style={{flex:1,marginLeft:10}}><Text style={{fontWeight:'800',color:colors.ink}}>{i.name}</Text><Text style={{color:colors.inkSoft,fontSize:12,marginTop:3}}>{i.selectedWeight} · ₹{i.price}</Text>
 <View style={{flexDirection:'row',alignItems:'center',marginTop:10,gap:12}}><Pressable onPress={()=>change(i.id,-1,i.selectedWeight)}><Text style={styles.step}>−</Text></Pressable><Text style={{fontWeight:'900'}}>{i.quantity}</Text><Pressable onPress={()=>change(i.id,1,i.selectedWeight)}><Text style={styles.step}>+</Text></Pressable><Pressable onPress={()=>remove(i.id,i.selectedWeight)} style={{marginLeft:'auto'}}><Text style={{color:colors.danger,fontWeight:'800'}}>Remove</Text></Pressable></View></View></View>)}
 <View style={{backgroundColor:'#fff',borderRadius:14,padding:16,marginTop:6}}><Text style={{fontWeight:'900',fontSize:17,color:colors.ink}}>Order Summary</Text>
 <View style={styles.line}><Text>Subtotal</Text><Text>₹{subtotal}</Text></View><View style={styles.line}><Text>Delivery</Text><Text>₹{delivery}</Text></View><View style={styles.line}><Text style={{fontWeight:'900'}}>Total</Text><Text style={{fontWeight:'900',fontSize:18}}>₹{total}</Text></View>
 <Button title="Proceed to Checkout" onPress={()=>router.push('/(customer)/checkout')}/></View></>}
 </Screen>
}
const styles={line:{flexDirection:'row',justifyContent:'space-between',paddingVertical:9,borderBottomWidth:1,borderBottomColor:colors.lineSoft},step:{fontSize:22,color:colors.greenDark,fontWeight:'900'}};
