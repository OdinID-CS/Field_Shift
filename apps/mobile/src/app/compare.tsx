import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Layers, ShieldCheck, Sprout } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CropSequenceStrip } from '@/components/crop-sequence-strip';
import {
  SegmentedPillBar,
  ThreeZoneGaugeBar,
  TopBarHeader,
} from '@/components/design-system';
import { SmsShareModal } from '@/components/sms-share-modal';
import { ThemedText } from '@/components/themed-text';
import { Button, Label } from '@/components/ui';
import {
  PRIORITY_PRESETS,
  SCORING_CRITERIA,
} from '@/constants/pilot-data';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  roofiRadii,
  roofiSpacing,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';
import {
  fetchRemoteStressTest,
  type RemoteStressTestResult,
} from '@/lib/decision-api';
import { baseScores, rankProbabilities } from '@/lib/scoring';
import {
  buildSmsSummaryCard,
  estimateNitrogenOffsetSummary,
} from '@/lib/sms-export';
import {
  applyClimateStressToStrategies,
  CLIMATE_STRESS_SCENARIOS,
  computeMinimaxRegretRankings,
  type ClimateStressId,
} from '@/lib/stress';
import { toast } from '@/lib/toast';

const PRESET_PILL_OPTIONS = PRIORITY_PRESETS.map((p) => ({
  id: p.id,
  label: p.label.replace(' & Erosion', '').replace(' Focus', ''),
}));

const STRESS_PILL_OPTIONS = CLIMATE_STRESS_SCENARIOS.map((s) => ({
  id: s.id,
  label: s.shortLabel,
}));

const VIEW_MODE_OPTIONS = [
  { id: 'cards', label: 'Strategy Cards' },
  { id: 'matrix', label: 'Head-to-Head Matrix' },
] as const;

