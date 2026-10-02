import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { ClientForm } from '@/components/ClientForm';
import { styles } from '@/components/ui';
import { useStore } from '@/state/store';

export default function NewClient() {
  const { addClient } = useStore();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <ClientForm
          submitLabel="Cadastrar"
          onSubmit={(input) => {
            addClient(input);
            router.back();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
