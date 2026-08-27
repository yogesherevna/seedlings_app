import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Logo, Button, Screen } from '../../components/UI';
import { colors } from '../../constants/theme';
import { useAppStore } from '../../store/appStore';

export default function Login() {
  const [mobile,setMobile]=useState('');
  const setStoreMobile=useAppStore(s=>s.setMobile);
  const submit=()=> {
    if (!/^\d{10}$/.test(mobile)) return Alert.alert('Invalid mobile number','Please enter a valid 10-digit mobile number.');
    setStoreMobile(mobile); router.push('/auth/otp');
  };
  return <Screen scroll={false}><View style={{alignItems:'center',paddingTop:38}}>
    <Logo size={190}/><Text style={{fontSize:27,fontWeight:'900',color:colors.ink,marginTop:10}}>Welcome!</Text>
    <Text style={{color:colors.inkSoft,marginTop:6,marginBottom:28}}>Enter your mobile number to continue</Text>
    <View style={{width:'100%'}}>
      <View style={{flexDirection:'row',gap:8,marginBottom:12}}>
        <View style={{width:72,backgroundColor:'#fff',borderWidth:1,borderColor:colors.line,borderRadius:10,justifyContent:'center',alignItems:'center'}}><Text style={{fontSize:15}}>🇮🇳 +91</Text></View>
        <View style={{flex:1}}><TextInput value={mobile} onChangeText={v=>setMobile(v.replace(/\D/g,''))} keyboardType="phone-pad" maxLength={10} placeholder="9876543210" placeholderTextColor={colors.inkFaint} style={{height:50,backgroundColor:'#fff',borderWidth:1,borderColor:colors.line,borderRadius:10,paddingHorizontal:14,fontSize:16,color:colors.ink}} /></View>
      </View>
      <Button title="Send OTP" onPress={submit}/>
      <View style={{height:10}}/><Button title="Continue as Guest" secondary onPress={()=>router.replace('/(tabs)')}/>
    </View>
  </View></Screen>
}
import { TextInput } from 'react-native';