export default function CompareScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    selectedCell,
    weights,
    setExactWeightAt,
    applyPreset,
    strategies,
    dataSourceMode,
    logFarmerDecision,
  } = usePilotState();

  const [activePresetId, setActivePresetId] = useState<string>(
    PRIORITY_PRESETS[0].id,
  );
  const [stressId, setStressId] = useState<ClimateStressId>('baseline');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [showPriorityEditor, setShowPriorityEditor] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [smsPreview, setSmsPreview] = useState<{
    strategyName: string;
    message: string;
  } | null>(null);
  const [remoteResult, setRemoteResult] =
    useState<RemoteStressTestResult | null>(null);

  useEffect(() => {
    let active = true;
    void fetchRemoteStressTest({
      strategies,
      weights: [...weights],
      stressId,
      runs: 2000,
      seed: 42,
    }).then((result) => {
      if (active) {
        setRemoteResult(result);
      }
    });
    return () => {
      active = false;
    };
  }, [strategies, weights, stressId]);

  const baselineMatrix = strategies.map((s) => [...s.criterionScores]);
  const localBaselineScores = baseScores(baselineMatrix, [...weights]);
  const localScoreMatrix = applyClimateStressToStrategies(strategies, stressId);
  const localComputedScores = baseScores(localScoreMatrix, [...weights]);
  const localStability = rankProbabilities(localScoreMatrix, [...weights], {
    runs: 2000,
    seed: 42,
  });
  const localMinimax = computeMinimaxRegretRankings(
    strategies,
    [...weights],
    baseScores,
  );

  const baselineScores =
    remoteResult && remoteResult.baselineBaseScores.length === strategies.length
      ? remoteResult.baselineBaseScores
      : localBaselineScores;
  const scoreMatrix =
    remoteResult && remoteResult.stressedMatrix.length === strategies.length
      ? remoteResult.stressedMatrix
      : localScoreMatrix;
  const computedScores =
    remoteResult && remoteResult.baseScores.length === strategies.length
      ? remoteResult.baseScores
      : localComputedScores;
  const stability =
    remoteResult &&
    remoteResult.probabilityFirst.length === strategies.length &&
    remoteResult.meanRank.length === strategies.length
      ? {
          probabilityFirst: remoteResult.probabilityFirst,
          meanRank: remoteResult.meanRank,
        }
      : localStability;
  const minimax = remoteResult ? remoteResult.minimax : localMinimax;

  const activeScenario =
    CLIMATE_STRESS_SCENARIOS.find((item) => item.id === stressId) ??
    CLIMATE_STRESS_SCENARIOS[0];
  const sourceBadge =
    dataSourceMode === 'supabase'
      ? 'Live Supabase'
      : dataSourceMode === 'cached'
        ? 'Offline Cache'
        : 'Ashanti Bundle';

  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  const rankedIndices = strategies
    .map((_, idx) => idx)
    .sort((a, b) => computedScores[b] - computedScores[a]);

  const handleSelectPreset = (id: string) => {
    const preset = PRIORITY_PRESETS.find((p) => p.id === id);
    if (preset) {
      setActivePresetId(id);
      applyPreset(preset.weights);
    }
  };

  const handleSelectStress = (id: ClimateStressId) => {
    setStressId(id);
  };

  const handleShareSms = (sIdx: number) => {
    const strategy = strategies[sIdx];
    const scorePct = Math.round(computedScores[sIdx] * 100);
    const probPct = Math.round(stability.probabilityFirst[sIdx] * 100);
    const deltaPct = Math.round(
      (computedScores[sIdx] - baselineScores[sIdx]) * 100,
    );
    const message = buildSmsSummaryCard({
      cellId: selectedCell.cellId,
      strategy,
      baseScorePct: scorePct,
      winProbPct: probPct,
      scenarioLabel: activeScenario.shortLabel,
      stressDeltaPct: stressId === 'baseline' ? undefined : deltaPct,
    });
    setSmsPreview({ strategyName: strategy.name, message });
  };

  const handleLogDecision = async (
    strategyCode: string,
    strategyName: string,
  ) => {
    const baseScoreMap: Record<string, number> = {};
    const rankProbMap: Record<string, number> = {};
    strategies.forEach((s, idx) => {
      baseScoreMap[s.code] = Number(computedScores[idx].toFixed(4));
      rankProbMap[s.code] = Number(stability.probabilityFirst[idx].toFixed(4));
    });
    const res = await logFarmerDecision({
      selectedStrategyCode: strategyCode,
      computedBaseScores: baseScoreMap,
      rankProbabilities: rankProbMap,
      reasoningNotes: `Selected under ${activeScenario.shortLabel} preset`,
    });
    if (res.status === 'submitted') {
      toast.success(
        `Logged ${strategyName}`,
        'Saved to Supabase farmer decision log.',
      );
    } else {
      toast.warning(
        `Saved ${strategyName} offline`,
        `${res.queuedCount} decision(s) queued to sync when online.`,
      );
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title={`Strategies (${strategies.length})`}
        subtitle={`${selectedCell.cellId} · ${sourceBadge} · ${activeScenario.shortLabel}`}
        leftAction={{
          id: 'back-tools',
          icon: {
            ios: 'chevron.left',
            android: 'arrow_back',
            web: 'arrow_back',
          },
          onPress: () => router.back(),
          accessibilityLabel: 'Back to Tools',
        }}
        rightActions={[
          {
            id: 'preset-filter',
            icon: {
              ios: 'slider.horizontal.3',
              android: 'tune',
              web: 'tune',
            },
            badgeDot: true,
            onPress: () => setShowPriorityEditor((v) => !v),
            accessibilityLabel: 'Toggle priority weight sliders',
          },
          {
            id: 'add-adjust',
            icon: {
              ios: 'plus',
              android: 'add',
              web: 'add',
            },
            variant: 'primary',
            onPress: () => setShowPriorityEditor((v) => !v),
            accessibilityLabel: 'Adjust farmer priorities',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SegmentedPillBar
          options={PRESET_PILL_OPTIONS}
          selectedId={activePresetId}
          onSelect={handleSelectPreset}
        />

        <View style={styles.stressSection}>
          <View style={styles.stressHeaderRow}>
            <Label>CLIMATE STRESS &amp; ANALOG REPLAY</Label>
            <View
              style={[
                styles.apiEnginePill,
                {
                  backgroundColor: remoteResult
                    ? theme.sage.surface
                    : theme.surfaceSubtle,
                },
              ]}>
              <ThemedText
                type="code"
                style={{
                  color: remoteResult ? theme.sage.ink : theme.secondary,
                }}>
                {remoteResult ? 'LIVE API · VERCEL' : 'LOCAL ENGINE'}
              </ThemedText>
            </View>
          </View>
          <SegmentedPillBar
            options={STRESS_PILL_OPTIONS}
            selectedId={stressId}
            onSelect={(id) => handleSelectStress(id as ClimateStressId)}
          />
          {stressId !== 'baseline' && (
            <ThemedText type="small" themeColor="mutedText">
              Simulating: {activeScenario.label}
            </ThemedText>
          )}
        </View>

        <SegmentedPillBar
          options={VIEW_MODE_OPTIONS}
          selectedId={viewMode}
          onSelect={(id) => setViewMode(id as 'cards' | 'matrix')}
        />

        {showPriorityEditor && (
          <View
            style={[
              styles.editorCard,
              CardShadow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <ThemedText type="sectionTitle">Custom Priority Weights</ThemedText>
            {SCORING_CRITERIA.map((criterion, idx) => {
              const sharePct = Math.round((weights[idx] / weightSum) * 100);
              return (
                <View key={criterion} style={styles.sliderBlock}>
                  <View style={styles.weightRow}>
                    <ThemedText type="smallBold">{criterion}</ThemedText>
                    <ThemedText
                      type="code"
                      style={{ color: theme.personal.ink }}>
                      {sharePct}% share ({weights[idx].toFixed(2)})
                    </ThemedText>
                  </View>
                  <Slider
                    minimumValue={0.05}
                    maximumValue={1}
                    step={0.05}
                    value={weights[idx]}
                    onValueChange={(val) => setExactWeightAt(idx, val)}
                    minimumTrackTintColor={theme.primary}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.primary}
                  />
                </View>
              );
            })}
          </View>
        )}

        {viewMode === 'matrix' && (
          <View
            style={[
              styles.strategyCard,
              CardShadow,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <ThemedText type="sectionTitle">
              Strategy &amp; Regret Matrix ({activeScenario.shortLabel})
            </ThemedText>
            <View
              style={[
                styles.matrixHeader,
                { borderBottomColor: theme.border },
              ]}>
              <ThemedText
                type="code"
                themeColor="mutedText"
                style={styles.matrixColName}>
                STRATEGY
              </ThemedText>
              <ThemedText
                type="code"
                themeColor="mutedText"
                style={styles.matrixColStat}>
                FIT
              </ThemedText>
              <ThemedText
                type="code"
                themeColor="mutedText"
                style={styles.matrixColStat}>
                WIN%
              </ThemedText>
              <ThemedText
                type="code"
                themeColor="mutedText"
                style={styles.matrixColStat}>
                REGRET
              </ThemedText>
            </View>
            {rankedIndices.map((sIdx) => {
              const s = strategies[sIdx];
              const isSafe = minimax.lowestRegretCode === s.code;
              const regret = minimax.rowsByCode[s.code];
              return (
                <View
                  key={`mtx-${s.code}`}
                  style={[
                    styles.matrixRow,
                    { borderBottomColor: theme.border },
                  ]}>
                  <View style={styles.matrixColName}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {s.name}
                    </ThemedText>
                    {isSafe && (
                      <ThemedText
                        type="code"
                        style={{ color: theme.sage.ink }}>
                        Lowest-Regret Pick
                      </ThemedText>
                    )}
                  </View>
                  <ThemedText type="code" style={styles.matrixColStat}>
                    {Math.round(computedScores[sIdx] * 100)}
                  </ThemedText>
                  <ThemedText type="code" style={styles.matrixColStat}>
                    {Math.round(stability.probabilityFirst[sIdx] * 100)}%
                  </ThemedText>
                  <ThemedText
                    type="code"
                    style={[
                      styles.matrixColStat,
                      { color: isSafe ? theme.sage.ink : theme.warning },
                    ]}>
                    {regret ? `${Math.round(regret.maxRegret * 100)}%` : '—'}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}

        {viewMode === 'cards' &&
          rankedIndices.map((sIdx, rankPos) => {
            const strategy = strategies[sIdx];
            const scorePct = Math.round(computedScores[sIdx] * 100);
            const deltaPct = Math.round(
              (computedScores[sIdx] - baselineScores[sIdx]) * 100,
            );
            const probPct = Math.round(
              stability.probabilityFirst[sIdx] * 100,
            );
            const isExpanded = expandedCode === strategy.code;
            const isLowestRegret = minimax.lowestRegretCode === strategy.code;
            const regretRow = minimax.rowsByCode[strategy.code];
            const nOffset = estimateNitrogenOffsetSummary(strategy);

            return (
              <View
                key={strategy.code}
                style={[
                  styles.strategyCard,
                  CardShadow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderLeftWidth: rankPos === 0 ? 4 : 1,
                    borderLeftColor:
                      rankPos === 0 ? theme.primary : theme.border,
                  },
                ]}>
                <CropSequenceStrip
                  sequence={strategy.sequence}
                  isBaseline={strategy.isBaseline}
                />

                <View style={styles.cardMetaRow}>
                  <View style={styles.flexOne}>
                    <ThemedText type="sectionTitle">
                      {strategy.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="mutedText">
                      {selectedCell.cellId} ·{' '}
                      {strategy.isBaseline
                        ? 'Current baseline'
                        : `Option #${rankPos + 1}`}
                    </ThemedText>
                  </View>

                  <View style={styles.statusRight}>
                    <View style={styles.onlineRow}>
                      <View
                        style={[
                          styles.onlineDot,
                          {
                            backgroundColor:
                              rankPos === 0 ? theme.primary : theme.warning,
                          },
                        ]}
                      />
                      <ThemedText type="smallBold">
                        Rank #{rankPos + 1} · {probPct}% win
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="mutedText">
                      Mean rank {stability.meanRank[sIdx].toFixed(2)}
                      {stressId !== 'baseline'
                        ? ` · ${deltaPct >= 0 ? `+${deltaPct}` : deltaPct}% vs base`
                        : ''}
                    </ThemedText>
                  </View>
                </View>

                {(isLowestRegret ||
                  nOffset.ureaBagsSavedPerHa > 0 ||
                  nOffset.bareDaysAvoided > 0) && (
                  <View style={styles.highlightChipsRow}>
                    {isLowestRegret && (
                      <View
                        style={[
                          styles.regretBadge,
                          { backgroundColor: theme.sage.surface },
                        ]}>
                        <ShieldCheck size={13} color={theme.sage.ink} />
                        <ThemedText
                          type="code"
                          style={{ color: theme.sage.ink }}>
                          Lowest-Regret Safe Pick
                          {regretRow
                            ? ` (gap ${(regretRow.maxRegret * 100).toFixed(0)}%)`
                            : ''}
                        </ThemedText>
                      </View>
                    )}
                    {nOffset.ureaBagsSavedPerHa > 0 && (
                      <View
                        style={[
                          styles.regretBadge,
                          { backgroundColor: theme.surfaceSubtle },
                        ]}>
                        <Sprout size={13} color={theme.sage.edge} />
                        <ThemedText type="code" themeColor="secondary">
                          ~{nOffset.ureaBagsSavedPerHa} urea bags/ha saved
                        </ThemedText>
                      </View>
                    )}
                    {nOffset.bareDaysAvoided > 0 && (
                      <View
                        style={[
                          styles.regretBadge,
                          { backgroundColor: theme.personal.surface },
                        ]}>
                        <Layers size={13} color={theme.primary} />
                        <ThemedText
                          type="code"
                          style={{ color: theme.personal.ink }}>
                          -{nOffset.bareDaysAvoided} Harmattan bare d
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}

                <ThreeZoneGaugeBar
                  label="Weighted priority fit"
                  scorePercent={scorePct}
                  zoneLabels={['Low fit', 'Optimal', 'Robust']}
                />

                <View style={styles.actionRow}>
                  <View style={styles.flexOne}>
                    <Button
                      title="Share SMS / Twi"
                      onPress={() => handleShareSms(sIdx)}
                      secondary
                    />
                  </View>
                  <View style={styles.flexOne}>
                    <Button
                      title="Log Choice"
                      onPress={() =>
                        void handleLogDecision(strategy.code, strategy.name)
                      }
                    />
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setExpandedCode(isExpanded ? null : strategy.code)
                  }
                  style={({ pressed }) => [
                    styles.expandToggle,
                    { backgroundColor: theme.surfaceSubtle },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor="secondary">
                    {isExpanded
                      ? 'Hide agronomic breakdown'
                      : 'View benefits, gaps & local checks'}
                  </ThemedText>
                </Pressable>

                {isExpanded && (
                  <View style={styles.expandedBody}>
                    <View style={styles.criteriaChips}>
                      {SCORING_CRITERIA.map((criterion, cIdx) => (
                        <View
                          key={criterion}
                          style={[
                            styles.criterionChip,
                            { backgroundColor: theme.surfaceSubtle },
                          ]}>
                          <ThemedText type="code" themeColor="secondary">
                            {criterion.split(' ')[0]}:{' '}
                            {scoreMatrix[sIdx][cIdx].toFixed(2)}
                          </ThemedText>
                        </View>
                      ))}
                    </View>

                    <ThemedText type="smallBold">Expected benefits</ThemedText>
                    {strategy.expectedBenefits.map((benefit) => (
                      <ThemedText
                        key={benefit}
                        type="small"
                        themeColor="secondary">
                        • {benefit}
                      </ThemedText>
                    ))}

                    <ThemedText type="smallBold">
                      Information gaps &amp; local review
                    </ThemedText>
                    {strategy.informationGaps.map((gap) => (
                      <ThemedText
                        key={gap}
                        type="small"
                        themeColor="secondary">
                        • Gap: {gap}
                      </ThemedText>
                    ))}
                    {strategy.risksNeedingReview.map((risk) => (
                      <ThemedText
                        key={risk}
                        type="small"
                        themeColor="secondary">
                        • Local check: {risk}
                      </ThemedText>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
      </ScrollView>

      <SmsShareModal
        visible={smsPreview !== null}
        strategyName={smsPreview?.strategyName ?? ''}
        message={smsPreview?.message ?? ''}
        onClose={() => setSmsPreview(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  stressSection: {
    gap: 8,
  },
  stressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  apiEnginePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[2],
    paddingBottom: BottomTabInset + roofiSpacing[6],
    gap: roofiSpacing[4],
  },
  editorCard: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: roofiSpacing[2],
  },
  sliderBlock: {
    gap: 2,
  },
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  matrixColName: {
    flex: 1,
    paddingRight: 8,
  },
  matrixColStat: {
    width: 52,
    textAlign: 'right',
  },
  strategyCard: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: roofiSpacing[2],
  },
  flexOne: { flex: 1 },
  statusRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expandToggle: {
    minHeight: 40,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: roofiRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedBody: {
    gap: 6,
    paddingTop: 4,
  },
  criteriaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  criterionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  highlightChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  regretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pressed: { opacity: 0.75 },
});
