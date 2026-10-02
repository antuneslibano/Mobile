import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { CustomerForm } from '@/components/CustomerForm';
import { Button, Card, colors, EmptyState, styles } from '@/components/ui';
import { formatCurrency, formatDate, formatDebtAge, formatPhone, formatTime } from '@/lib/format';
import { balanceOf, daysSince, debtSince, entriesFor } from '@/lib/ledger';
import { useStore } from '@/state/store';

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customers, entries, updateCustomer, deleteCustomer, deleteEntry } = useStore();
  const [editing, setEditing] = useState(false);
  const customer = customers.find((c) => c.id === id);

  const own = useMemo(() => (customer ? entriesFor(entries, customer.id) : []), [entries, customer]);
  // Extrato do mais recente para o mais antigo, com o saldo após cada lançamento.
  const statement = useMemo(() => {
    let running = 0;
    return own
      .map((entry) => {
        running += entry.type === 'compra' ? entry.amount : -entry.amount;
        return { entry, balanceAfter: Math.round(running * 100) / 100 };
      })
      .reverse();
  }, [own]);

  if (!customer) return <EmptyState title="Cliente não encontrado" description="Ele pode ter sido excluído." />;

  const balance = balanceOf(own);
  const since = debtSince(own);
  const overLimit = customer.creditLimit > 0 && balance > customer.creditLimit;

  if (editing) {
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack.Screen options={{ title: 'Editar cliente' }} />
        <ScrollView keyboardShouldPersistTaps="handled">
          <CustomerForm
            initial={customer}
            submitLabel="Salvar alterações"
            onSubmit={(input) => {
              updateCustomer(customer.id, input);
              setEditing(false);
            }}
          />
          <View style={[styles.content, { paddingTop: 0 }]}>
            <Button
              title="Excluir cliente"
              variant="danger"
              onPress={() =>
                Alert.alert('Excluir cliente?', 'Todo o histórico de compras e pagamentos dele será apagado.', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => {
                      deleteCustomer(customer.id);
                      router.back();
                    },
                  },
                ])
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const go = (type: 'compra' | 'pagamento') =>
    router.push({ pathname: '/lancar', params: { customerId: customer.id, type } });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: customer.name,
          headerRight: () => (
            <Text style={{ color: colors.primary, fontSize: 16, padding: 4 }} onPress={() => setEditing(true)}>
              Editar
            </Text>
          ),
        }}
      />

      <Card style={{ alignItems: 'center' }}>
        <Text style={styles.muted}>{balance < 0 ? 'Crédito do cliente' : 'Saldo devedor'}</Text>
        <Text style={{ fontSize: 36, fontWeight: '800', color: balance > 0 ? colors.danger : colors.success }}>
          {formatCurrency(Math.abs(balance))}
        </Text>
        {since && balance > 0 ? <Text style={styles.muted}>{formatDebtAge(daysSince(since))}</Text> : null}
        {customer.creditLimit > 0 ? (
          <Text style={[styles.muted, overLimit && { color: colors.danger, fontWeight: '700' }]}>
            Limite: {formatCurrency(customer.creditLimit)}
            {overLimit ? ' (ultrapassado)' : ''}
          </Text>
        ) : null}
        {customer.phone ? <Text style={styles.muted}>{formatPhone(customer.phone)}</Text> : null}
        {customer.notes ? <Text style={styles.muted}>{customer.notes}</Text> : null}
      </Card>

      <View style={styles.row}>
        <Button title="+ Compra" style={{ flex: 1 }} onPress={() => go('compra')} />
        <Button title="Recebi" variant="secondary" style={{ flex: 1 }} onPress={() => go('pagamento')} />
      </View>
      {balance > 0 ? (
        <Button
          title="Cobrar com Pix"
          variant="whatsapp"
          onPress={() => router.push({ pathname: '/cobrar', params: { customerId: customer.id } })}
        />
      ) : null}

      <Card>
        <Text style={styles.subtitle}>Extrato</Text>
        {statement.length === 0 ? <Text style={styles.muted}>Nenhum lançamento ainda.</Text> : null}
        {statement.map(({ entry, balanceAfter }) => {
          const date = new Date(entry.createdAt);
          const isPurchase = entry.type === 'compra';
          return (
            <Pressable
              key={entry.id}
              onLongPress={() =>
                Alert.alert(
                  'Apagar lançamento?',
                  `${isPurchase ? 'Compra' : 'Pagamento'} de ${formatCurrency(entry.amount)} em ${formatDate(date)}`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Apagar', style: 'destructive', onPress: () => deleteEntry(entry.id) },
                  ],
                )
              }
              style={{ flexDirection: 'row', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>{entry.description || (isPurchase ? 'Compra' : 'Pagamento')}</Text>
                <Text style={styles.muted}>
                  {formatDate(date)} às {formatTime(date)} · saldo {formatCurrency(balanceAfter)}
                </Text>
              </View>
              <Text style={{ fontWeight: '700', color: isPurchase ? colors.danger : colors.success }}>
                {isPurchase ? '+' : '−'} {formatCurrency(entry.amount)}
              </Text>
            </Pressable>
          );
        })}
        {statement.length > 0 ? <Text style={styles.hint}>Segure um lançamento para apagá-lo.</Text> : null}
      </Card>
    </ScrollView>
  );
}
