import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BottomTabInset,
  MaxContentWidth,
  roofiRadii,
  roofiSpacing,
  roofiTypography,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/theme/useTheme';

export function Screen({
  children,
  scroll = false,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const { isConnected } = usePilotState();
  const isOffline = !isConnected;
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>{children}</View>
  );
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}>
      {isOffline ? (
        <View
          accessibilityRole="alert"
          style={{
            paddingHorizontal: 16,
            paddingVertical: 9,
            backgroundColor: colors.muted,
          }}>
          <Text
            style={{
              color: colors.foreground,
              fontFamily: roofiTypography.fontFamily.body,
              fontSize: 13,
              fontWeight: '500',
              textAlign: 'center',
            }}>
            Offline mode — viewing cached Ashanti EO telemetry
          </Text>
        </View>
      ) : null}
      {content}
    </SafeAreaView>
  );
}

export function Heading({
  title,
  subtitle,
  fontFamily,
  color,
}: {
  title: string;
  subtitle?: string;
  fontFamily?: string;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.heading}>
      <Text
        style={[
          styles.title,
          { color: color ?? colors.foreground },
          fontFamily ? { fontFamily } : null,
        ]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.secondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.secondary}
        selectionColor={colors.accent}
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
          style,
        ]}
        accessibilityLabel={label}
        {...props}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
  networkRequired = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  networkRequired?: boolean;
}) {
  const { colors } = useTheme();
  const { isConnected } = usePilotState();
  const offline = networkRequired && !isConnected;
  const unavailable = disabled || busy || offline;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable }}
      onPress={onPress}
      disabled={unavailable}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? colors.surface : colors.primary,
          borderColor: secondary ? colors.border : colors.primary,
          opacity: unavailable ? 0.55 : pressed ? 0.84 : 1,
        },
      ]}>
      {busy ? (
        <ActivityIndicator
          color={secondary ? colors.accent : colors.onPrimary}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            { color: secondary ? colors.foreground : colors.onPrimary },
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function QuietButton({
  title,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quietButton,
        { opacity: pressed ? 0.65 : 1 },
      ]}>
      <Text style={[styles.quietText, { color: colors.accent }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          shadowColor: colors.foreground,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Body({
  children,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.body, { color: colors.secondary }, style]}>
      {children}
    </Text>
  );
}

export function Label({
  children,
  style,
}: {
  children: ReactNode;
  style?: TextStyle;
}) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.label, { color: colors.secondary }, style]}>
      {children}
    </Text>
  );
}

export function Tag({
  children,
  tone = 'cyan',
}: {
  children: ReactNode;
  tone?: 'pink' | 'gold' | 'sage' | 'cyan';
}) {
  const { colors } = useTheme();
  const palette = colors[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: palette.tint,
      }}>
      <Text
        style={{
          color: palette.ink,
          fontFamily: roofiTypography.fontFamily.body,
          fontSize: 11,
          fontWeight: '500',
        }}>
        {children}
      </Text>
    </View>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.error, { backgroundColor: colors.errorSurface }]}>
      <Text
        style={{
          color: colors.error,
          fontFamily: roofiTypography.fontFamily.body,
        }}>
        {children}
      </Text>
    </View>
  );
}

export const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: roofiSpacing[3],
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: roofiSpacing[5],
    gap: roofiSpacing[4],
  },
  scroll: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: roofiSpacing[5],
    gap: roofiSpacing[4],
    flexGrow: 1,
    paddingBottom: BottomTabInset + roofiSpacing[4],
  },
  heading: { gap: roofiSpacing[1], marginBottom: roofiSpacing[2] },
  title: {
    fontFamily: roofiTypography.fontFamily.displayMedium,
    fontSize: roofiTypography.fontSize.screenTitle,
    lineHeight: roofiTypography.lineHeight.screenTitle,
    fontWeight: '500',
    letterSpacing: -0.35,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.body,
    lineHeight: 20,
  },
  field: { gap: 7 },
  label: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.label,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderRadius: roofiRadii.lg,
    borderWidth: 1,
    paddingHorizontal: roofiSpacing[4],
    paddingVertical: 12,
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.body,
  },
  button: {
    minHeight: 44,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: roofiSpacing[5],
  },
  buttonText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.button,
    fontWeight: '500',
  },
  quietButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  quietText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.body,
    fontWeight: '500',
  },
  card: {
    borderWidth: 1,
    borderRadius: roofiRadii['2xl'],
    padding: roofiSpacing[4],
    gap: roofiSpacing[3],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  body: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.body,
    lineHeight: roofiTypography.lineHeight.body,
  },
  error: { padding: roofiSpacing[3], borderRadius: roofiRadii.xl },
});
