import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { ClientForm } from '@/components/ClientForm';
import { Button, Card, colors, EmptyState, styles } from '@/components/ui';
import { dueDateFor, openMonthsForClient } from '@/lib/billing';
import { formatCurrency, formatDate, formatMonth, formatPhone } from '@/lib/format';
import { useStore } from '@/state/store';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients, payments, updateClient, deleteClient, markPaid, undoPayment } = useStore();
  const [editing, setEditing] = useState(false);
  const client = clients.find((c) => c.id === id);

  if (!client) return <EmptyState title="Cliente não encontrado" description="Ele pode ter sido excluído." />;

  const openMonths = client.active ? openMonthsForClient(client, payments) : [];
  const history = payments
    .filter((p) => p.clientId === client.id)
    .sort((a, b) => b.month.localeCompare(a.month));

  if (editing) {
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack.Screen options={{ title: 'Editar cliente' }} />
        <ScrollView keyboardShouldPersistTaps="handled">
          <ClientForm
            initial={client}
            submitLabel="Salvar alterações"
            onSubmit={(input) => {
              updateClient(client.id, input);
              setEditing(false);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function confirmDelete() {
    Alert.alert('Excluir cliente?', 'O histórico de pagamentos também será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteClient(client!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: client.name }} />
      <Card>
        <Text style={styles.title}>{client.name}</Text>
        <Text style={styles.text}>{formatPhone(client.phone)}</Text>
        <Text style={styles.text}>
          {formatCurrency(client.amount)} por mês · vence dia {client.dueDay}
        </Text>
        {client.notes ? <Text style={styles.muted}>{client.notes}</Text> : null}
        {!client.active ? <Text style={{ color: colors.danger }}>Cliente inativo: não gera cobranças.</Text> : null}
        <Button title="Editar" variant="secondary" onPress={() => setEditing(true)} />
      </Card>

      {client.active ? (
        <Card>
          <Text style={styles.subtitle}>Em aberto</Text>
          {openMonths.length === 0 ? (
            <Text style={{ color: colors.success }}>Tudo em dia 🎉</Text>
          ) : (
            <>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>
                Total: {formatCurrency(openMonths.length * client.amount)}
              </Text>
              {openMonths.map((month) => (
                <View key={month} style={{ gap: 8, paddingVertical: 6 }}>
                  <Text style={[styles.text, { textTransform: 'capitalize' }]}>
                    {formatMonth(month)} · vence {formatDate(dueDateFor(month, client.dueDay))}
                  </Text>
                  <View style={styles.row}>
                    <Button
                      title="Cobrar"
                      variant="whatsapp"
                      style={{ flex: 1 }}
                      onPress={() => router.push({ pathname: '/cobrar', params: { clientId: client.id, month } })}
                    />
                    <Button
                      title="Recebi"
                      variant="secondary"
                      style={{ flex: 1 }}
                      onPress={() => markPaid(client, month)}
                    />
                  </View>
                </View>
              ))}
            </>
          )}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.subtitle}>Pagamentos</Text>
        {history.length === 0 ? <Text style={styles.muted}>Nenhum pagamento registrado.</Text> : null}
        {history.map((p) => (
          <View key={p.id} style={[styles.row, { justifyContent: 'space-between', paddingVertical: 4 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { textTransform: 'capitalize' }]}>{formatMonth(p.month)}</Text>
              <Text style={styles.muted}>
                {formatCurrency(p.amount)} · recebido em {formatDate(new Date(p.paidAt))}
              </Text>
            </View>
            <Text
              style={{ color: colors.danger, padding: 8 }}
              onPress={() =>
                Alert.alert('Desfazer pagamento?', formatMonth(p.month), [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Desfazer', style: 'destructive', onPress: () => undoPayment(p.id) },
                ])
              }>
              Desfazer
            </Text>
          </View>
        ))}
      </Card>

      <Button
        title={client.active ? 'Desativar cliente' : 'Reativar cliente'}
        variant="secondary"
        onPress={() => updateClient(client.id, { active: !client.active })}
      />
      <Button title="Excluir cliente" variant="danger" onPress={confirmDelete} />
    </ScrollView>
  );
}
