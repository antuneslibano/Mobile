import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { Button, Card, colors, EmptyState, styles } from '@/components/ui';
import { openMonthsForClient } from '@/lib/billing';
import { formatCurrency, formatPhone } from '@/lib/format';
import { useStore } from '@/state/store';

export default function Clients() {
  const { clients, payments } = useStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return clients
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (digits !== '' && c.phone.includes(digits)))
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'pt-BR'));
  }, [clients, query]);

  return (
    <View style={styles.screen}>
      <View style={{ padding: 16, paddingBottom: 0, gap: 12 }}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por nome ou telefone"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
        <Button title="+ Novo cliente" onPress={() => router.push('/cliente/novo')} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <EmptyState
            title={clients.length ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            description={clients.length ? 'Tente outro termo de busca.' : 'Toque em "Novo cliente" para começar.'}
          />
        }
        renderItem={({ item }) => {
          const open = item.active ? openMonthsForClient(item, payments).length : 0;
          return (
            <Pressable onPress={() => router.push(`/cliente/${item.id}`)}>
              <Card style={!item.active && { opacity: 0.5 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.subtitle}>{item.name}</Text>
                    <Text style={styles.muted}>
                      {formatPhone(item.phone)} · {formatCurrency(item.amount)} · dia {item.dueDay}
                    </Text>
                  </View>
                  {!item.active ? (
                    <Text style={styles.muted}>Inativo</Text>
                  ) : open > 0 ? (
                    <Text style={{ color: colors.danger, fontWeight: '700' }}>
                      {open} em aberto
                    </Text>
                  ) : (
                    <Text style={{ color: colors.success, fontWeight: '700' }}>Em dia</Text>
                  )}
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
