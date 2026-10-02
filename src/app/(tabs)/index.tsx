import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { Button, Card, colors, EmptyState, styles } from '@/components/ui';
import { UpdateBanner } from '@/components/UpdateBanner';
import { formatCurrency, formatDebtAge } from '@/lib/format';
import { customerStatuses, daysSince, overview, type CustomerStatus } from '@/lib/ledger';
import { useStore } from '@/state/store';

function debtColor(days: number): string {
  if (days > 30) return colors.danger;
  if (days > 15) return colors.warning;
  return colors.text;
}

function CustomerRow({ status }: { status: CustomerStatus }) {
  const { customer, balance, since } = status;
  const days = since ? daysSince(since) : 0;
  return (
    <Pressable onPress={() => router.push(`/cliente/${customer.id}`)}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.subtitle}>{customer.name}</Text>
          {balance > 0 && since ? (
            <Text style={[styles.muted, { color: debtColor(days) }]}>{formatDebtAge(days)}</Text>
          ) : (
            <Text style={[styles.muted, { color: colors.success }]}>
              {balance < 0 ? `Crédito de ${formatCurrency(-balance)}` : 'Em dia'}
            </Text>
          )}
        </View>
        {balance > 0 ? (
          <Text style={{ fontSize: 16, fontWeight: '700', color: debtColor(days) }}>{formatCurrency(balance)}</Text>
        ) : null}
        <Pressable
          accessibilityLabel={`Anotar compra de ${customer.name}`}
          hitSlop={8}
          onPress={() => router.push({ pathname: '/lancar', params: { customerId: customer.id, type: 'compra' } })}
          style={({ pressed }) => [
            {
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Text style={{ color: colors.primaryText, fontSize: 22, fontWeight: '700', marginTop: -2 }}>+</Text>
        </Pressable>
      </Card>
    </Pressable>
  );
}

export default function Notebook() {
  const { customers, entries, ready } = useStore();
  const [query, setQuery] = useState('');

  const statuses = useMemo(() => customerStatuses(customers, entries), [customers, entries]);
  const summary = useMemo(() => overview(customers, entries), [customers, entries]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return statuses;
    const digits = q.replace(/\D/g, '');
    return statuses.filter(
      (s) => s.customer.name.toLowerCase().includes(q) || (digits !== '' && s.customer.phone.includes(digits)),
    );
  }, [statuses, query]);

  if (!ready) return <View style={styles.screen} />;

  const header = (
    <View style={{ gap: 12 }}>
      <UpdateBanner />
      <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
        <Text style={{ color: colors.primaryText, opacity: 0.85 }}>Dinheiro na rua</Text>
        <Text style={{ color: colors.primaryText, fontSize: 32, fontWeight: '800' }}>
          {formatCurrency(summary.outstanding)}
        </Text>
        <Text style={{ color: colors.primaryText, opacity: 0.85 }}>
          {summary.debtors === 0
            ? 'Ninguém devendo'
            : summary.debtors === 1
              ? '1 cliente devendo'
              : `${summary.debtors} clientes devendo`}
        </Text>
      </Card>
      <View style={styles.row}>
        <Card style={{ flex: 1, padding: 12, gap: 2 }}>
          <Text style={styles.muted}>Fiado no mês</Text>
          <Text style={[styles.subtitle, { color: colors.warning }]}>{formatCurrency(summary.soldThisMonth)}</Text>
        </Card>
        <Card style={{ flex: 1, padding: 12, gap: 2 }}>
          <Text style={styles.muted}>Recebido no mês</Text>
          <Text style={[styles.subtitle, { color: colors.success }]}>{formatCurrency(summary.receivedThisMonth)}</Text>
        </Card>
      </View>
      {customers.length > 0 ? (
        <TextInput
          style={styles.input}
          placeholder="Buscar cliente"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
      ) : null}
      <Button title="+ Novo cliente" variant={customers.length ? 'secondary' : 'primary'} onPress={() => router.push('/cliente/novo')} />
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(s) => s.customer.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={
        customers.length ? (
          <EmptyState title="Nenhum cliente encontrado" description="Tente outro nome." />
        ) : (
          <EmptyState
            title="Seu caderno de fiado, sem papel"
            description="Cadastre quem compra fiado. Cada compra anotada vai na hora para o WhatsApp do cliente, com o saldo atualizado."
          />
        )
      }
      renderItem={({ item }) => <CustomerRow status={item} />}
    />
  );
}
