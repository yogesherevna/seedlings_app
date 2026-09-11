import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { productImages } from '../../../data/imageMap';
import { getProducts } from '../../../services/products/productService';
import type { Product } from '../../../services/products/productService';
import { useAppStore } from '../../../store/appStore';

export default function ProductDetail(){
  const {id}=useLocalSearchParams<{id:string}>();
  const [products,setProducts]=useState<Product[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ void getProducts().then(r=>setProducts(r.products)).finally(()=>setLoading(false)); },[]);
  const p=products.find(x=>x.id===id);
  const [weight,setWeight]=useState('');
  useEffect(()=>{ if(p) setWeight(p.defaultWeight); },[p?.id,p?.defaultWeight]);
  if(loading) return <Screen><ActivityIndicator color={colors.greenDark} style={{marginTop:40}}/></Screen>;
  if(!p) return <Screen><Header title="Product" onBack={()=>router.back()}/><Text style={{color:colors.inkSoft}}>Product not found.</Text></Screen>;
  const add=useAppStore(s=>s.addToCart);
  const imageSource=p.imageUrl?.startsWith('http') ? {uri:p.imageUrl} : (productImages[p.image] ?? productImages['broccoli.jpg']);
  return <Screen><Header title="" onBack={()=>router.back()}/><Image source={imageSource} style={{width:'100%',height:250,backgroundColor:colors.block,borderRadius:16}} resizeMode="contain"/>
  <Text style={{fontSize:25,fontWeight:'900',color:colors.ink,marginTop:16}}>{p.name}</Text><Text style={{color:colors.inkSoft,marginTop:5,lineHeight:20}}>{p.description}</Text>
  <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:10}}><Text style={{fontSize:23,fontWeight:'900',color:colors.ink}}>₹{p.price}</Text>{p.mrp ? <Text style={{color:colors.inkFaint,textDecorationLine:'line-through'}}>₹{p.mrp}</Text> : null}</View>
  <Text style={{fontWeight:'800',color:colors.ink,marginTop:18,marginBottom:8}}>Pack</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{p.weights.map(w=><Pressable key={w} onPress={()=>setWeight(w)} style={{paddingHorizontal:14,paddingVertical:9,borderRadius:999,borderWidth:1,borderColor:weight===w?colors.greenDark:colors.line,backgroundColor:weight===w?colors.greenTint:'#fff'}}><Text style={{color:weight===w?colors.greenDark:colors.inkSoft,fontWeight:'800'}}>{w}</Text></Pressable>)}</View>
  <View style={{backgroundColor:colors.greenTint,borderRadius:12,padding:12,marginTop:18}}><Text style={{color:colors.greenDark,fontWeight:'800'}}>{p.inStock ? 'Available for purchase' : 'Currently unavailable'}</Text></View>{p.subscriptionPurchase ? <Pressable onPress={()=>router.push({ pathname:'/(customer)/account/subscriptions', params:{productId:p.id} })} style={{marginTop:12,borderWidth:1,borderColor:colors.green,borderRadius:12,padding:13,alignItems:'center'}}><Text style={{color:colors.greenDark,fontWeight:'900'}}>View Subscription Plans</Text></Pressable> : null}
  <Text style={{fontSize:17,fontWeight:'900',color:colors.ink,marginTop:20}}>Product Info</Text><Text style={{color:colors.inkSoft,lineHeight:20,marginTop:6}}>Grown with care and packed fresh. Keep refrigerated after delivery and consume while fresh.</Text>
  <View style={{marginTop:20,marginBottom:30}}><Button title={p.inStock ? `Add to Cart — ₹${p.price}` : 'Currently Unavailable'} onPress={()=>{if(!p.inStock)return;add(p,weight);router.push('/(customer)/(tabs)/cart')}}/></View>
  </Screen>
}
