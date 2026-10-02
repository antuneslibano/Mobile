import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button, Card, Chip, Field, styles } from '@/components/ui';
import { validatePixKey, type PixKeyType } from '@/lib/pix';
import { DEFAULT_REMINDER_TEMPLATE, type Settings } from '@/lib/types';
import { useStore } from '@/state/store';

const KEY_TYPES: { type: PixKeyType; label: string; placeholder: string }[] = [
  { type: 'cpf_cnpj', label: 'CPF/CNPJ', placeholder: '000.000.000-00' },
  { type: 'telefone', label: 'Celular', placeholder: '(11) 98765-4321' },
  { type: 'email', label: 'E-mail', placeholder: 'voce@email.com' },
  { type: 'aleatoria', label: 'Aleatória', placeholder: '123e4567-e89b-...' },
];

export default function SettingsScreen() {
  const store = useStore();
  const [form, setForm] = useState<Settings>(store.settings);

  // Os dados carregam de forma assíncrona; sincroniza o formulário quando chegam.
  useEffect(() => setForm(store.settings), [store.settings]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setForm((f) => ({ ...f, [key]: value }));

  function save() {
    if (form.pixKey.trim()) {
      const error = validatePixKey(form.pixKey, form.pixKeyType);
      if (error) return Alert.alert('Chave Pix inválida', error);
      if (!form.merchantCity.trim()) return Alert.alert('Falta a cidade', 'O Pix exige a cidade do recebedor.');
    }
    store.saveSettings({ ...form, pixKey: form.pixKey.trim() });
    Alert.alert('Pronto!', 'Configurações salvas.');
  }

  const keyType = KEY_TYPES.find((k) => k.type === form.pixKeyType) ?? KEY_TYPES[0];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.subtitle}>Seu negócio</Text>
          <Field
            label="Nome do negócio"
            value={form.businessName}
            onChangeText={(v) => set('businessName', v)}
            placeholder="Ex.: Escolinha Bola de Ouro"
          />
        </Card>

        <Card>
          <Text style={styles.subtitle}>Recebimento via Pix</Text>
          <Text style={styles.muted}>O dinheiro cai direto na sua conta. O Cobrei não cobra taxa por Pix.</Text>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {KEY_TYPES.map((k) => (
              <Chip
                key={k.type}
                label={k.label}
                selected={form.pixKeyType === k.type}
                onPress={() => set('pixKeyType', k.type)}
              />
            ))}
          </View>
          <Field
            label="Chave Pix"
            value={form.pixKey}
            onChangeText={(v) => set('pixKey', v)}
            placeholder={keyType.placeholder}
            autoCapitalize="none"
            keyboardType={form.pixKeyType === 'email' ? 'email-address' : 'default'}
          />
          <Field
            label="Nome do recebedor"
            value={form.merchantName}
            onChangeText={(v) => set('merchantName', v)}
            placeholder="Como aparece no banco"
            hint="Até 25 letras. Se ficar vazio, usamos o nome do negócio."
          />
          <Field
            label="Cidade"
            value={form.merchantCity}
            onChangeText={(v) => set('merchantCity', v)}
            placeholder="Ex.: São Paulo"
          />
        </Card>

        <Card>
          <Text style={styles.subtitle}>Mensagem de cobrança</Text>
          <Text style={styles.muted}>
            Variáveis: {'{nome}'} {'{mes}'} {'{valor}'} {'{vencimento}'} {'{pix}'} {'{empresa}'}
          </Text>
          <Field
            label="Modelo"
            value={form.reminderTemplate}
            onChangeText={(v) => set('reminderTemplate', v)}
            multiline
            style={{ minHeight: 140, textAlignVertical: 'top' }}
          />
          <Button
            title="Restaurar mensagem padrão"
            variant="secondary"
            onPress={() => set('reminderTemplate', DEFAULT_REMINDER_TEMPLATE)}
          />
        </Card>

        <Button title="Salvar" onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
