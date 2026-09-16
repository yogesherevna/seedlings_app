import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Logo, Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { ensureClientOnboarding } from '../../../services/clientOnboarding';

const DEV_OTP = '1234';
const OTP_VALIDITY_SECONDS = 60;
const OTP_LENGTH = 4;

export default function OTP() {
  const mobile = useAppStore((s) => s.mobile);
  const login = useAppStore((s) => s.login);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otp = otpDigits.join('');
  const [remainingSeconds, setRemainingSeconds] = useState(OTP_VALIDITY_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => setRemainingSeconds((current) => Math.max(current - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  useEffect(() => {
    if (!mobile) {
      router.replace('/(customer)/auth/login');
      return;
    }
    // Put the cursor in the first OTP box as soon as the screen opens.
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 80);
    return () => clearTimeout(timer);
  }, [mobile]);

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const updateOtpAt = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Also handle browser/mobile paste/autofill of multiple digits.
    const next = [...otpDigits];
    digits.slice(0, OTP_LENGTH - index).split('').forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    setOtpDigits(next);

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verify = async () => {
    if (!__DEV__) {
      Alert.alert('OTP verification unavailable', 'Customer OTP verification is not configured for this production build yet.');
      return;
    }
    if (remainingSeconds <= 0) {
      Alert.alert('OTP expired', 'Please request a new OTP and try again.');
      return;
    }
    if (otp !== DEV_OTP) {
      Alert.alert('Invalid OTP', 'Please enter the correct 4-digit OTP.');
      return;
    }
    try {
      setVerifying(true);
      await ensureClientOnboarding(mobile);
      await login(mobile);
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
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setRemainingSeconds(OTP_VALIDITY_SECONDS);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  return <Screen scroll={false}><View style={{alignItems:'center',paddingTop:42}}>
    <Logo size={130}/><Text style={{fontSize:25,fontWeight:'900',color:colors.ink,marginTop:10}}>Enter OTP</Text>
    <Text style={{color:colors.inkSoft,marginTop:6,textAlign:'center'}}>We've sent a 4-digit code to{`\n`}+91 {mobile}</Text>
    <View style={{flexDirection:'row',gap:9,marginTop:26,marginBottom:22}}>
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputRefs.current[i] = ref; }}
          value={otp[i] ?? ''}
          onChangeText={(value) => updateOtpAt(i, value)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          editable={!verifying && remainingSeconds > 0}
          selectTextOnFocus
          style={{width:55,height:55,backgroundColor:colors.panel,borderWidth:1,borderColor:otp.length===OTP_LENGTH?colors.green:colors.line,borderRadius:10,textAlign:'center',fontSize:22,fontWeight:'800',color:colors.ink}}
        />
      ))}
    </View>
    <Text style={{color:remainingSeconds>0?colors.inkSoft:colors.danger,marginBottom:8}}>{remainingSeconds>0?`OTP expires in ${formattedTimer}`:'OTP expired'}</Text>
    {__DEV__ ? <Text style={{color:colors.inkSoft,marginBottom:22}}>Development OTP: <Text style={{fontWeight:'900',color:colors.greenDark}}>1234</Text></Text> : <Text style={{color:colors.danger,marginBottom:22,textAlign:'center'}}>OTP verification is not configured for this production build.</Text>}
    <View style={{width:'100%'}}><Button title={verifying?'Verifying…':'Verify'} onPress={verify}/></View>
    <Pressable onPress={resend} disabled={remainingSeconds>0||verifying} style={{padding:14}}><Text style={{color:remainingSeconds>0?colors.inkFaint:colors.greenDark,fontWeight:'800'}}>Resend OTP</Text></Pressable>
  </View></Screen>;
}
