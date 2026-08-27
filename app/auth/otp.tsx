import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Logo, Button, Screen } from '../../components/UI';
import { colors } from '../../constants/theme';
import { useAppStore } from '../../store/appStore';

export default function OTP() {
  const mobile=useAppStore(s=>s.mobile); const login=useAppStore(s=>s.login);
  const [otp,setOtp]=useState('');
  const verify=()=> {
    if(otp!=='1234') return Alert.alert('Invalid OTP','For this static demo, use OTP 1234.');
    login(); router.replace('/(tabs)');
  };
  return <Screen scroll={false}><View style={{alignItems:'center',paddingTop:42}}>
    <Logo size={130}/><Text style={{fontSize:25,fontWeight:'900',color:colors.ink,marginTop:10}}>Enter OTP</Text>
    <Text style={{color:colors.inkSoft,marginTop:6,textAlign:'center'}}>We've sent a 4-digit code to{`\n`}+91 {mobile}</Text>
    <View style={{flexDirection:'row',gap:9,marginTop:26,marginBottom:22}}>
      {[0,1,2,3].map(i=><TextInput key={i} value={otp[i]??''} onChangeText={v=>{const next=otp.split(''); next[i]=v.slice(-1); setOtp(next.join(''))}} keyboardType="number-pad" maxLength={1} style={{width:55,height:55,backgroundColor:'#fff',borderWidth:1,borderColor:otp.length===4?colors.green:colors.line,borderRadius:10,textAlign:'center',fontSize:22,fontWeight:'800',color:colors.ink}} />)}
    </View>
    <Text style={{color:colors.inkSoft,marginBottom:26}}>Demo OTP: <Text style={{fontWeight:'900',color:colors.greenDark}}>1234</Text></Text>
    <View style={{width:'100%'}}><Button title="Verify" onPress={verify}/></View>
  </View></Screen>
}
import { TextInput } from 'react-native';
