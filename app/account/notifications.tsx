import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../../components/UI';
import { colors } from '../../constants/theme';

export default function ScreenPage() {
 return <Screen><Header title="Notifications" onBack={()=>router.back()}/><View style={{backgroundColor:'#fff',borderRadius:14,padding:16}}><Text style={{fontWeight:'900',color:colors.ink}}>Weekend delivery reminder</Text><Text style={{color:colors.inkSoft,marginTop:5}}>Your fresh microgreens are scheduled for Saturday.</Text></View></Screen>;
}
