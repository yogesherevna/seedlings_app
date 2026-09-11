import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export default function RootLayout() {
  const hydrateCart = useAppStore((state) => state.hydrateCart);

  useEffect(() => {
    hydrateCart();
  }, [hydrateCart]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown:false, contentStyle:{ backgroundColor:colors.paper } }} />
    </>
  );
}
