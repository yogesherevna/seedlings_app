import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';

export default function ScreenPage() {
 return <Screen><Header title="My Profile" onBack={()=>router.back()}/><View style={{backgroundColor:'#fff',borderRadius:14,padding:16}}><Text style={{fontSize:18,fontWeight:'900',color:colors.ink}}>Yogesh Joshi</Text><Text style={{color:colors.inkSoft,marginTop:6}}>+91 9876543210</Text><Text style={{color:colors.inkSoft,marginTop:6}}>yogesh@example.com</Text></View></Screen>;
}
