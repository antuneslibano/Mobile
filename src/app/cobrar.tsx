import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, ScrollView, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button, Card, EmptyState, styles } from '@/components/ui';
import { formatCurrency, formatMonth } from '@/lib/format';
import { pixForCharge, reminderMessage, reminderUrl } from '@/lib/reminder';
import { useStore } from '@/state/store';

export default function Charge() {
  const { clientId, month } = useLocalSearchParams<{ clientId: string; month: string }>();
  const { clients, settings, markPaid } = useStore();
  const [copied, setCopied] = useState(false);
  const client = clients.find((c) => c.id === clientId);

  if (!client || !month) return <EmptyState title="Cobrança não encontrada" description="" />;

  const pix = pixForCharge(settings, client, month);

  async function sendWhatsapp() {
    try {
      await Linking.openURL(reminderUrl(settings, client!, month));
    } catch {
      // Sem WhatsApp instalado: oferece o compartilhamento padrão do sistema.
      await Share.share({ message: reminderMessage(settings, client!, month) });
    }
  }

  async function copyPix() {
    if (!pix) return;
    await Clipboard.setStringAsync(pix);
    setCopied(true);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ alignItems: 'center' }}>
        <Text style={styles.subtitle}>{client.name}</Text>
        <Text style={[styles.muted, { textTransform: 'capitalize' }]}>{formatMonth(month)}</Text>
        <Text style={[styles.title, { fontSize: 28 }]}>{formatCurrency(client.amount)}</Text>
        {pix ? (
          <View style={{ padding: 12, backgroundColor: '#fff' }}>
            <QRCode value={pix} size={220} />
          </View>
        ) : (
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            Cadastre sua chave Pix em Ajustes para gerar o QR Code e o copia e cola.
          </Text>
        )}
      </Card>

      <Button title="Enviar cobrança no WhatsApp" variant="whatsapp" onPress={sendWhatsapp} />
      {pix ? (
        <Button title={copied ? 'Copiado ✓' : 'Copiar Pix copia e cola'} variant="secondary" onPress={copyPix} />
      ) : (
        <Button title="Configurar Pix" variant="secondary" onPress={() => router.push('/ajustes')} />
      )}
      <Button
        title="Marcar como pago"
        onPress={() => {
          markPaid(client, month);
          Alert.alert('Pagamento registrado', `${client.name} · ${formatMonth(month)}`);
          router.back();
        }}
      />
    </ScrollView>
  );
}
