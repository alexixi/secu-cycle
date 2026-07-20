import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, usePathname } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ANDROID_REVEAL, androidOpaque } from '../constants/navigation';
import { useTheme } from '../hooks/useTheme';
import '../services/backgroundLocation';
import { stopNavigationNotification } from '../services/navigationNotification';
import { initAnalytics, trackScreen } from '../services/analytics';

initAnalytics();

const ANDROID_OPAQUE_ROUTES = ['(tabs)', 'login', '_sitemap', '+not-found'];

function RootNavigator() {
  const pathname = usePathname();
  const { colors } = useTheme();

  useEffect(() => {
    stopNavigationNotification();
  }, []);

  useEffect(() => {
    trackScreen(pathname);
  }, [pathname]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        fullScreenGestureEnabled: true,
        ...(Platform.OS === 'android' ? ANDROID_REVEAL : {}),
      }}
    >
      {Platform.OS === 'android' &&
        ANDROID_OPAQUE_ROUTES.map((name) => (
          <Stack.Screen key={name} name={name} options={androidOpaque(colors.bgMain)} />
        ))}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
