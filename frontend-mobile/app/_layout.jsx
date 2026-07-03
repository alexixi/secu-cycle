import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import '../services/backgroundLocation';
import { stopNavigationNotification } from '../services/navigationNotification';
import { initAnalytics, trackScreen } from '../services/analytics';

initAnalytics();

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    stopNavigationNotification();
  }, []);

  useEffect(() => {
    trackScreen(pathname);
  }, [pathname]);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>

      </Stack>
    </AuthProvider>
  );
}
