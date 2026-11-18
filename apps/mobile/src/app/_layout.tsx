import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sileo-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { PilotStateProvider } from '@/hooks/use-pilot-state';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthenticatedShell() {
  const { session, isHydrating } = useAuth();

  if (isHydrating) {
    return null;
  }

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="login" />
        ) : (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="calendar"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="compare"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="passport"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="scale-honesty"
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack>
      <Toaster position="top-center" theme="system" />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo bundles font assets from static requires.
    'OliveDisplay-Bold': require('../../assets/fonts/OliveDisplay-Bold.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo bundles font assets from static requires.
    'OliveDisplay-Medium': require('../../assets/fonts/OliveDisplay-Medium.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo bundles font assets from static requires.
    'SuncoastGrot-Medium': require('../../assets/fonts/SuncoastGrot-Medium.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo bundles font assets from static requires.
    'SuncoastGrot-Bold': require('../../assets/fonts/SuncoastGrot-Bold.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo bundles font assets from static requires.
    'SuncoastGrot-Black': require('../../assets/fonts/SuncoastGrot-Black.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <PilotStateProvider>
            <AuthenticatedShell />
          </PilotStateProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
