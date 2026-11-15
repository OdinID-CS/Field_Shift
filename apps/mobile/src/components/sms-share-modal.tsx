import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';

import { PlannerIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Button, Heading } from '@/components/ui';
import { roofiRadii, roofiSpacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/lib/toast';

export interface SmsShareModalProps {
  visible: boolean;
  strategyName: string;
  message: string;
  onClose: () => void;
}

/**
 * Low-bandwidth EN + Ashanti Twi SMS/WhatsApp summary card bottom sheet,
 * styled to match Autis Planner's TaskActionsSheet (26px top radius, drag bar, pill buttons).
 */
export function SmsShareModal({
  visible,
  strategyName,
  message,
  onClose,
}: SmsShareModalProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [message, visible]);

  const charCount = message.length;
  const segments = Math.max(1, Math.ceil(charCount / 160));

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message);
    setCopied(true);
    toast.success('Copied to clipboard');
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({ message });
    } catch {
      toast.error('Could not open share');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close share sheet"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background },
          ]}>
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: theme.border },
            ]}
          />

          <View style={styles.headerRow}>
            <View style={styles.flexOne}>
              <Heading
                title="Farmer SMS / WhatsApp Card"
                subtitle={`${strategyName} · Bilingual EN + Twi`}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close share sheet"
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                },
              ]}>
              <PlannerIcon name="close" size={16} color={theme.foreground} />
            </Pressable>
          </View>

          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
                borderLeftColor: theme.primary,
              },
            ]}>
            <ThemedText type="default" style={{ color: theme.foreground }}>
              {message}
            </ThemedText>
          </View>

          <View style={styles.metaRow}>
            <ThemedText type="code" themeColor="secondary">
              {charCount}/320 chars · {segments} SMS{' '}
              {segments === 1 ? 'part' : 'parts'}
            </ThemedText>
            <View
              style={[
                styles.readyBadge,
                { backgroundColor: theme.sage.surface },
              ]}>
              <ThemedText type="code" style={{ color: theme.sage.ink }}>
                2G-READY FORMAT
              </ThemedText>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.flexOne}>
              <Button
                title={copied ? 'Copied!' : 'Copy Text'}
                onPress={() => void handleCopy()}
                secondary
              />
            </View>
            <View style={styles.flexOne}>
              <Button
                title="Share via App"
                onPress={() => void handleNativeShare()}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  sheet: {
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    gap: 12,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  flexOne: { flex: 1 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: roofiSpacing[4],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
});
