import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export default function RootLayout() {
  const hydrateSession = useAppStore((state) => state.hydrateSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateCart, hydrateSession]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown:false, contentStyle:{ backgroundColor:colors.paper } }} />
    </>
  );
}
