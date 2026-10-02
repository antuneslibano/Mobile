import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip, colors, EmptyState, Field, styles } from '@/components/ui';
import { formatCurrency, parseCurrency } from '@/lib/format';
import { balanceOf, checkLimit, entriesFor } from '@/lib/ledger';
import { receiptMessage } from '@/lib/messages';
import type { EntryType } from '@/lib/types';
import { whatsappUrl } from '@/lib/whatsapp';
import { useStore } from '@/state/store';

export default function NewEntry() {
  const params = useLocalSearchParams<{ customerId: string; type: EntryType }>();
  const { customers, entries, settings, addEntry } = useStore();
  const customer = customers.find((c) => c.id === params.customerId);
  const type: EntryType = params.type === 'pagamento' ? 'pagamento' : 'compra';
  const isPurchase = type === 'compra';

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  // null = padrão (ligado se o cliente tem WhatsApp), mesmo que os dados carreguem depois da tela.
  const [receiptChoice, setReceiptChoice] = useState<boolean | null>(null);

  if (!customer) return <EmptyState title="Cliente não encontrado" description="" />;

  const sendReceipt = receiptChoice ?? Boolean(customer.phone);
  const balance = balanceOf(entriesFor(entries, customer.id));
  const value = parseCurrency(amount);

  function save() {
    if (value <= 0) return Alert.alert('Valor inválido', 'Digite o valor.');
    if (isPurchase) {
      const limit = checkLimit(customer!, balance, value);
      if (limit.exceeds) {
        return Alert.alert(
          'Limite ultrapassado',
          `Com esta compra, ${customer!.name} vai dever ${formatCurrency(limit.newBalance)}, acima do limite de ${formatCurrency(customer!.creditLimit)}.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Anotar mesmo assim', onPress: commit },
          ],
        );
      }
    }
    commit();
  }

  function commit() {
    const entry = addEntry({ customerId: customer!.id, type, amount: value, description: description.trim() });
    const newBalance = Math.round((balance + (isPurchase ? value : -value)) * 100) / 100;
    router.back();
    if (sendReceipt && customer!.phone) {
      Linking.openURL(whatsappUrl(customer!.phone, receiptMessage(settings, customer!, entry, newBalance))).catch(() =>
        Alert.alert('WhatsApp não encontrado', 'O lançamento foi salvo, mas não deu para abrir o WhatsApp.'),
      );
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: isPurchase ? 'Anotar compra' : 'Receber pagamento' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>{customer.name}</Text>
        <Text style={styles.muted}>Saldo atual: {formatCurrency(balance)}</Text>

        <Card style={{ alignItems: 'center' }}>
          <Text style={styles.label}>{isPurchase ? 'Valor da compra' : 'Valor recebido'}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0,00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            autoFocus
            style={{
              fontSize: 40,
              fontWeight: '800',
              color: isPurchase ? colors.danger : colors.success,
              textAlign: 'center',
              minWidth: 200,
              paddingVertical: 4,
            }}
          />
          {value > 0 ? (
            <Text style={styles.muted}>
              Novo saldo: {formatCurrency(Math.round((balance + (isPurchase ? value : -value)) * 100) / 100)}
            </Text>
          ) : null}
        </Card>

        {!isPurchase && balance > 0 ? (
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            <Chip
              label={`Tudo (${formatCurrency(balance)})`}
              selected={value === balance}
              onPress={() => setAmount(balance.toFixed(2).replace('.', ','))}
            />
          </View>
        ) : null}

        <Field
          label={isPurchase ? 'O que levou (opcional)' : 'Observação (opcional)'}
          value={description}
          onChangeText={setDescription}
          placeholder={isPurchase ? 'Ex.: pão, leite, café' : 'Ex.: Pix, dinheiro'}
        />

        {customer.phone ? (
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>Enviar comprovante no WhatsApp</Text>
              <Text style={styles.muted}>O cliente recebe o valor e o saldo atualizado.</Text>
            </View>
            <Switch
              value={sendReceipt}
              onValueChange={setReceiptChoice}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        ) : (
          <Text style={styles.muted}>Cadastre o WhatsApp do cliente para enviar comprovantes.</Text>
        )}

        <Button
          title={isPurchase ? 'Anotar compra' : 'Registrar pagamento'}
          variant={isPurchase ? 'primary' : 'whatsapp'}
          onPress={save}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
