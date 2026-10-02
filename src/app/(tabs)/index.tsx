import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ChargeRow } from '@/components/ChargeRow';
import { Button, Card, colors, EmptyState, styles } from '@/components/ui';
import { chargesForMonth, monthKey, shiftMonth, summarize } from '@/lib/billing';
import { formatCurrency, formatMonth } from '@/lib/format';
import { pixConfigured } from '@/lib/reminder';
import { useStore } from '@/state/store';

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card style={{ flex: 1, padding: 12, gap: 4 }}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color }}>{formatCurrency(value)}</Text>
    </Card>
  );
}

export default function Dashboard() {
  const { clients, payments, settings, ready } = useStore();
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const charges = useMemo(() => chargesForMonth(clients, payments, month), [clients, payments, month]);
  const summary = useMemo(() => summarize(charges), [charges]);
  const expected = summary.received + summary.pending + summary.overdue;
  const progress = expected > 0 ? summary.received / expected : 0;

  if (!ready) return <View style={styles.screen} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Pressable hitSlop={12} onPress={() => setMonth((m) => shiftMonth(m, -1))}>
          <Text style={{ fontSize: 24, color: colors.primary }}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { textTransform: 'capitalize' }]}>{formatMonth(month)}</Text>
        <Pressable hitSlop={12} onPress={() => setMonth((m) => shiftMonth(m, 1))}>
          <Text style={{ fontSize: 24, color: colors.primary }}>›</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Stat label="Recebido" value={summary.received} color={colors.success} />
        <Stat label="A vencer" value={summary.pending} color={colors.warning} />
        <Stat label="Atrasado" value={summary.overdue} color={colors.danger} />
      </View>

      {expected > 0 ? (
        <Card>
          <Text style={styles.muted}>
            {Math.round(progress * 100)}% recebido de {formatCurrency(expected)} · {summary.paidCount} de{' '}
            {charges.length} clientes
          </Text>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' }}>
            <View style={{ width: `${progress * 100}%`, height: 8, backgroundColor: colors.success }} />
          </View>
        </Card>
      ) : null}

      {!pixConfigured(settings) ? (
        <Card style={{ backgroundColor: colors.warningBg, borderColor: colors.warningBg }}>
          <Text style={styles.subtitle}>Configure sua chave Pix</Text>
          <Text style={styles.text}>
            Com a chave cadastrada, cada cobrança vai com o Pix copia e cola e o QR Code no valor certo.
          </Text>
          <Button title="Configurar agora" onPress={() => router.push('/ajustes')} />
        </Card>
      ) : null}

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            title="Comece cadastrando seus clientes"
            description="Informe o valor e o dia do vencimento. O Cobrei avisa quem está devendo e manda a cobrança pelo WhatsApp."
          />
          <Button title="Cadastrar primeiro cliente" onPress={() => router.push('/cliente/novo')} />
        </Card>
      ) : charges.length === 0 ? (
        <EmptyState title="Nenhuma cobrança neste mês" description="Não há clientes ativos para este período." />
      ) : (
        charges.map((charge) => <ChargeRow key={charge.client.id} charge={charge} />)
      )}
    </ScrollView>
  );
}
