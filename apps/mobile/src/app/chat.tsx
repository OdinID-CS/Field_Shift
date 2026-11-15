import { useRouter } from 'expo-router';
import React, { useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlannerIcon } from '@/components/icons';
import { brandPalette, roofiRadii, roofiTypography } from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import {
  sendFarmerChatMessage,
  type ChatHistoryTurn,
  type ChatResultCard,
} from '@/lib/chat-api';
import { toast } from '@/lib/toast';
import { useTheme } from '@/theme/useTheme';

interface ChatBubble {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  pipelineSource?: string;
  resultCard?: ChatResultCard | null;
}

const QUICK_PROMPTS = [
  'Best rotation for my cell',
  'Test severe drought risk',
  'Cut urea fertilizer cost',
  'Explain in Twi',
];

export default function FarmerChatModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const isDark = scheme === 'dark';
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const {
    selectedCell,
    weights,
    farmAreaHa,
    selectCell,
    applyPreset,
  } = usePilotState();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Akwaaba! Ask me about ${selectedCell.cellId} (${selectedCell.zoneName}), drought risk, soil fertility, or fertilizer savings — I will run your question through the 2,000-run Monte Carlo & Minimax Regret pipeline.`,
      modelUsed: 'ScalarField Advisor',
    },
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
  };

  const handleSend = async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || sending) return;

    const userMsg: ChatBubble = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };
    const history: ChatHistoryTurn[] = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    if (!rawText) setInput('');
    setSending(true);
    scrollToBottom();

    const response = await sendFarmerChatMessage({
      message: text,
      history,
      cellId: selectedCell.cellId,
      weights,
      farmAreaHa,
    });

    const assistantMsg: ChatBubble = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: response.reply,
      modelUsed: response.modelUsed,
      pipelineSource: response.pipelineSource,
      resultCard: response.resultCard,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setSending(false);
    scrollToBottom();
  };

  const handleApplyToCompare = (card: ChatResultCard) => {
    selectCell(card.cellId);
    applyPreset(card.weights);
    toast.success(
      'Applied to Compare',
      `${card.cellId} · ${card.topStrategyName}`,
    );
    router.replace('/(tabs)/compare');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      {/* Modal Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 14),
          paddingBottom: 12,
          paddingHorizontal: 18,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: brandPalette.ultramarineBlue,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <PlannerIcon name="chat" size={19} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                color: colors.text,
                fontFamily: roofiTypography.fontFamily.displayMedium,
                fontSize: 17,
                letterSpacing: -0.3,
              }}>
              ScalarField Advisor
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: colors.textMuted,
                fontFamily: roofiTypography.fontFamily.body,
                fontSize: 12,
              }}>
              {selectedCell.cellId} · {farmAreaHa.toFixed(1)} ha · OpenRouter + MCDA
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close chat"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EFEFEF',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}>
          <PlannerIcon name="close" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Quick Prompts */}
      <View
        style={{
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {QUICK_PROMPTS.map((prompt) => (
            <Pressable
              key={prompt}
              disabled={sending}
              onPress={() => void handleSend(prompt)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: roofiRadii.pill,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: roofiTypography.fontFamily.body,
                  fontSize: 12,
                }}>
                {prompt}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View
              key={msg.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                gap: 8,
              }}>
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderRadius: 18,
                  borderBottomRightRadius: isUser ? 4 : 18,
                  borderBottomLeftRadius: isUser ? 18 : 4,
                  backgroundColor: isUser
                    ? brandPalette.ultramarineBlue
                    : colors.surface,
                  borderWidth: isUser ? 0 : 1,
                  borderColor: colors.border,
                }}>
                <Text
                  style={{
                    color: isUser ? '#FFFFFF' : colors.text,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 14.5,
                    lineHeight: 20,
                  }}>
                  {msg.content}
                </Text>
                {!isUser && msg.modelUsed && (
                  <Text
                    style={{
                      marginTop: 6,
                      color: colors.textMuted,
                      fontFamily: roofiTypography.fontFamily.body,
                      fontSize: 10.5,
                    }}>
                    {msg.modelUsed}
                    {msg.pipelineSource ? ` · ${msg.pipelineSource}` : ''}
                  </Text>
                )}
              </View>

              {msg.resultCard && (
                <View
                  style={{
                    padding: 14,
                    borderRadius: roofiRadii.xl,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 8,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}>
                    <Text
                      style={{
                        color: brandPalette.ultramarineBlue,
                        fontFamily: roofiTypography.fontFamily.body,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                      }}>
                      Pipeline Result · {msg.resultCard.cellId}
                    </Text>
                    <Text
                      style={{
                        color: colors.success,
                        fontFamily: roofiTypography.fontFamily.body,
                        fontSize: 12,
                      }}>
                      {Math.round(msg.resultCard.topProbabilityFirst * 100)}% Rank-1
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: colors.text,
                      fontFamily: roofiTypography.fontFamily.displayMedium,
                      fontSize: 15,
                    }}>
                    {msg.resultCard.topStrategyName}
                  </Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontFamily: roofiTypography.fontFamily.body,
                      fontSize: 12.5,
                    }}>
                    {msg.resultCard.topStrategySequence}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 10,
                      paddingTop: 4,
                    }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '500' }}>
                      MCDA: {msg.resultCard.topBaseScore.toFixed(3)} (+
                      {msg.resultCard.deltaVsBaseline.toFixed(3)})
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '500' }}>
                      Urea saved: ~{msg.resultCard.ureaSavingsKgPerHa} kg/ha
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      Minimax regret: {msg.resultCard.lowestMaxRegret.toFixed(3)}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: colors.textMuted,
                      fontFamily: roofiTypography.fontFamily.body,
                      fontSize: 11,
                      lineHeight: 16,
                    }}>
                    {msg.resultCard.scaleHonestySummary}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleApplyToCompare(msg.resultCard!)}
                    style={({ pressed }) => ({
                      marginTop: 4,
                      paddingVertical: 9,
                      paddingHorizontal: 14,
                      borderRadius: roofiRadii.pill,
                      backgroundColor: brandPalette.chineseBlack,
                      alignItems: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}>
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontFamily: roofiTypography.fontFamily.body,
                        fontSize: 12.5,
                      }}>
                      Apply to Compare Studio
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        {sending && (
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <ActivityIndicator size="small" color={brandPalette.ultramarineBlue} />
            <Text
              style={{
                color: colors.textMuted,
                fontFamily: roofiTypography.fontFamily.body,
                fontSize: 13,
              }}>
              Running 2,000 Monte Carlo simulations...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
        }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about drought, soil, crop rotation, or Twi..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={600}
          returnKeyType="send"
          onSubmitEditing={() => void handleSend()}
          style={{
            flex: 1,
            minHeight: 42,
            maxHeight: 110,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 21,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            fontFamily: roofiTypography.fontFamily.body,
            fontSize: 14.5,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={sending || input.trim().length === 0}
          onPress={() => void handleSend()}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor:
              input.trim().length === 0 || sending
                ? colors.border
                : brandPalette.ultramarineBlue,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}>
          <PlannerIcon name="chevron" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
