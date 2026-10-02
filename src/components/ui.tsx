import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import type { ChargeStatus } from '@/lib/billing';

export const colors = {
  primary: '#0F766E',
  primaryText: '#FFFFFF',
  background: '#F4F6F8',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  success: '#15803D',
  successBg: '#DCFCE7',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  whatsapp: '#128C7E',
};

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'whatsapp';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const background = {
    primary: colors.primary,
    secondary: colors.card,
    danger: colors.danger,
    whatsapp: colors.whatsapp,
  }[variant];
  const textColor = variant === 'secondary' ? colors.text : colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        variant === 'secondary' && styles.buttonOutline,
        style,
      ]}>
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={[styles.chipText, selected && { color: colors.primaryText }]}>{label}</Text>
    </Pressable>
  );
}

const STATUS_STYLE: Record<ChargeStatus, { label: string; color: string; bg: string }> = {
  pago: { label: 'Pago', color: colors.success, bg: colors.successBg },
  pendente: { label: 'A vencer', color: colors.warning, bg: colors.warningBg },
  atrasado: { label: 'Atrasado', color: colors.danger, bg: colors.dangerBg },
};

export function StatusBadge({ status }: { status: ChargeStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.color }]}>{style.label}</Text>
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  text: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  button: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: { borderWidth: 1, borderColor: colors.border },
  buttonText: { fontSize: 15, fontWeight: '600' },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  hint: { fontSize: 12, color: colors.muted },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
  },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 32, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});
