import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  ImagePlus,
  Radar,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SegmentedPillBar,
  SmartInsightCard,
  ThreeZoneGaugeBar,
  TopBarHeader,
} from '@/components/design-system';
import { ThemedText } from '@/components/themed-text';
import { Button, Field, Heading, Label } from '@/components/ui';
import { Collapsible } from '@/components/ui/collapsible';
import {
  GLOSSARY_ITEMS,
  type EvidencePassportEntry,
} from '@/constants/pilot-data';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  roofiRadii,
  roofiSpacing,
} from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/lib/toast';
import {
  classifyPlotImageUri,
  type PlotVisionPrediction,
} from '@/lib/vision-classifier';

type TierFilter = 'all' | 'data' | 'science' | 'hypothesis';

const TIER_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'data', label: 'Data' },
  { id: 'science', label: 'Science' },
  { id: 'hypothesis', label: 'Hypoth.' },
] as const;

const EVIDENCE_TIER_LABELS: Record<
  EvidencePassportEntry['evidenceTier'],
  string
> = {
  established_science: 'Established science',
  data_derived_finding: 'Data-derived',
  farmer_reported_observation: 'Farmer-reported',
  unverified_hypothesis: 'Unverified hypothesis',
  expert_validated_insight: 'Expert-validated',
};

const CONFIDENCE_BY_TIER: Record<
  EvidencePassportEntry['evidenceTier'],
  number
> = {
  expert_validated_insight: 92,
  established_science: 86,
  data_derived_finding: 74,
  farmer_reported_observation: 58,
  unverified_hypothesis: 42,
};

const SEASON_NAME_OPTIONS = [
  { id: 'Major', label: 'Major' },
  { id: 'Minor', label: 'Minor' },
  { id: 'Dry', label: 'Dry' },
] as const;

const COVER_OPTIONS = [
  { id: 'Intact', label: 'Good cover' },
  { id: 'Partial', label: 'Partial' },
  { id: 'Bare', label: 'Bare soil' },
] as const;

const WATER_STRESS_OPTIONS = [
  { id: 'None', label: 'No stress' },
  { id: 'Mild', label: 'Mild wilt' },
  { id: 'Severe', label: 'Severe dry' },
] as const;

const YIELD_SIGNAL_OPTIONS = [
  { id: 'Strong', label: 'Good yield' },
  { id: 'Average', label: 'Normal' },
  { id: 'Stressed', label: 'Low yield' },
] as const;

