import { useState } from 'react';
import { Alert, View } from 'react-native';

import { formatCurrency, parseCurrency } from '@/lib/format';
import type { CustomerInput } from '@/state/store';

import { Button, Field, styles } from './ui';

export function CustomerForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: CustomerInput;
  submitLabel: string;
  onSubmit: (input: CustomerInput) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [limit, setLimit] = useState(initial?.creditLimit ? initial.creditLimit.toFixed(2).replace('.', ',') : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  function submit() {
    const phoneDigits = phone.replace(/\D/g, '');
    if (!name.trim()) return Alert.alert('Falta o nome', 'Informe o nome do cliente.');
    if (phoneDigits.length > 0 && phoneDigits.length < 10)
      return Alert.alert('WhatsApp inválido', 'Informe o celular com DDD ou deixe em branco.');
    onSubmit({ name: name.trim(), phone: phoneDigits, creditLimit: parseCurrency(limit), notes: notes.trim() });
  }

  const parsedLimit = parseCurrency(limit);

  return (
    <View style={styles.content}>
      <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Dona Maria (rua 3)" autoFocus={!initial} />
      <Field
        label="WhatsApp (com DDD)"
        value={phone}
        onChangeText={setPhone}
        placeholder="(11) 98765-4321"
        keyboardType="phone-pad"
        hint="É para onde vão os comprovantes de cada compra."
      />
      <Field
        label="Limite de fiado (opcional)"
        value={limit}
        onChangeText={setLimit}
        placeholder="Sem limite"
        keyboardType="decimal-pad"
        hint={parsedLimit > 0 ? `Avisa quando a conta passar de ${formatCurrency(parsedLimit)}.` : undefined}
      />
      <Field label="Observações (opcional)" value={notes} onChangeText={setNotes} placeholder="Endereço, apelido..." multiline />
      <Button title={submitLabel} onPress={submit} />
    </View>
  );
}
