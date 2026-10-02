import { useState } from 'react';
import { Alert, View } from 'react-native';

import { formatCurrency, parseCurrency } from '@/lib/format';
import type { ClientInput } from '@/state/store';

import { Button, Field, styles } from './ui';

export function ClientForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: ClientInput;
  submitLabel: string;
  onSubmit: (input: ClientInput) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [amount, setAmount] = useState(initial ? initial.amount.toFixed(2).replace('.', ',') : '');
  const [dueDay, setDueDay] = useState(initial ? String(initial.dueDay) : '10');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  function submit() {
    const value = parseCurrency(amount);
    const day = Number(dueDay);
    const phoneDigits = phone.replace(/\D/g, '');
    if (!name.trim()) return Alert.alert('Falta o nome', 'Informe o nome do cliente.');
    if (phoneDigits.length < 10) return Alert.alert('WhatsApp inválido', 'Informe o celular com DDD.');
    if (value <= 0) return Alert.alert('Valor inválido', 'Informe o valor da mensalidade.');
    if (!Number.isInteger(day) || day < 1 || day > 31)
      return Alert.alert('Dia inválido', 'O vencimento deve ser um dia entre 1 e 31.');
    onSubmit({ name: name.trim(), phone: phoneDigits, amount: value, dueDay: day, notes: notes.trim() });
  }

  const parsed = parseCurrency(amount);

  return (
    <View style={styles.content}>
      <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Maria Souza" autoFocus={!initial} />
      <Field
        label="WhatsApp (com DDD)"
        value={phone}
        onChangeText={setPhone}
        placeholder="(11) 98765-4321"
        keyboardType="phone-pad"
      />
      <Field
        label="Valor da mensalidade"
        value={amount}
        onChangeText={setAmount}
        placeholder="150,00"
        keyboardType="decimal-pad"
        hint={parsed > 0 ? formatCurrency(parsed) : undefined}
      />
      <Field
        label="Dia do vencimento"
        value={dueDay}
        onChangeText={setDueDay}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Field
        label="Observações (opcional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Turma, plano, responsável..."
        multiline
      />
      <Button title={submitLabel} onPress={submit} />
    </View>
  );
}
