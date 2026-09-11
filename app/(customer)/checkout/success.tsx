import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '../../../components/UI';
import { colors } from '../../../constants/theme';

export default function Success() {
  return (
    <Screen scroll={false}>
      <View style={{ alignItems: 'center', paddingTop: 55 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: colors.greenDark, marginBottom: 18 }}>
          Seedlings
        </Text>
        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 38 }}>✓</Text>
        </View>
        <Text style={{ fontSize: 25, fontWeight: '900', color: colors.ink, marginTop: 16 }}>Order Placed!</Text>
        <Text style={{ color: colors.inkSoft, textAlign: 'center', marginTop: 6 }}>
          Your order #SM001234{`\n`}has been placed successfully.
        </Text>
        <View style={{ width: '100%', marginTop: 26 }}>
          <Button title="View Orders" onPress={() => router.replace('/(customer)/(tabs)/orders')} />
          <View style={{ height: 10 }} />
          <Button title="Continue Shopping" secondary onPress={() => router.replace('/(customer)/(tabs)/products')} />
        </View>
      </View>
    </Screen>
  );
}
