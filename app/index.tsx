import { useEffect } from 'react';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { useAppStore } from '../store/appStore';

export default function Splash() {
  const authenticated = useAppStore((s) => s.authenticated);
  const sessionHydrated = useAppStore((s) => s.sessionHydrated);
  useEffect(() => {
    if (!sessionHydrated) return;
    const t = setTimeout(() => router.replace(authenticated ? '/(customer)/(tabs)' : '/(customer)/auth/login'), 700);
    return () => clearTimeout(t);
  }, [authenticated, sessionHydrated]);
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.tagline}>Grow Healthy. Live Fresh!</Text>
      <View style={styles.leaf}><Text>🌿</Text></View>
    </View>
  );
}
const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center'},
 logo:{width:280,height:225},
 tagline:{color:colors.greenDark,fontSize:19,fontWeight:'900',fontStyle:'italic',marginTop:4},
 leaf:{position:'absolute',bottom:35,opacity:.8}
});
