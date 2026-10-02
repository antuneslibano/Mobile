import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { CustomerForm } from '@/components/CustomerForm';
import { styles } from '@/components/ui';
import { useStore } from '@/state/store';

export default function NewCustomer() {
  const { addCustomer } = useStore();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <CustomerForm
          submitLabel="Cadastrar"
          onSubmit={(input) => {
            const customer = addCustomer(input);
            router.replace(`/cliente/${customer.id}`);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
