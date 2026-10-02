import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { Charge } from '@/lib/billing';
import { formatCurrency, formatDate } from '@/lib/format';
import { useStore } from '@/state/store';

import { Button, Card, StatusBadge, styles } from './ui';

export function ChargeRow({ charge }: { charge: Charge }) {
  const { markPaid } = useStore();
  const { client, month, status } = charge;

  return (
    <Card>
      <Pressable onPress={() => router.push(`/cliente/${client.id}`)} style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.subtitle}>{client.name}</Text>
          <Text style={styles.muted}>
            {formatCurrency(client.amount)} · vence {formatDate(charge.dueDate)}
          </Text>
        </View>
        <StatusBadge status={status} />
      </Pressable>
      {status !== 'pago' ? (
        <View style={styles.row}>
          <Button
            title="Cobrar"
            variant="whatsapp"
            style={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/cobrar', params: { clientId: client.id, month } })}
          />
          <Button title="Recebi" variant="secondary" style={{ flex: 1 }} onPress={() => markPaid(client, month)} />
        </View>
      ) : null}
    </Card>
  );
}
