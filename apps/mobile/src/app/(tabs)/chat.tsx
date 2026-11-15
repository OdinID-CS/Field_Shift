import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatWidgetRenderer } from '@/components/chat-widgets';
import { PlannerIcon } from '@/components/icons';
import {
  BottomTabInset,
  brandPalette,
  roofiRadii,
  roofiTypography,
} from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usePilotState } from '@/hooks/use-pilot-state';
import {
  buildSmsWidgetForStrategy,
  computeCompareRows,
  resolveLocalChatCommand,
  type ChatWidget,
} from '@/lib/chat-actions';
import {
  sendFarmerChatMessage,
  type ChatHistoryTurn,
  type ChatResultCard,
  type PriorityWeightsTuple,
} from '@/lib/chat-api';
import { type ClimateStressId } from '@/lib/stress';
import { toast } from '@/lib/toast';
import { useTheme } from '@/theme/useTheme';

interface ChatBubble {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  pipelineSource?: string;
  resultCard?: ChatResultCard | null;
  widget?: ChatWidget | null;
}

const CHAT_HISTORY_STORAGE_KEY = 'fieldshift_plot_chat_history_v1';
const PLOT_PICKED_STORAGE_KEY = 'fieldshift_chat_plot_picked_v1';

const QUICK_PROMPTS = [
  'Best rotation for my cell',
  'Compare options',
  'Planting dates',
  'Switch zone / farm size',
  'Test severe drought risk',
  'Explain in Twi',
];

function buildWelcomeMessage(
  cellId: string,
  zoneName: string,
  farmAreaHa: number,
  askPlotFirst: boolean,
): ChatBubble {
  if (askPlotFirst) {
    return {
      id: `welcome-${cellId}`,
      role: 'assistant',
      content:
        'Akwaaba! Which plot are you working on today? Pick your plot and farm size below.',
      modelUsed: 'ScalarField Advisor',
      widget: {
        type: 'zone_picker',
        currentCellId: cellId,
        currentAreaHa: farmAreaHa,
      },
    };
  }
  return {
    id: `welcome-${cellId}`,
    role: 'assistant',
    content: `Akwaaba! This is your chat for ${zoneName}. Ask a question or tap an option below.`,
    modelUsed: 'ScalarField Advisor',
  };
}

