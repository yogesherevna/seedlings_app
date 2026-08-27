import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { productImages } from '../data/imageMap';
import type { Product } from '../data/products';
import { useAppStore } from '../store/appStore';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const content = <View style={styles.screen}>{children}</View>;
  return scroll ? <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>{content}</ScrollView> : <View style={styles.root}>{content}</View>;
}

export function Header({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: Math.max(insets.top, 8),
          height: 54 + Math.max(insets.top, 8),
        },
      ]}
    >
      {onBack ? (
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}

      <Text style={styles.headerTitle}>{title}</Text>

      <View style={styles.back} />
    </View>
  );
}

export function Logo({ size = 110 }: { size?: number }) {
  return <Image source={require('../assets/logo.png')} style={{ width: size, height: size * 0.803 }} resizeMode="contain" />;
}

export function Button({ title, onPress, secondary = false, orange = false }: { title: string; onPress: () => void; secondary?: boolean; orange?: boolean }) {
  return <Pressable onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, orange && styles.orangeButton]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
  </Pressable>;
}

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const addToCart = useAppStore((s) => s.addToCart);
  const source = productImages[product.image] ?? productImages['broccoli.jpg'];
  return (
    <Pressable onPress={onPress} style={styles.productCard}>
      <View style={styles.productImageWrap}><Image source={source} style={styles.productImage} resizeMode="contain" /></View>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <View style={styles.chipsRow}><Text style={styles.chip}>{product.defaultWeight}</Text></View>
      <View style={styles.priceRow}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}><Text style={styles.price}>₹{product.price}</Text><Text style={styles.mrp}>₹{product.mrp}</Text></View>
        <Pressable onPress={() => addToCart(product)} style={styles.addButton}><Text style={styles.addText}>+</Text></Pressable>
      </View>
    </Pressable>
  );
}

export function SearchBar({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder="Search microgreens, recipes…" placeholderTextColor={colors.inkFaint} style={styles.search} />;
}

export const styles = StyleSheet.create({
  root:{ flex:1, backgroundColor:colors.paper },
  scroll:{ paddingBottom:100 },
  screen:{ paddingHorizontal:16, paddingTop:8 },
  header:{ height:54, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  headerTitle:{ fontSize:18, fontWeight:'800', color:colors.ink },
  back:{ width:40, height:40, alignItems:'center', justifyContent:'center' },
  backText:{ fontSize:36, color:colors.ink, lineHeight:40 },
  sectionTitle:{ fontSize:20, fontWeight:'800', color:colors.ink, marginTop:20, marginBottom:12 },
  muted:{ color:colors.inkSoft, fontSize:13, lineHeight:19 },
  card:{ backgroundColor:colors.panel, borderRadius:14, borderWidth:1, borderColor:colors.lineSoft, padding:16, marginBottom:12 },
  button:{ minHeight:48, borderRadius:10, backgroundColor:colors.green, alignItems:'center', justifyContent:'center', paddingHorizontal:18 },
  buttonText:{ color:'#fff', fontSize:15, fontWeight:'800' },
  secondaryButton:{ backgroundColor:colors.panel, borderWidth:1, borderColor:colors.line, },
  secondaryButtonText:{ color:colors.greenDark },
  orangeButton:{ backgroundColor:colors.orange },
  input:{ backgroundColor:'#fff', borderWidth:1, borderColor:colors.line, borderRadius:10, height:50, paddingHorizontal:14, color:colors.ink, fontSize:16 },
  search:{ backgroundColor:'#fff', borderWidth:1, borderColor:colors.lineSoft, borderRadius:12, height:46, paddingHorizontal:14, color:colors.ink, marginTop:8 },
  productCard:{ width:'48%', backgroundColor:'#fff', borderRadius:14, borderWidth:1, borderColor:colors.lineSoft, padding:10, marginBottom:12 },
  productImageWrap:{ height:135, borderRadius:10, backgroundColor:colors.block, overflow:'hidden', alignItems:'center', justifyContent:'center' },
  productImage:{ width:'100%', height:'100%' },
  productName:{ color:colors.ink, fontSize:14, fontWeight:'800', marginTop:9, minHeight:38 },
  chipsRow:{ flexDirection:'row', marginTop:4 },
  chip:{ borderWidth:1, borderColor:colors.line, borderRadius:999, paddingHorizontal:8, paddingVertical:4, color:colors.inkSoft, fontSize:11 },
  priceRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:10 },
  price:{ color:colors.ink, fontSize:16, fontWeight:'900' },
  mrp:{ color:colors.inkFaint, fontSize:12, textDecorationLine:'line-through' },
  addButton:{ width:34, height:34, borderRadius:10, backgroundColor:colors.green, alignItems:'center', justifyContent:'center' },
  addText:{ color:'#fff', fontSize:22, fontWeight:'700', lineHeight:24 },
  row:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
});
