import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function RootLayout() {
  const { refreshToken } = useAuthStore();

  useEffect(() => {
    // Refresh JWT on startup to get latest merchantId from DB
    refreshToken();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/onboarding" />
    </Stack>
  );
}
