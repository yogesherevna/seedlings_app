import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';

export default function ScreenPage() {
 return <Screen><Header title="About Seedlings" onBack={()=>router.back()}/><View style={{alignItems:'center',paddingTop:20}}><Text style={{fontSize:20,fontWeight:'900',color:colors.ink}}>Seedlings Microgreens</Text><Text style={{color:colors.inkSoft,textAlign:'center',marginTop:8}}>Grow Healthy. Live Fresh!{`\n`}Fresh microgreens delivered with care.</Text></View></Screen>;
}
