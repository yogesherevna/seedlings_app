import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ProductCard, Screen, SearchBar } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { products } from '../../../data/products';

const cats=['All','Microgreens','Wheatgrass','Sprouts','Combo'];
export default function Products() {
 const [q,setQ]=useState(''); const [cat,setCat]=useState('All');
 const list=products.filter(p=>(cat==='All'||p.category===cat)&&p.name.toLowerCase().includes(q.toLowerCase()));
 return <Screen><Text style={{fontSize:24,fontWeight:'900',color:colors.ink,marginTop:10}}>Products</Text><SearchBar value={q} onChangeText={setQ}/>
 <View style={{flexDirection:'row',gap:7,marginVertical:12}}>{cats.map(c=><Pressable key={c} onPress={()=>setCat(c)} style={{paddingHorizontal:12,paddingVertical:8,borderRadius:999,backgroundColor:cat===c?colors.greenTint:'#fff',borderWidth:1,borderColor:cat===c?colors.greenDark:colors.line}}><Text style={{fontSize:12,fontWeight:'700',color:cat===c?colors.greenDark:colors.inkSoft}}>{c}</Text></Pressable>)}</View>
 <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>{list.map(p=><ProductCard key={p.id} product={p} onPress={()=>router.push({pathname:'/(customer)/product/[id]',params:{id:p.id}})}/>)}</View>
 </Screen>
}
