import { Tabs } from 'expo-router';
import { colors } from '../../constants/theme';

export default function TabLayout() {
  return <Tabs screenOptions={{
    headerShown:false, tabBarActiveTintColor:colors.greenDark, tabBarInactiveTintColor:colors.inkSoft,
    tabBarStyle:{height:68,paddingBottom:10,paddingTop:6,backgroundColor:'#fff',borderTopColor:colors.lineSoft},
    tabBarLabelStyle:{fontSize:10,fontWeight:'700'},
  }}>
    <Tabs.Screen name="index" options={{title:'Home',tabBarIcon:()=>null}}/>
    <Tabs.Screen name="products" options={{title:'Products',tabBarIcon:()=>null}}/>
    <Tabs.Screen name="cart" options={{title:'Cart',tabBarIcon:()=>null}}/>
    <Tabs.Screen name="orders" options={{title:'Orders',tabBarIcon:()=>null}}/>
    <Tabs.Screen name="profile" options={{title:'Profile',tabBarIcon:()=>null}}/>
  </Tabs>;
}
