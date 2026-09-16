import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';
import { Text, View } from 'react-native';
import { useAppStore } from '../store/appStore';
import { BackNavigationProvider, useBackNavigation } from './backNavigation';
import { useEffect } from 'react';

function BackNavigationFeedback() {
  const { toastMessage } = useBackNavigation();

  if (!toastMessage) return null;

  return (
    <View pointerEvents="none" style={styles.toastContainer}>
      <View style={styles.toast}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const hydrateSession = useAppStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  return (
    <BackNavigationProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown:false, contentStyle:{ backgroundColor:colors.paper } }} />
      <BackNavigationFeedback />
    </BackNavigationProvider>
  );
}

const styles = {
  toastContainer: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 88,
    alignItems: 'center' as const,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: '#222',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxWidth: '88%' as const,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
};
