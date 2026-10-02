import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/components/ui';
import { StoreProvider } from '@/state/store';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: 'Voltar',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cliente/novo" options={{ title: 'Novo cliente', presentation: 'modal' }} />
        <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
        <Stack.Screen name="cobrar" options={{ title: 'Cobrar', presentation: 'modal' }} />
      </Stack>
    </StoreProvider>
  );
}
