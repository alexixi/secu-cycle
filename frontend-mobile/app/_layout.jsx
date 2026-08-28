import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import '../i18n';
import { AuthProvider } from '../context/AuthContext';
import { LocaleProvider } from '../context/LocaleContext';
import { ThemeProvider } from '../context/ThemeContext';
import { useLocale } from '../hooks/useLocale';
import { ANDROID_REVEAL, androidOpaque } from '../constants/navigation';
import { useTheme } from '../hooks/useTheme';
import '../services/backgroundLocation';
import { stopNavigationNotification } from '../services/navigationNotification';
import { ensureNotificationHandler } from '../services/weatherNotification';
import { initAnalytics, trackScreen } from '../services/analytics';

initAnalytics();

// Sans cela, le splash natif disparaît au premier frame : un utilisateur ayant
// choisi une langue différente de celle de son téléphone verrait l'écran
// clignoter de l'une à l'autre. En contrepartie, il FAUT le masquer
// explicitement — un chemin qui oublierait hideAsync laisserait l'application
// bloquée sur le splash (d'où le garde-fou temporisé dans LocaleProvider).
SplashScreen.preventAutoHideAsync().catch(() => { });

const ANDROID_OPAQUE_ROUTES = ['(tabs)', 'login', '_sitemap', '+not-found'];

function RootNavigator() {
  const pathname = usePathname();
  const { colors } = useTheme();

  useEffect(() => {
    stopNavigationNotification();
    ensureNotificationHandler();
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

// On rend toujours les enfants : c'est le splash qui masque l'écran, pas un
// rendu conditionnel. Les mettre derrière `ready` retarderait d'un tour la
// lecture du stockage par AuthProvider, sans rien gagner de visible.
function SplashGate({ children }) {
  const { ready } = useLocale();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => { });
  }, [ready]);

  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocaleProvider>
        <SplashGate>
          <ThemeProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </ThemeProvider>
        </SplashGate>
      </LocaleProvider>
    </GestureHandlerRootView>
  );
}
