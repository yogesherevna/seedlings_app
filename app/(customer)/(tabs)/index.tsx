import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ProductCard, Screen, SearchBar } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { getProducts, refreshProducts } from '../../../services/products/productService';
import type { Product } from '../../../services/products/productService';

export default function Home() {
  const [q,setQ]=useState('');
  const [products,setProducts]=useState<Product[]>([]);
  useEffect(()=>{
    let alive = true;
    void getProducts().then(r=>{
      if (alive) setProducts(r.products);
      void refreshProducts().then(fresh=>{ if (alive) setProducts(fresh); }).catch(()=>{});
    }).catch(()=>{ if (alive) setProducts([]); });
    return()=>{ alive=false; };
  },[]);
  const popular=products.filter(p=>p.popular).filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));
  return <Screen>
    <SearchBar value={q} onChangeText={setQ}/>
    <View style={{marginTop:14,backgroundColor:colors.greenDark,borderRadius:16,padding:18,overflow:'hidden'}}>
      <Text style={{color:'#fff',fontSize:22,fontWeight:'900'}}>Small Greens.{`\n`}Big Nutrition.</Text>
      <Text style={{color:'#fff',marginTop:5}}>Freshly harvested every week.</Text>
      <Pressable onPress={()=>router.push('/(customer)/(tabs)/products')} style={{backgroundColor:'#fff',alignSelf:'flex-start',paddingHorizontal:14,paddingVertical:9,borderRadius:999,marginTop:12}}><Text style={{color:colors.greenDark,fontWeight:'900'}}>Shop Fresh</Text></Pressable>
    </View>
    <View style={{flexDirection:'row',gap:10,marginTop:14}}>
      {['One Time','Subscriptions'].map((x,i)=><Pressable key={x} onPress={()=>i?router.push('/(customer)/account/subscriptions'):router.push('/(customer)/(tabs)/products')} style={{flex:1,backgroundColor:i?colors.orangeTint:colors.greenTint,padding:14,borderRadius:14}}><Text style={{fontWeight:'900',color:i?colors.orangeDark:colors.greenDark}}>{x}</Text><Text style={{fontSize:11,color:colors.inkSoft,marginTop:3}}>{i?'Save on every delivery':'Fresh this weekend'}</Text></Pressable>)}
    </View>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={styles.section}>Popular Products</Text><Pressable onPress={()=>router.push('/(customer)/(tabs)/products')}><Text style={{color:colors.greenDark,fontWeight:'800'}}>View All</Text></Pressable></View>
    <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>{popular.slice(0,4).map(p=><ProductCard key={p.id} product={p} onPress={()=>router.push({pathname:'/(customer)/product/[id]',params:{id:p.id}})}/>)}</View>
  </Screen>
}
const styles={section:{fontSize:20,fontWeight:'900',color:colors.ink,marginTop:22,marginBottom:12}};
