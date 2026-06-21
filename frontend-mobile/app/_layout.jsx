import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import '../services/backgroundLocation';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>

      </Stack>
    </AuthProvider>
  );
}
