import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Logo, Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { ensureClientOnboarding } from '../../../services/clientOnboarding';

const STATIC_OTP = '1234';
const OTP_VALIDITY_SECONDS = 60;

export default function OTP() {
  const mobile = useAppStore((s) => s.mobile);
  const login = useAppStore((s) => s.login);
  const [otp, setOtp] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(OTP_VALIDITY_SECONDS);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => setRemainingSeconds((current) => Math.max(current - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  useEffect(() => {
    if (!mobile) router.replace('/(customer)/auth/login');
  }, [mobile]);

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const verify = async () => {
    if (remainingSeconds <= 0) {
      Alert.alert('OTP expired', 'Please request a new OTP and try again.');
      return;
    }
    if (otp !== STATIC_OTP) {
      Alert.alert('Invalid OTP', 'Please enter the correct 4-digit OTP.');
      return;
    }
    try {
      setVerifying(true);
      await ensureClientOnboarding(mobile);
      login();
      router.replace('/(customer)/(tabs)');
    } catch (error) {
      console.error('Customer verification failed:', error);
      Alert.alert('Unable to complete login', 'Please check your internet connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const resend = () => {
    if (remainingSeconds > 0) return;
    setOtp('');
    setRemainingSeconds(OTP_VALIDITY_SECONDS);
  };

  return <Screen scroll={false}><View style={{alignItems:'center',paddingTop:42}}>
    <Logo size={130}/><Text style={{fontSize:25,fontWeight:'900',color:colors.ink,marginTop:10}}>Enter OTP</Text>
    <Text style={{color:colors.inkSoft,marginTop:6,textAlign:'center'}}>We've sent a 4-digit code to{`\n`}+91 {mobile}</Text>
    <View style={{flexDirection:'row',gap:9,marginTop:26,marginBottom:22}}>
      {[0,1,2,3].map(i=><TextInput key={i} value={otp[i]??''} onChangeText={v=>{const next=otp.split(''); next[i]=v.slice(-1).replace(/\D/g,''); setOtp(next.join('').slice(0,4));}} keyboardType="number-pad" maxLength={1} editable={!verifying && remainingSeconds>0} style={{width:55,height:55,backgroundColor:'#fff',borderWidth:1,borderColor:otp.length===4?colors.green:colors.line,borderRadius:10,textAlign:'center',fontSize:22,fontWeight:'800',color:colors.ink}}/>)}
    </View>
    <Text style={{color:remainingSeconds>0?colors.inkSoft:colors.danger,marginBottom:8}}>{remainingSeconds>0?`OTP expires in ${formattedTimer}`:'OTP expired'}</Text>
    <Text style={{color:colors.inkSoft,marginBottom:22}}>Demo OTP: <Text style={{fontWeight:'900',color:colors.greenDark}}>1234</Text></Text>
    <View style={{width:'100%'}}><Button title={verifying?'Verifying…':'Verify'} onPress={verify}/></View>
    <Pressable onPress={resend} disabled={remainingSeconds>0||verifying} style={{padding:14}}><Text style={{color:remainingSeconds>0?colors.inkFaint:colors.greenDark,fontWeight:'800'}}>Resend OTP</Text></Pressable>
  </View></Screen>;
}