export default function PassportScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const {
    selectedCell,
    passports,
    dataSourceMode,
    logFieldOutcome,
  } = usePilotState();
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [seasonName, setSeasonName] = useState<'Major' | 'Minor' | 'Dry'>(
    'Major',
  );
  const [soilCover, setSoilCover] = useState<'Intact' | 'Partial' | 'Bare'>(
    'Intact',
  );
  const [waterStress, setWaterStress] = useState<'None' | 'Mild' | 'Severe'>(
    'None',
  );
  const [yieldSignal, setYieldSignal] = useState<
    'Strong' | 'Average' | 'Stressed'
  >('Average');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [scanUri, setScanUri] = useState<string | null>(null);
  const [scanPrediction, setScanPrediction] =
    useState<PlotVisionPrediction | null>(null);
  const [isScanningPlot, setIsScanningPlot] = useState(false);

  const handleScanPlot = async (source: 'camera' | 'library') => {
    setIsScanningPlot(true);
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          toast.warning('Camera permission needed');
          return;
        }
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.5,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.5,
            });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const uri = result.assets[0].uri;
      setScanUri(uri);
      const prediction = await classifyPlotImageUri(uri);
      if (prediction) {
        setScanPrediction(prediction);
        setSoilCover(prediction.soilCover);
        setWaterStress(prediction.waterStressHint);
      }
    } finally {
      setIsScanningPlot(false);
    }
  };

  const handleSubmitOutcome = async () => {
    const trimmed = outcomeNotes.trim();
    const summaryText = trimmed
      ? `${yieldSignal} outcome — ${trimmed}`
      : `${yieldSignal} outcome (${seasonName} season, ${soilCover.toLowerCase()} cover, ${waterStress.toLowerCase()} water stress)`;
    const res = await logFieldOutcome({
      seasonYear: 2026,
      seasonName,
      outcomeSummary: summaryText,
      soilCoverObserved: soilCover,
      waterStressObserved: waterStress,
      pestOrDiseaseNotes: null,
    });
    setOutcomeNotes('');
    setScanUri(null);
    setScanPrediction(null);
    if (res.status === 'submitted') {
      toast.success('Report submitted', 'Saved to field log.');
    } else {
      toast.warning('Saved offline', 'Will sync when online.');
    }
  };

  const visiblePassports = passports.filter((ep) => {
    if (tierFilter === 'data') return ep.evidenceTier === 'data_derived_finding';
    if (tierFilter === 'science')
      return ep.evidenceTier === 'established_science';
    if (tierFilter === 'hypothesis')
      return ep.evidenceTier === 'unverified_hypothesis';
    return true;
  });

  const sourceLabel =
    dataSourceMode === 'supabase'
      ? 'Live Supabase'
      : dataSourceMode === 'cached'
        ? 'Offline Cache'
        : 'Ashanti Bundle';

  const roleLabel =
    session?.role === 'extension_officer'
      ? 'Officer'
      : session?.role === 'agronomist'
        ? 'Agronomist'
        : 'Farmer';
  const isOfficer =
    session?.role === 'extension_officer' || session?.role === 'agronomist';

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title={isOfficer ? 'Evidence Passports' : 'Scan My Plot'}
        subtitle={`${selectedCell.zoneName} · ${roleLabel}`}
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
        rightActions={
          isOfficer
            ? [
                {
                  id: 'reset-tier',
                  icon: {
                    ios: 'shield.checkered',
                    android: 'verified_user',
                    web: 'verified_user',
                  },
                  onPress: () => setTierFilter('all'),
                  accessibilityLabel: 'Show all evidence tiers',
                },
                {
                  id: 'sign-out',
                  icon: {
                    ios: 'rectangle.portrait.and.arrow.right',
                    android: 'logout',
                    web: 'logout',
                  },
                  onPress: () => void signOut(),
                  accessibilityLabel: 'Sign out and switch role',
                },
              ]
            : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {isOfficer ? (
          <>
            <SegmentedPillBar
              options={TIER_FILTER_OPTIONS}
              selectedId={tierFilter}
              onSelect={setTierFilter}
            />

            {visiblePassports.map((passport) => {
          const isHypothesis =
            passport.evidenceTier === 'unverified_hypothesis';
          const isDataDerived =
            passport.evidenceTier === 'data_derived_finding';
          const pillBg = isHypothesis
            ? theme.gold.surface
            : isDataDerived
              ? theme.personal.surface
              : theme.sage.surface;
          const pillFg = isHypothesis
            ? theme.gold.ink
            : isDataDerived
              ? theme.personal.ink
              : theme.sage.ink;

          return (
            <View
              key={passport.id}
              style={[
                styles.passportCard,
                CardShadow,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <View style={styles.cardHeader}>
                <ThemedText type="sectionTitle" style={styles.flexOne}>
                  {passport.title}
                </ThemedText>
                <View style={[styles.tierPill, { backgroundColor: pillBg }]}>
                  {isHypothesis ? (
                    <AlertTriangle size={12} color={pillFg} />
                  ) : isDataDerived ? (
                    <Radar size={12} color={pillFg} />
                  ) : (
                    <BadgeCheck size={12} color={pillFg} />
                  )}
                  <ThemedText type="code" style={{ color: pillFg }}>
                    {EVIDENCE_TIER_LABELS[passport.evidenceTier].toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="default" themeColor="secondary">
                {passport.observationSummary}
              </ThemedText>

              <View style={styles.datasetChipsRow}>
                {passport.datasetsUsed.map((ds) => (
                  <View
                    key={ds}
                    style={[
                      styles.datasetChip,
                      { backgroundColor: theme.surfaceSubtle },
                    ]}>
                    <ThemedText type="code" themeColor="secondary">
                      {ds}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <ThreeZoneGaugeBar
                label="Evidence strength & uncertainty"
                scorePercent={CONFIDENCE_BY_TIER[passport.evidenceTier]}
                zoneLabels={['Hypothesis', 'Data-derived', 'Validated']}
              />

              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />

              <ThemedText type="small" themeColor="secondary">
                Coverage: {passport.spatialTemporalCoverage}
              </ThemedText>
              <ThemedText type="small" themeColor="secondary">
                Scale honesty: {passport.scaleHonestyNote}
              </ThemedText>

              <SmartInsightCard
                icon={{
                  ios: isHypothesis ? 'exclamationmark.triangle' : 'leaf',
                  android: isHypothesis ? 'warning' : 'eco',
                  web: isHypothesis ? 'warning' : 'eco',
                }}
                category="REQUIRED LOCAL REVIEW"
                headline={passport.requiredLocalReview[0]}
                footer={`Info gap: ${passport.informationGaps[0]}`}
                tone={isHypothesis ? 'amber' : 'green'}
              />
            </View>
          );
        })}
          </>
        ) : null}

        <View style={styles.glossaryHeader}>
          <Heading title="Plain-Language Glossary" />
          <View
            style={[
              styles.countBadge,
              { backgroundColor: theme.surfaceSubtle },
            ]}>
            <ThemedText type="code" themeColor="secondary">
              TAP TO EXPAND
            </ThemedText>
          </View>
        </View>

        <View style={styles.glossaryList}>
          {GLOSSARY_ITEMS.map((entry) => (
            <Collapsible key={entry.term} title={entry.term}>
              <View style={styles.glossaryBody}>
                <ThemedText type="default">{entry.plainMeaning}</ThemedText>
                <ThemedText type="small" themeColor="secondary">
                  Why it matters: {entry.whyItMatters}
                </ThemedText>
              </View>
            </Collapsible>
          ))}
        </View>

        <View
          style={[
            styles.passportCard,
            CardShadow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowOutcomeForm((v) => !v)}
            style={styles.cardHeader}>
            <View style={styles.flexOne}>
              <Label>EXTENSION OFFICER VERIFICATION</Label>
              <ThemedText type="sectionTitle">
                Submit Field Outcome Check
              </ThemedText>
              <ThemedText type="small" themeColor="mutedText">
                Saved for extension-officer review before model recalibration
              </ThemedText>
            </View>
            <View
              style={[
                styles.reportChip,
                { backgroundColor: theme.personal.surface },
              ]}>
              <ThemedText type="code" style={{ color: theme.personal.ink }}>
                {showOutcomeForm ? 'HIDE' : 'REPORT'}
              </ThemedText>
            </View>
          </Pressable>

          {showOutcomeForm && (
            <View style={styles.outcomeBody}>
              <Label>
                SEASON &amp; GROUND COVER OBSERVED ({selectedCell.cellId})
              </Label>

              <View style={styles.visionScanRow}>
                <Pressable
                  onPress={() => void handleScanPlot('camera')}
                  disabled={isScanningPlot}
                  style={({ pressed }) => [
                    styles.visionScanBtn,
                    {
                      backgroundColor: theme.personal.surface,
                      borderColor: theme.border,
                      opacity: pressed || isScanningPlot ? 0.72 : 1,
                    },
                  ]}>
                  <Camera size={16} color={theme.personal.ink} />
                  <ThemedText
                    type="smallBold"
                    style={{ color: theme.personal.ink }}>
                    {isScanningPlot ? 'Scanning…' : 'Scan Plot (Camera)'}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => void handleScanPlot('library')}
                  disabled={isScanningPlot}
                  style={({ pressed }) => [
                    styles.visionScanBtn,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                      opacity: pressed || isScanningPlot ? 0.72 : 1,
                    },
                  ]}>
                  <ImagePlus size={16} color={theme.foreground} />
                  <ThemedText type="smallBold">Photo</ThemedText>
                </Pressable>
              </View>

              {scanUri && scanPrediction && (
                <View
                  style={[
                    styles.visionResultCard,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Image
                    source={{ uri: scanUri }}
                    style={styles.visionThumb}
                    contentFit="cover"
                  />
                  <View style={styles.visionResultText}>
                    <ThemedText type="smallBold">
                      On-device scan: {scanPrediction.soilCover} cover (
                      {Math.round(scanPrediction.confidence * 100)}% conf ·{' '}
                      {scanPrediction.inferenceMs}ms)
                    </ThemedText>
                    <ThemedText type="code" style={{ color: theme.secondary }}>
                      Canopy {scanPrediction.canopyPct}% · Mulch{' '}
                      {scanPrediction.mulchPct}% · Bare {scanPrediction.barePct}%
                    </ThemedText>
                  </View>
                </View>
              )}

              <SegmentedPillBar
                options={SEASON_NAME_OPTIONS}
                selectedId={seasonName}
                onSelect={(id) =>
                  setSeasonName(id as 'Major' | 'Minor' | 'Dry')
                }
              />
              <SegmentedPillBar
                options={COVER_OPTIONS}
                selectedId={soilCover}
                onSelect={(id) =>
                  setSoilCover(id as 'Intact' | 'Partial' | 'Bare')
                }
              />
              <SegmentedPillBar
                options={WATER_STRESS_OPTIONS}
                selectedId={waterStress}
                onSelect={(id) =>
                  setWaterStress(id as 'None' | 'Mild' | 'Severe')
                }
              />
              <SegmentedPillBar
                options={YIELD_SIGNAL_OPTIONS}
                selectedId={yieldSignal}
                onSelect={(id) =>
                  setYieldSignal(id as 'Strong' | 'Average' | 'Stressed')
                }
              />
              <Field
                label="Field Observation Notes"
                value={outcomeNotes}
                onChangeText={setOutcomeNotes}
                placeholder="Optional notes (e.g., Cowpea relay kept soil moist)"
                multiline
                style={styles.outcomeInput}
              />
              <Button
                title="Submit Field Observation"
                onPress={() => void handleSubmitOutcome()}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[2],
    paddingBottom: BottomTabInset + roofiSpacing[6],
    gap: roofiSpacing[4],
  },
  passportCard: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: roofiSpacing[2],
  },
  flexOne: { flex: 1, gap: 2 },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  datasetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  datasetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  glossaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  glossaryList: {
    gap: 10,
  },
  glossaryBody: {
    gap: 6,
  },
  reportChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  outcomeBody: {
    gap: 12,
    paddingTop: 6,
  },
  visionScanRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visionScanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: roofiRadii.md,
    borderWidth: 1,
  },
  visionResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: roofiRadii.md,
    borderWidth: 1,
  },
  visionThumb: {
    width: 48,
    height: 48,
    borderRadius: roofiRadii.sm,
  },
  visionResultText: {
    flex: 1,
    gap: 2,
  },
  outcomeInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
});
