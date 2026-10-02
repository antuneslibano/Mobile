import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Linking, Platform, Text } from 'react-native';

import { checkForUpdate, type AvailableUpdate } from '@/lib/updates';

import { Button, Card, colors, styles } from './ui';

export function UpdateBanner() {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);

  useEffect(() => {
    const current = Constants.expoConfig?.version;
    // Atualização por APK só faz sentido no Android; em desenvolvimento não há versão publicada.
    if (Platform.OS !== 'android' || __DEV__ || !current) return;
    checkForUpdate(current)
      .then(setUpdate)
      .catch(() => {});
  }, []);

  if (!update) return null;

  return (
    <Card style={{ backgroundColor: colors.successBg, borderColor: colors.successBg }}>
      <Text style={styles.subtitle}>Nova versão disponível: {update.version}</Text>
      <Text style={styles.text}>Baixe e instale por cima. Seus dados continuam salvos.</Text>
      <Button title="Baixar atualização" onPress={() => Linking.openURL(update.downloadUrl)} />
    </Card>
  );
}
