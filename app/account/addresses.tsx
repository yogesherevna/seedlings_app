import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../../components/UI';
import { colors } from '../../constants/theme';

export default function ScreenPage() {
 return <Screen><Header title="Delivery Addresses" onBack={()=>router.back()}/><View style={{backgroundColor:'#fff',borderRadius:14,padding:16}}><Text style={{fontWeight:'900',color:colors.ink}}>Home</Text><Text style={{color:colors.inkSoft,marginTop:5}}>123, Green Park, Pune · 411001</Text><View style={{marginTop:14}}><Button title="Add New Address" onPress={()=>{}}/></View></View></Screen>;
}
