import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';
import { useAppStore } from '../../../store/appStore';
import {
  addCustomerAddress,
  editCustomerAddress,
  getCustomerAddresses,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  type CustomerAddress,
} from '../../../services/customerAddresses';

const labels = ['Home', 'Office', 'Tenant', 'Other'];

type FormState = Omit<CustomerAddress, 'id'>;
const emptyForm: FormState = { label: 'Home', name: '', mobileNumber: '', addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', pincode: '' };

function addressLines(address: CustomerAddress) {
  return [address.name, address.addressLine1, address.addressLine2, address.landmark,
    [address.city, address.state, address.pincode].filter(Boolean).join(', '),
    address.mobileNumber ? `+91 ${address.mobileNumber}` : ''].filter(Boolean) as string[];
}

export default function CustomerAddressesScreen() {
  const mobile = useAppStore((state) => state.mobile);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    let active = true;
    if (!mobile) { router.replace('/(customer)/auth/login'); return () => { active = false; }; }
    void getCustomerAddresses(mobile)
      .then((result) => { if (active) setAddresses(result); })
      .catch((error) => { if (active) Alert.alert('Unable to load addresses', error instanceof Error ? error.message : 'Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mobile]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, mobileNumber: mobile }); setFormOpen(true); };
  const openEdit = (address: CustomerAddress) => {
    setEditing(address);
    setForm({ label: address.label || 'Home', name: address.name || '', mobileNumber: address.mobileNumber || mobile, addressLine1: address.addressLine1 || '', addressLine2: address.addressLine2 || '', landmark: address.landmark || '', city: address.city || '', state: address.state || '', pincode: address.pincode || '' });
    setFormOpen(true);
  };

  const save = async () => {
    const clean = { ...form, mobileNumber: form.mobileNumber.replace(/\D/g, '') };
    try {
      setSaving(true);
      const next = editing ? await editCustomerAddress(mobile, { ...clean, id: editing.id }) : await addCustomerAddress(mobile, clean);
      setAddresses(next);
      setFormOpen(false);
      Alert.alert(editing ? 'Address updated' : 'Address added', editing ? 'Your address has been updated.' : 'Your delivery address has been saved.');
    } catch (error) {
      Alert.alert('Unable to save address', error instanceof Error ? error.message : 'Please check the details and try again.');
    } finally { setSaving(false); }
  };

  const removeAddress = (address: CustomerAddress) => {
    Alert.alert(
      'Delete address',
      `Delete ${address.label || 'this address'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const next = await deleteCustomerAddress(mobile, address.id);
              setAddresses(next);
              if (editing?.id === address.id) { setEditing(null); setFormOpen(false); }
              Alert.alert('Address deleted', 'Your address has been deleted.');
            } catch (error) {
              Alert.alert('Unable to delete address', error instanceof Error ? error.message : 'Please try again.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const makeDefault = async (id: string) => {
    try {
      const next = await setDefaultCustomerAddress(mobile, id);
      setAddresses(next);
      Alert.alert('Default address updated', 'This address will be used first at checkout.');
    } catch (error) { Alert.alert('Unable to update default', error instanceof Error ? error.message : 'Please try again.'); }
  };

  const field = (label: string, key: keyof FormState, placeholder: string, options: { keyboardType?: 'default' | 'numeric'; maxLength?: number } = {}) => (
    <View style={{ marginTop: 14 }} key={key}>
      <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginBottom: 7 }}>{label.toUpperCase()}</Text>
      <TextInput value={String(form[key] ?? '')} onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))} placeholder={placeholder} placeholderTextColor={colors.inkFaint} keyboardType={options.keyboardType} maxLength={options.maxLength} style={{ backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 10, height: 48, paddingHorizontal: 14, color: colors.ink, fontSize: 15 }} />
    </View>
  );

  return (
    <Screen>

      {!formOpen && <Button title="+ Add address" onPress={openAdd} />}
      {loading ? <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.green} /><Text style={{ color: colors.inkSoft, marginTop: 12 }}>Loading addresses…</Text></View> : formOpen ? (
        <View style={{ backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 16, marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: colors.ink, fontSize: 18, fontWeight: '900' }}>{editing ? 'Edit delivery address' : 'Add delivery address'}</Text><Pressable onPress={() => setFormOpen(false)}><Text style={{ color: colors.inkSoft, fontWeight: '800' }}>Cancel</Text></Pressable></View>
          <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: '700', marginTop: 18 }}>LABEL</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>{labels.map((label) => <Pressable key={label} onPress={() => setForm((current) => ({ ...current, label }))} style={{ borderWidth: 1, borderColor: form.label === label ? colors.green : colors.line, backgroundColor: form.label === label ? colors.greenTint : '#fff', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 }}><Text style={{ color: form.label === label ? colors.greenDark : colors.inkSoft, fontWeight: '800', fontSize: 12 }}>{label}</Text></Pressable>)}</View>
          {field('Name', 'name', 'Full name')}
          {field('Mobile number', 'mobileNumber', '10-digit mobile number', { keyboardType: 'numeric', maxLength: 10 })}
          {field('Address line 1', 'addressLine1', 'Flat, building, street')}
          {field('Address line 2', 'addressLine2', 'Area, locality')}
          {field('Landmark', 'landmark', 'Nearby landmark')}
          {field('City', 'city', 'City')}
          {field('State', 'state', 'State')}
          {field('Pincode', 'pincode', '6-digit pincode', { keyboardType: 'numeric', maxLength: 6 })}
          <View style={{ marginTop: 20 }}><Button title={saving ? 'Saving…' : editing ? 'Save changes' : 'Add address'} onPress={save} /></View>
        </View>
      ) : addresses.length === 0 ? (
        <View style={{ backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1, borderColor: colors.lineSoft, padding: 24, marginTop: 14, alignItems: 'center' }}><Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900' }}>No saved addresses</Text><Text style={{ color: colors.inkSoft, marginTop: 7, textAlign: 'center' }}>Add a delivery address to continue with checkout.</Text></View>
      ) : addresses.map((address, index) => (
        <View key={address.id} style={{ backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1, borderColor: index === 0 ? colors.green : colors.lineSoft, padding: 16, marginTop: 14 }}>
          {index === 0 && <Text style={{ color: colors.green, fontSize: 11, fontWeight: '900', marginBottom: 7 }}>DEFAULT ADDRESS</Text>}
          <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '900' }}>{address.label || 'Address'}</Text>
          <Text style={{ color: colors.inkSoft, marginTop: 8, lineHeight: 20 }}>{addressLines(address).join('\n')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Pressable onPress={() => openEdit(address)} style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 }}><Text style={{ color: colors.greenDark, fontWeight: '800' }}>Edit</Text></Pressable>
            {index !== 0 && <Pressable onPress={() => makeDefault(address.id)} style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 }}><Text style={{ color: colors.inkSoft, fontWeight: '800' }}>Set default</Text></Pressable>}
            <Pressable onPress={() => removeAddress(address)} style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 }}><Text style={{ color: colors.danger, fontWeight: '800' }}>Delete</Text></Pressable>
          </View>
        </View>
      ))}
    </Screen>
  );
}
