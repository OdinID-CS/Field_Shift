import React, { useMemo, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';

import {
  ASHANTI_PILOT_CELLS,
  PRIORITY_PRESETS,
  SEASONAL_VULNERABILITY_CALENDAR,
  type RotationStrategySpec,
} from '@/constants/pilot-data';
import { brandPalette, roofiRadii, roofiTypography } from '@/constants/theme';
import {
  computeCompareRows,
  type ChatWidget,
  type RankedCompareRow,
} from '@/lib/chat-actions';
import type { PriorityWeightsTuple } from '@/lib/chat-api';
import {
  CLIMATE_STRESS_SCENARIOS,
  type ClimateStressId,
} from '@/lib/stress';
import { useTheme } from '@/theme/useTheme';

const AREA_OPTIONS = [0.5, 1, 2, 5];

const STRESS_SHORT_LABELS: Record<ClimateStressId, string> = {
  baseline: 'Normal',
  moderate_drought: 'Dry spell',
  severe_heat_drought: 'Severe drought',
  intense_rainfall: 'Heavy rain',
};

const PRESET_SHORT_LABELS: Record<string, string> = {
  balanced: 'Balanced',
  water: 'Save water',
  soil: 'Soil cover',
  income: 'Income',
};

interface ChatWidgetRendererProps {
  widget: ChatWidget;
  strategies: RotationStrategySpec[];
  isOfficer: boolean;
  onChooseStrategy: (params: {
    strategy: RotationStrategySpec;
    weights: PriorityWeightsTuple;
    stressId: ClimateStressId;
    baseScores: Record<string, number>;
    rankProbabilities: Record<string, number>;
  }) => void;
  onSelectZone: (cellId: string) => void;
  onSelectArea: (areaHa: number) => void;
  onRunPrompt: (prompt: string) => void;
  onOpenCalendar: () => void;
  onOpenSmsShare: (strategyCode?: string) => void;
}

export function ChatWidgetRenderer({
  widget,
  strategies,
  isOfficer,
  onChooseStrategy,
  onSelectZone,
  onSelectArea,
  onRunPrompt,
  onOpenCalendar,
  onOpenSmsShare,
}: ChatWidgetRendererProps) {
  switch (widget.type) {
    case 'compare':
      return (
        <ChatCompareWidget
          widget={widget}
          strategies={strategies}
          isOfficer={isOfficer}
          onChooseStrategy={onChooseStrategy}
        />
      );
    case 'calendar':
      return (
        <ChatCalendarWidget
          widget={widget}
          onCompare={() => onRunPrompt('Compare options')}
        />
      );
    case 'zone_picker':
      return (
        <ChatZonePickerWidget
          widget={widget}
          onSelectZone={onSelectZone}
          onSelectArea={onSelectArea}
          onRunRecommendation={() => onRunPrompt('Best rotation for my cell')}
        />
      );
    case 'sms_share':
      return <ChatSmsShareWidget widget={widget} />;
    case 'decision_saved':
      return (
        <ChatDecisionSavedWidget
          widget={widget}
          onOpenCalendar={onOpenCalendar}
          onOpenSmsShare={() => onOpenSmsShare(widget.strategyCode)}
        />
      );
    default:
      return null;
  }
}

function ChatCompareWidget({
  widget,
  strategies,
  isOfficer,
  onChooseStrategy,
}: {
  widget: Extract<ChatWidget, { type: 'compare' }>;
  strategies: RotationStrategySpec[];
  isOfficer: boolean;
  onChooseStrategy: ChatWidgetRendererProps['onChooseStrategy'];
}) {
  const { colors } = useTheme();
  const [weights, setWeights] = useState<PriorityWeightsTuple>(widget.weights);
  const [stressId, setStressId] = useState<ClimateStressId>(widget.stressId);
  const [chosenCode, setChosenCode] = useState<string | undefined>(
    widget.selectedStrategyCode,
  );

  const activePresetId = useMemo(() => {
    const match = PRIORITY_PRESETS.find((p) =>
      p.weights.every((w, i) => Math.abs(w - weights[i]) < 0.02),
    );
    return match?.id ?? 'balanced';
  }, [weights]);

  const { rows, baseScoreMap, rankProbMap } = useMemo(
    () => computeCompareRows(strategies, weights, stressId),
    [strategies, weights, stressId],
  );

  const visibleRows: RankedCompareRow[] = rows.slice(0, 4);

  return (
    <View
      style={{
        padding: 12,
        borderRadius: roofiRadii.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text
          style={{
            color: brandPalette.ultramarineBlue,
            fontFamily: roofiTypography.fontFamily.body,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}>
          Compare Crop Plans · {widget.cellId}
        </Text>
      </View>

      {/* Priority Focus */}
      <View style={{ gap: 5 }}>
        <Text
          style={{
            color: colors.textMuted,
            fontFamily: roofiTypography.fontFamily.body,
            fontSize: 11,
          }}>
          Your focus
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {PRIORITY_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <Pressable
                key={preset.id}
                onPress={() =>
                  setWeights([...preset.weights] as PriorityWeightsTuple)
                }
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: roofiRadii.pill,
                  backgroundColor: active
                    ? brandPalette.ultramarineBlue
                    : colors.background,
                  borderWidth: 1,
                  borderColor: active
                    ? brandPalette.ultramarineBlue
                    : colors.border,
                }}>
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 11.5,
                  }}>
                  {PRESET_SHORT_LABELS[preset.id] ?? preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Weather Condition */}
      <View style={{ gap: 5 }}>
        <Text
          style={{
            color: colors.textMuted,
            fontFamily: roofiTypography.fontFamily.body,
            fontSize: 11,
          }}>
          Weather test
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {CLIMATE_STRESS_SCENARIOS.map((sc) => {
            const active = stressId === sc.id;
            return (
              <Pressable
                key={sc.id}
                onPress={() => setStressId(sc.id)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: roofiRadii.pill,
                  backgroundColor: active
                    ? brandPalette.chineseBlack
                    : colors.background,
                  borderWidth: 1,
                  borderColor: active
                    ? brandPalette.chineseBlack
                    : colors.border,
                }}>
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 11.5,
                  }}>
                  {STRESS_SHORT_LABELS[sc.id]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Ranked Options */}
      <View style={{ gap: 8, marginTop: 2 }}>
        {visibleRows.map((row, idx) => {
          const isChosen = chosenCode === row.strategy.code;
          const winPct = Math.round(row.winProb * 100);
          return (
            <View
              key={row.strategy.code}
              style={{
                padding: 10,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: isChosen
                  ? colors.success
                  : idx === 0
                    ? brandPalette.ultramarineBlue
                    : colors.border,
                gap: 4,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}>
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: colors.text,
                    fontFamily: roofiTypography.fontFamily.displayMedium,
                    fontSize: 13.5,
                  }}>
                  #{idx + 1} {row.strategy.name}
                </Text>
                <Text
                  style={{
                    color: idx === 0 ? colors.success : colors.textMuted,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 11.5,
                  }}>
                  {winPct}% match
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={{
                  color: colors.textMuted,
                  fontFamily: roofiTypography.fontFamily.body,
                  fontSize: 11.5,
                }}>
                {row.strategy.sequence}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 4,
                  gap: 8,
                }}>
                <Text
                  style={{
                    color:
                      row.ureaKgSavedPerHa > 0
                        ? brandPalette.ultramarineBlue
                        : colors.textMuted,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 11.5,
                    fontWeight: row.ureaKgSavedPerHa > 0 ? '600' : '400',
                  }}>
                  {row.ureaKgSavedPerHa > 0
                    ? `Saves ~${row.ureaKgSavedPerHa} kg/ha urea`
                    : 'Standard fertilizer'}
                </Text>

                <Pressable
                  onPress={() => {
                    setChosenCode(row.strategy.code);
                    onChooseStrategy({
                      strategy: row.strategy,
                      weights,
                      stressId,
                      baseScores: baseScoreMap,
                      rankProbabilities: rankProbMap,
                    });
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: roofiRadii.pill,
                    backgroundColor: isChosen
                      ? colors.success
                      : brandPalette.chineseBlack,
                    opacity: pressed ? 0.8 : 1,
                  })}>
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontFamily: roofiTypography.fontFamily.body,
                      fontSize: 11.5,
                    }}>
                    {isChosen ? 'Chosen' : 'Choose'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ChatCalendarWidget({
  widget,
  onCompare,
}: {
  widget: Extract<ChatWidget, { type: 'calendar' }>;
  onCompare: () => void;
}) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'planting' | 'bare' | 'all'>(
    widget.focus ?? 'planting',
  );

  const windows = useMemo(() => {
    if (filter === 'bare') {
      return SEASONAL_VULNERABILITY_CALENDAR.filter((w) => w.bareFieldRisk);
    }
    if (filter === 'planting') {
      return SEASONAL_VULNERABILITY_CALENDAR.filter((w) =>
        ['mar', 'apr', 'jul', 'aug', 'sep'].includes(w.id),
      );
    }
    return SEASONAL_VULNERABILITY_CALENDAR.slice(0, 6);
  }, [filter]);

  return (
    <View
      style={{
        padding: 12,
        borderRadius: roofiRadii.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
      }}>
      <Text
        style={{
          color: brandPalette.ultramarineBlue,
          fontFamily: roofiTypography.fontFamily.body,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}>
        Planting Windows · {widget.zoneName}
      </Text>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[
          { id: 'planting', label: 'Best planting' },
          { id: 'bare', label: 'Dry / Bare risk' },
          { id: 'all', label: 'Jan–Jun' },
        ].map((item) => {
          const active = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() =>
                setFilter(item.id as 'planting' | 'bare' | 'all')
              }
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: roofiRadii.pill,
                backgroundColor: active
                  ? brandPalette.ultramarineBlue
                  : colors.background,
                borderWidth: 1,
                borderColor: active
                  ? brandPalette.ultramarineBlue
                  : colors.border,
              }}>
              <Text
                style={{
                  color: active ? '#FFFFFF' : colors.text,
                  fontFamily: roofiTypography.fontFamily.body,
                  fontSize: 11.5,
                }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 6 }}>
        {windows.map((w) => (
          <View
            key={w.id}
            style={{
              padding: 9,
              borderRadius: 10,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 2,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: roofiTypography.fontFamily.displayMedium,
                  fontSize: 12.5,
                }}>
                {w.monthLabel} · {w.seasonLabel}
              </Text>
              <Text
                style={{
                  color:
                    w.rainReliability === 'High'
                      ? colors.success
                      : w.rainReliability === 'Moderate'
                        ? brandPalette.ultramarineBlue
                        : colors.textMuted,
                  fontFamily: roofiTypography.fontFamily.body,
                  fontSize: 11,
                }}>
                {w.rainMm} mm · {w.rainReliability} rain
              </Text>
            </View>
            <Text
              style={{
                color: colors.textMuted,
                fontFamily: roofiTypography.fontFamily.body,
                fontSize: 11.5,
                lineHeight: 16,
              }}>
              {w.summaryNote}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onCompare}
        style={({ pressed }) => ({
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
          Compare crop plans for this zone
        </Text>
      </Pressable>
    </View>
  );
}

function ChatZonePickerWidget({
  widget,
  onSelectZone,
  onSelectArea,
  onRunRecommendation,
}: {
  widget: Extract<ChatWidget, { type: 'zone_picker' }>;
  onSelectZone: (cellId: string) => void;
  onSelectArea: (areaHa: number) => void;
  onRunRecommendation: () => void;
}) {
  const { colors } = useTheme();
  const [selectedCellId, setSelectedCellId] = useState(widget.currentCellId);
  const [selectedArea, setSelectedArea] = useState(widget.currentAreaHa);

  return (
    <View
      style={{
        padding: 12,
        borderRadius: roofiRadii.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
      }}>
      <Text
        style={{
          color: brandPalette.ultramarineBlue,
          fontFamily: roofiTypography.fontFamily.body,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}>
        Your Zone & Farm Size
      </Text>

      <View style={{ gap: 6 }}>
        <Text
          style={{
            color: colors.textMuted,
            fontFamily: roofiTypography.fontFamily.body,
            fontSize: 11,
          }}>
          Select zone
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {ASHANTI_PILOT_CELLS.map((cell) => {
            const active = selectedCellId === cell.cellId;
            return (
              <Pressable
                key={cell.cellId}
                onPress={() => {
                  setSelectedCellId(cell.cellId);
                  onSelectZone(cell.cellId);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: roofiRadii.pill,
                  backgroundColor: active
                    ? brandPalette.ultramarineBlue
                    : colors.background,
                  borderWidth: 1,
                  borderColor: active
                    ? brandPalette.ultramarineBlue
                    : colors.border,
                }}>
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 11.5,
                  }}>
                  {cell.zoneName.split(' ')[0]} ({cell.cellId})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text
          style={{
            color: colors.textMuted,
            fontFamily: roofiTypography.fontFamily.body,
            fontSize: 11,
          }}>
          Farm size
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {AREA_OPTIONS.map((ha) => {
            const active = Math.abs(selectedArea - ha) < 0.05;
            return (
              <Pressable
                key={ha}
                onPress={() => {
                  setSelectedArea(ha);
                  onSelectArea(ha);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: roofiRadii.pill,
                  backgroundColor: active
                    ? brandPalette.chineseBlack
                    : colors.background,
                  borderWidth: 1,
                  borderColor: active
                    ? brandPalette.chineseBlack
                    : colors.border,
                }}>
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 11.5,
                  }}>
                  {ha} ha
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={onRunRecommendation}
        style={({ pressed }) => ({
          paddingVertical: 9,
          paddingHorizontal: 12,
          borderRadius: roofiRadii.pill,
          backgroundColor: brandPalette.ultramarineBlue,
          alignItems: 'center',
          opacity: pressed ? 0.8 : 1,
        })}>
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: roofiTypography.fontFamily.body,
            fontSize: 12.5,
          }}>
          Get best rotation now
        </Text>
      </Pressable>
    </View>
  );
}

function ChatSmsShareWidget({
  widget,
}: {
  widget: Extract<ChatWidget, { type: 'sms_share' }>;
}) {
  const { colors } = useTheme();

  const handleShare = async () => {
    try {
      await Share.share({
        message: widget.message,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  return (
    <View
      style={{
        padding: 12,
        borderRadius: roofiRadii.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
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
        SMS / WhatsApp Summary · {widget.cellId}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontFamily: roofiTypography.fontFamily.body,
          fontSize: 12.5,
          lineHeight: 18,
          padding: 10,
          borderRadius: 10,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        {widget.message}
      </Text>
      <Pressable
        onPress={() => void handleShare()}
        style={({ pressed }) => ({
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
            fontSize: 12,
          }}>
          Share via SMS / WhatsApp
        </Text>
      </Pressable>
    </View>
  );
}

function ChatDecisionSavedWidget({
  widget,
  onOpenCalendar,
  onOpenSmsShare,
}: {
  widget: Extract<ChatWidget, { type: 'decision_saved' }>;
  onOpenCalendar: () => void;
  onOpenSmsShare: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        padding: 12,
        borderRadius: roofiRadii.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.success,
        gap: 8,
      }}>
      <Text
        style={{
          color: colors.success,
          fontFamily: roofiTypography.fontFamily.body,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}>
        {widget.status === 'synced' ? 'Plan Saved' : 'Saved Offline'} ·{' '}
        {widget.cellId}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontFamily: roofiTypography.fontFamily.displayMedium,
          fontSize: 14,
        }}>
        {widget.strategyName}
      </Text>
      <Text
        style={{
          color: colors.textMuted,
          fontFamily: roofiTypography.fontFamily.body,
          fontSize: 12,
        }}>
        {widget.detail}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
        <Pressable
          onPress={onOpenCalendar}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 10,
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
        <Pressable
          onPress={onOpenSmsShare}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 10,
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
            Share SMS
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
