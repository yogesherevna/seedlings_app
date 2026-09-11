import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { productImages } from '../../../data/imageMap';
import { products } from '../../../data/products';
import { useAppStore } from '../../../store/appStore';

export default function ProductDetail(){const {id}=useLocalSearchParams<{id:string}>(); const p=products.find(x=>x.id===id)??products[0]; const [weight,setWeight]=useState(p.defaultWeight); const add=useAppStore(s=>s.addToCart);
 return <Screen><Header title="" onBack={()=>router.back()}/><Image source={productImages[p.image]} style={{width:'100%',height:250,backgroundColor:colors.block,borderRadius:16}} resizeMode="contain"/>
 <Text style={{fontSize:25,fontWeight:'900',color:colors.ink,marginTop:16}}>{p.name}</Text><Text style={{color:colors.inkSoft,marginTop:5,lineHeight:20}}>{p.description}</Text>
 <View style={{flexDirection:'row',alignItems:'center',gap:8,marginTop:10}}><Text style={{fontSize:23,fontWeight:'900',color:colors.ink}}>₹{p.price}</Text><Text style={{color:colors.inkFaint,textDecorationLine:'line-through'}}>₹{p.mrp}</Text></View>
 <Text style={{fontWeight:'800',color:colors.ink,marginTop:18,marginBottom:8}}>Select weight</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{p.weights.map(w=><Pressable key={w} onPress={()=>setWeight(w)} style={{paddingHorizontal:14,paddingVertical:9,borderRadius:999,borderWidth:1,borderColor:weight===w?colors.greenDark:colors.line,backgroundColor:weight===w?colors.greenTint:'#fff'}}><Text style={{color:weight===w?colors.greenDark:colors.inkSoft,fontWeight:'800'}}>{w}</Text></Pressable>)}</View>
 <View style={{backgroundColor:colors.greenTint,borderRadius:12,padding:12,marginTop:18}}><Text style={{color:colors.greenDark,fontWeight:'800'}}>Freshly harvested · Available for this weekend slot</Text></View>
 <Text style={{fontSize:17,fontWeight:'900',color:colors.ink,marginTop:20}}>Product Info</Text><Text style={{color:colors.inkSoft,lineHeight:20,marginTop:6}}>Grown with care and packed fresh. Keep refrigerated after delivery and consume while fresh.</Text>
 <View style={{marginTop:20,marginBottom:30}}><Button title={`Add to Cart — ₹${p.price}`} onPress={()=>{add(p,weight);router.push('/(customer)/(tabs)/cart')}}/></View>
 </Screen>}
import { Pressable } from 'react-native';
