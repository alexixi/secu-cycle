import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import '../services/backgroundLocation';
import { stopNavigationNotification } from '../services/navigationNotification';

export default function RootLayout() {
  useEffect(() => {
    stopNavigationNotification();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>

      </Stack>
    </AuthProvider>
  );
}
