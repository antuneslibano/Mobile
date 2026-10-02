import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, ScrollView, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button, Card, EmptyState, styles } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { balanceOf, entriesFor } from '@/lib/ledger';
import { chargeMessage, pixFor } from '@/lib/messages';
import { whatsappUrl } from '@/lib/whatsapp';
import { useStore } from '@/state/store';

export default function Charge() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { customers, entries, settings } = useStore();
  const [copied, setCopied] = useState(false);
  const customer = customers.find((c) => c.id === customerId);

  if (!customer) return <EmptyState title="Cliente não encontrado" description="" />;

  const own = entriesFor(entries, customer.id);
  const balance = balanceOf(own);
  const pix = pixFor(settings, balance, customer);
  const message = chargeMessage(settings, customer, own);

  async function send() {
    if (customer!.phone) {
      try {
        await Linking.openURL(whatsappUrl(customer!.phone, message));
        return;
      } catch {
        // Sem WhatsApp: cai no compartilhamento padrão.
      }
    }
    await Share.share({ message });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ alignItems: 'center' }}>
        <Text style={styles.subtitle}>{customer.name}</Text>
        <Text style={[styles.title, { fontSize: 32 }]}>{formatCurrency(balance)}</Text>
        {pix ? (
          <>
            <Text style={styles.muted}>Mostre para o cliente pagar agora pelo app do banco</Text>
            <View style={{ padding: 12, backgroundColor: '#fff' }}>
              <QRCode value={pix} size={220} />
            </View>
          </>
        ) : (
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            Cadastre sua chave Pix em Ajustes para gerar o QR Code no valor da conta.
          </Text>
        )}
      </Card>

      <Button title={customer.phone ? 'Enviar extrato no WhatsApp' : 'Compartilhar extrato'} variant="whatsapp" onPress={send} />
      {pix ? (
        <Button
          title={copied ? 'Copiado ✓' : 'Copiar Pix copia e cola'}
          variant="secondary"
          onPress={async () => {
            await Clipboard.setStringAsync(pix);
            setCopied(true);
          }}
        />
      ) : (
        <Button title="Configurar Pix" variant="secondary" onPress={() => router.push('/ajustes')} />
      )}
      <Button
        title="Cliente pagou"
        onPress={() => {
          router.back();
          router.push({ pathname: '/lancar', params: { customerId: customer.id, type: 'pagamento' } });
        }}
      />
      <Text style={[styles.hint, { textAlign: 'center' }]}>
        O Pix cai direto na sua conta. Depois de conferir no banco, toque em "Cliente pagou".
      </Text>
      {!customer.phone ? null : (
        <Text style={[styles.hint, { textAlign: 'center' }]} onPress={() => Alert.alert('Prévia da mensagem', message)}>
          Ver prévia da mensagem
        </Text>
      )}
    </ScrollView>
  );
}