export default function FarmerChatModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const {
    cells,
    selectedCell,
    weights,
    farmAreaHa,
    strategies,
    selectCell,
    setFarmAreaHa,
    applyPreset,
    logFarmerDecision,
  } = usePilotState();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [hasPickedPlot, setHasPickedPlot] = useState(false);
  const [plotMenuOpen, setPlotMenuOpen] = useState(false);
  const [historyByPlot, setHistoryByPlot] = useState<Record<string, ChatBubble[]>>({});
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<
    Record<string, boolean>
  >({});

  const toggleThinking = (id: string) => {
    setExpandedThinkingIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [rawHistory, rawPicked] = await Promise.all([
          AsyncStorage.getItem(CHAT_HISTORY_STORAGE_KEY),
          AsyncStorage.getItem(PLOT_PICKED_STORAGE_KEY),
        ]);
        if (!active) return;
        if (rawPicked === 'true') {
          setHasPickedPlot(true);
        }
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory) as Record<string, ChatBubble[]>;
          if (parsed && typeof parsed === 'object') {
            setHistoryByPlot(parsed);
          }
        }
      } catch {
        // Ignore storage errors and start fresh
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persistHistory = (next: Record<string, ChatBubble[]>) => {
    void AsyncStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(next)).catch(
      () => undefined,
    );
  };

  const activePlotId = selectedCell.cellId;
  const messages = historyByPlot[activePlotId] ?? [
    buildWelcomeMessage(
      activePlotId,
      selectedCell.zoneName,
      farmAreaHa,
      !hasPickedPlot,
    ),
  ];

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
  };

  const appendBubbleToPlot = (plotId: string, bubble: ChatBubble) => {
    const plotCell = cells.find((c) => c.cellId === plotId) ?? selectedCell;
    setHistoryByPlot((prev) => {
      const existing = prev[plotId] ?? [
        buildWelcomeMessage(
          plotId,
          plotCell.zoneName,
          farmAreaHa,
          false,
        ),
      ];
      const next = {
        ...prev,
        [plotId]: [...existing, bubble],
      };
      persistHistory(next);
      return next;
    });
    scrollToBottom();
  };

  const appendAssistantBubble = (
    bubble: Omit<ChatBubble, 'id' | 'role'>,
    plotId: string = activePlotId,
  ) => {
    appendBubbleToPlot(plotId, {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      ...bubble,
    });
  };

  const markPlotPicked = () => {
    if (!hasPickedPlot) {
      setHasPickedPlot(true);
      void AsyncStorage.setItem(PLOT_PICKED_STORAGE_KEY, 'true').catch(
        () => undefined,
      );
    }
  };

  const handleSwitchPlot = (cellId: string) => {
    markPlotPicked();
    selectCell(cellId);
    const targetCell = cells.find((c) => c.cellId === cellId);
    if (targetCell) {
      setHistoryByPlot((prev) => {
        if (prev[cellId]?.length) return prev;
        const next = {
          ...prev,
          [cellId]: [
            buildWelcomeMessage(
              cellId,
              targetCell.zoneName,
              farmAreaHa,
              false,
            ),
          ],
        };
        persistHistory(next);
        return next;
      });
    }
    scrollToBottom();
  };

  const handleSend = async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || sending) return;

    const targetPlotId = activePlotId;
    markPlotPicked();

    const userMsg: ChatBubble = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };
    const history: ChatHistoryTurn[] = messages
      .filter((m) => !m.id.startsWith('welcome'))
      .map((m) => ({ role: m.role, content: m.content }));

    appendBubbleToPlot(targetPlotId, userMsg);
    if (!rawText) setInput('');

    const localCmd = resolveLocalChatCommand({
      message: text,
      cellId: targetPlotId,
      weights,
      farmAreaHa,
      strategies,
    });
    if (localCmd) {
      appendAssistantBubble(
        {
          content: localCmd.reply,
          widget: localCmd.widget,
        },
        targetPlotId,
      );
      return;
    }

    setSending(true);
    const response = await sendFarmerChatMessage({
      message: text,
      history,
      cellId: targetPlotId,
      weights,
      farmAreaHa,
    });

    appendAssistantBubble(
      {
        content: response.reply,
        modelUsed: response.modelUsed,
        pipelineSource: response.pipelineSource,
        resultCard: response.resultCard,
      },
      targetPlotId,
    );
    setSending(false);
  };

  const { session } = useAuth();
  const isOfficer =
    session?.role === 'extension_officer' || session?.role === 'agronomist';

  const handleOpenCompareInChat = (card: ChatResultCard) => {
    selectCell(card.cellId);
    applyPreset(card.weights);
    appendAssistantBubble({
      content: `Compare plans for ${card.regionName} below and tap Choose on the one you want.`,
      widget: {
        type: 'compare',
        cellId: card.cellId,
        stressId: card.stressId,
        weights: card.weights,
        selectedStrategyCode: card.topStrategyCode,
      },
    });
  };

  const handleOpenCalendarInChat = () => {
    appendAssistantBubble({
      content: `Planting windows for ${selectedCell.zoneName}:`,
      widget: {
        type: 'calendar',
        cellId: selectedCell.cellId,
        zoneName: selectedCell.zoneName,
        focus: 'planting',
      },
    });
  };

  const handleChooseStrategyInChat = async (params: {
    strategyCode?: string;
    strategyName?: string;
    weights: PriorityWeightsTuple;
    stressId: ClimateStressId;
    baseScores: Record<string, number>;
    rankProbabilities: Record<string, number>;
  }) => {
    const strategy =
      strategies.find((s) => s.code === params.strategyCode) ?? strategies[0];
    applyPreset(params.weights);

    const res = await logFarmerDecision({
      selectedStrategyCode: strategy.code,
      computedBaseScores: params.baseScores,
      rankProbabilities: params.rankProbabilities,
      reasoningNotes: `Chosen in chat (${params.stressId})`,
    });

    const status = res.status === 'submitted' ? 'synced' : 'queued';
    toast.success(
      status === 'synced' ? 'Plan Saved' : 'Saved Offline',
      strategy.name,
    );

    appendAssistantBubble({
      content: `Saved ${strategy.name} for ${selectedCell.zoneName}.`,
      widget: {
        type: 'decision_saved',
        cellId: selectedCell.cellId,
        strategyCode: strategy.code,
        strategyName: strategy.name,
        status,
        detail:
          status === 'synced'
            ? 'Synced to your farm log.'
            : 'Saved on this phone and will sync when online.',
      },
    });
  };

  const handleSaveResultCard = (card: ChatResultCard) => {
    selectCell(card.cellId);
    const { baseScoreMap, rankProbMap } = computeCompareRows(
      strategies,
      card.weights,
      card.stressId,
    );
    void handleChooseStrategyInChat({
      strategyCode: card.topStrategyCode,
      strategyName: card.topStrategyName,
      weights: card.weights,
      stressId: card.stressId,
      baseScores: baseScoreMap,
      rankProbabilities: rankProbMap,
    });
  };

  const handleOpenSmsInChat = (strategyCode?: string) => {
    const strategy =
      strategies.find((s) => s.code === strategyCode) ?? strategies[0];
    appendAssistantBubble({
      content: `Ready to share ${strategy.name} in English and Twi.`,
      widget: buildSmsWidgetForStrategy({
        cellId: selectedCell.cellId,
        strategy,
        weights,
        stressId: 'baseline',
        strategies,
      }),
    });
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
              {isOfficer
                ? `${selectedCell.cellId} · ${farmAreaHa.toFixed(1)} ha`
                : `${selectedCell.zoneName.split(' ')[0]} · ${farmAreaHa.toFixed(1)} ha`}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Switch plot"
          accessibilityState={{ expanded: plotMenuOpen }}
          onPress={() => setPlotMenuOpen((prev) => !prev)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: roofiRadii.pill,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: plotMenuOpen
              ? brandPalette.ultramarineBlue
              : colors.border,
            opacity: pressed ? 0.75 : 1,
          })}>
          <Text
            style={{
              color: colors.text,
              fontFamily: roofiTypography.fontFamily.body,
              fontSize: 12,
            }}>
            {selectedCell.zoneName.split(' ')[0]}
          </Text>
          <PlannerIcon name="chevron" size={12} color={colors.textMuted} />
        </Pressable>
      </View>

      {plotMenuOpen && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
            gap: 4,
          }}>
          {cells.map((cell) => {
            const active = cell.cellId === selectedCell.cellId;
            const plotMsgCount = (historyByPlot[cell.cellId] ?? []).filter(
              (m) => !m.id.startsWith('welcome'),
            ).length;
            return (
              <Pressable
                key={cell.cellId}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  handleSwitchPlot(cell.cellId);
                  setPlotMenuOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: active
                    ? colors.background
                    : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: active
                        ? brandPalette.ultramarineBlue
                        : plotMsgCount > 0
                          ? '#4ADE80'
                          : colors.border,
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.text,
                      fontFamily: active
                        ? roofiTypography.fontFamily.displayMedium
                        : roofiTypography.fontFamily.body,
                      fontSize: 13,
                    }}>
                    {cell.zoneName}
                  </Text>
                </View>
                <Text
                  style={{
                    color: active ? brandPalette.ultramarineBlue : colors.textMuted,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 11.5,
                  }}>
                  {active ? 'Active' : cell.cellId.replace('ASH_', '')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

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
          const hasResultCard = !isUser && Boolean(msg.resultCard);
          const isThinkingOpen = Boolean(expandedThinkingIds[msg.id]);

          return (
            <View
              key={msg.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                gap: 8,
              }}>
              {hasResultCard && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isThinkingOpen }}
                  onPress={() => toggleThinking(msg.id)}
                  style={({ pressed }) => ({
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 2,
                    paddingHorizontal: 2,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontFamily: roofiTypography.fontFamily.body,
                      fontSize: 11,
                    }}>
                    {isThinkingOpen
                      ? 'Hide thinking'
                      : 'Thinking / Calculating...'}
                  </Text>
                  <PlannerIcon
                    name="chevron"
                    size={11}
                    color={colors.textMuted}
                  />
                </Pressable>
              )}

              {(!hasResultCard || isThinkingOpen) && (
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
              )}

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
                    <Text
                      style={{
                        color: brandPalette.ultramarineBlue,
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                      Urea saved: ~{msg.resultCard.ureaSavingsKgPerHa} kg/ha
                    </Text>
                    {isOfficer ? (
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                        Minimax regret: {msg.resultCard.lowestMaxRegret.toFixed(3)}
                      </Text>
                    ) : null}
                  </View>

                  {isOfficer ? (
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontFamily: roofiTypography.fontFamily.body,
                        fontSize: 11,
                        lineHeight: 16,
                      }}>
                      {msg.resultCard.scaleHonestySummary}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleSaveResultCard(msg.resultCard!)}
                      style={({ pressed }) => ({
                        flex: 1,
                        minWidth: 110,
                        paddingVertical: 9,
                        paddingHorizontal: 12,
                        borderRadius: roofiRadii.pill,
                        backgroundColor: brandPalette.chineseBlack,
                        alignItems: 'center',
                        opacity: pressed ? 0.8 : 1,
                      })}>
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontFamily: roofiTypography.fontFamily.body,
                          fontSize: 12,
                        }}>
                        Choose & Save
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleOpenCompareInChat(msg.resultCard!)}
                      style={({ pressed }) => ({
                        flex: 1,
                        minWidth: 110,
                        paddingVertical: 9,
                        paddingHorizontal: 12,
                        borderRadius: roofiRadii.pill,
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        opacity: pressed ? 0.75 : 1,
                      })}>
                      <Text
                        style={{
                          color: colors.text,
                          fontFamily: roofiTypography.fontFamily.body,
                          fontSize: 12,
                        }}>
                        Compare options
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={handleOpenCalendarInChat}
                      style={({ pressed }) => ({
                        paddingVertical: 9,
                        paddingHorizontal: 12,
                        borderRadius: roofiRadii.pill,
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        opacity: pressed ? 0.75 : 1,
                      })}>
                      <Text
                        style={{
                          color: colors.text,
                          fontFamily: roofiTypography.fontFamily.body,
                          fontSize: 12,
                        }}>
                        Planting dates
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {msg.widget && (
                <ChatWidgetRenderer
                  widget={msg.widget}
                  strategies={strategies}
                  isOfficer={isOfficer}
                  onChooseStrategy={({
                    strategy,
                    weights: nextWeights,
                    stressId,
                    baseScores: scoreMap,
                    rankProbabilities: probMap,
                  }) =>
                    void handleChooseStrategyInChat({
                      strategyCode: strategy.code,
                      strategyName: strategy.name,
                      weights: nextWeights,
                      stressId,
                      baseScores: scoreMap,
                      rankProbabilities: probMap,
                    })
                  }
                  onSelectZone={(cellId) => {
                    handleSwitchPlot(cellId);
                    toast.info(`Plot: ${cellId.replace('ASH_', '')}`);
                  }}
                  onSelectArea={(areaHa) => {
                    setFarmAreaHa(areaHa);
                    toast.info(`Farm size: ${areaHa} ha`);
                  }}
                  onRunPrompt={(prompt) => void handleSend(prompt)}
                  onOpenCalendar={handleOpenCalendarInChat}
                  onOpenSmsShare={handleOpenSmsInChat}
                />
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
          paddingBottom: keyboardOpen
            ? 10
            : Math.max(insets.bottom, 12) + BottomTabInset,
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
