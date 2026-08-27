import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Header, Screen } from '../../components/UI';
import { colors } from '../../constants/theme';

export default function ScreenPage() {
 return <Screen><Header title="Feedback" onBack={()=>router.back()}/><View style={{backgroundColor:'#fff',borderRadius:14,padding:16}}><Text style={{fontWeight:'900',color:colors.ink}}>How was your experience?</Text><Text style={{color:colors.inkSoft,marginTop:6}}>Static demo screen — connect this to Firebase later.</Text><View style={{marginTop:14}}><Button title="Submit Feedback" onPress={()=>router.back()}/></View></View></Screen>;
}
