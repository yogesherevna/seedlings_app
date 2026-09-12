import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import { getCustomerProfile, updateCustomerProfile } from '../../../services/customerProfile';

export default function CustomerProfileScreen() {
  const mobile = useAppStore((state) => state.mobile);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredDeliveryDay, setPreferredDeliveryDay] = useState('Saturday');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!mobile) {
        router.replace('/(customer)/auth/login');
        return;
      }
      try {
        const profile = await getCustomerProfile(mobile);
        if (!active) return;
        setName(profile.name);
        setEmail(profile.email);
        setPreferredDeliveryDay(profile.preferredDeliveryDay || 'Saturday');
      } catch (error) {
        console.error('Customer profile load failed:', error);
        if (active) Alert.alert('Unable to load profile', 'Please check your internet connection and try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [mobile]);

  const save = async () => {
    try {
      setSaving(true);
      await updateCustomerProfile(mobile, { name, email });
      Alert.alert('Profile updated', 'Your profile has been saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update your profile.';
      Alert.alert('Unable to save profile', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>

      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={{ color: colors.inkSoft, marginTop: 12 }}>Loading profile…</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 16 }}>
          <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>MOBILE NUMBER</Text>
          <TextInput value={`+91 ${mobile}`} editable={false} style={{ backgroundColor: colors.block, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 10, height: 50, paddingHorizontal: 14, color: colors.inkSoft, fontSize: 16 }} />

          <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 7 }}>NAME</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Enter your name" placeholderTextColor={colors.inkFaint} autoCapitalize="words" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 10, height: 50, paddingHorizontal: 14, color: colors.ink, fontSize: 16 }} />

          <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 7 }}>EMAIL</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Enter your email (optional)" placeholderTextColor={colors.inkFaint} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 10, height: 50, paddingHorizontal: 14, color: colors.ink, fontSize: 16 }} />

          <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 7 }}>PREFERRED DELIVERY DAY</Text>
          <TextInput value={preferredDeliveryDay} editable={false} style={{ backgroundColor: colors.block, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 10, height: 50, paddingHorizontal: 14, color: colors.inkSoft, fontSize: 16 }} />

          <View style={{ marginTop: 22 }}>
            <Button title={saving ? 'Saving…' : 'Save Changes'} onPress={save} />
          </View>
        </View>
      )}
    </Screen>
  );
}
