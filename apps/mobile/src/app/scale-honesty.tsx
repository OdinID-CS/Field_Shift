import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlannerIcon } from '@/components/icons';
import { ScaleFootprintDiagram } from '@/components/scale-footprint-diagram';
import { ThemedText } from '@/components/themed-text';
import { Button, Heading, Label } from '@/components/ui';
import {
  DEFAULT_FARM_AREA_HA,
  evaluateMobileScaleHonesty,
  type ScaleHonestyEntry,
} from '@/constants/pilot-data';
import {
  CardShadow,
  MaxContentWidth,
  roofiRadii,
  roofiSpacing,
  roofiTypography,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';

const TIER_LABELS: Record<ScaleHonestyEntry['advisoryTier'], string> = {
  field_scale: 'Field scale',
  sub_regional: 'Sub-regional',
  regional_context_only: 'Regional context',
};

const FARM_SIZE_PRESETS = [0.5, 2.0, 5.0, 10.0, 25.0];

export default function ScaleHonestyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedCell, farmAreaHa, setFarmAreaHa } = usePilotState();

  const safeHa = Math.max(0.5, farmAreaHa);
  const farmKm2 = safeHa / 100;
  const scaleAssessment = evaluateMobileScaleHonesty(safeHa);
  const fieldScaleCount = scaleAssessment.filter((e) => e.resolvesFarm).length;
  const hlsPixelCount = Math.max(1, Math.round(safeHa / 0.09));
  const smapEquivalentFarms = Math.max(1, Math.round(8100 / safeHa));

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSelectPresetHa = (ha: number) => {
    setFarmAreaHa(ha);
  };

  const handleStepHa = (delta: number) => {
    const nextHa = Math.max(0.5, Number((safeHa + delta).toFixed(1)));
    setFarmAreaHa(nextHa);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Dedicated Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={handleBack}
          style={({ pressed }) => [
            styles.iconCircle,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            pressed && styles.pressed,
          ]}>
          <PlannerIcon name="back" size={18} color={theme.foreground} />
        </Pressable>

        <View style={styles.topBarTitleCol}>
          <Label>SPATIAL RESOLUTION AUDIT · {selectedCell.cellId}</Label>
          <Heading title="Scale Honesty" />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset farm area to 2.0 hectares"
          onPress={() => handleSelectPresetHa(DEFAULT_FARM_AREA_HA)}
          style={({ pressed }) => [
            styles.resetPill,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.resetPillText, { color: theme.secondary }]}>
            Reset 2 ha
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Interactive Farm Parcel Size Selector Card */}
        <View
          style={[
            styles.card,
            CardShadow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.parcelTopRow}>
            <View style={styles.flexOne}>
              <Label>YOUR FARM PARCEL</Label>
              <View style={styles.parcelValueRow}>
                <Text
                  style={[styles.parcelBigValue, { color: theme.foreground }]}>
                  {safeHa.toFixed(1)} ha
                </Text>
                <View
                  style={[
                    styles.kmBadge,
                    { backgroundColor: theme.surfaceSubtle },
                  ]}>
                  <Text
                    style={[styles.kmBadgeText, { color: theme.secondary }]}>
                    {farmKm2.toFixed(3)} km²
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.stepperGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease farm area"
                onPress={() => handleStepHa(-0.5)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">−</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase farm area"
                onPress={() => handleStepHa(0.5)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: theme.onPrimary }}>
                  +
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Quick-Select Hectare Presets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}>
            {FARM_SIZE_PRESETS.map((presetHa) => {
              const active = Math.abs(safeHa - presetHa) < 0.05;
              return (
                <Pressable
                  key={presetHa}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => handleSelectPresetHa(presetHa)}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: active
                        ? theme.foreground
                        : theme.surfaceSubtle,
                      borderColor: active ? theme.foreground : theme.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.presetChipText,
                      {
                        color: active ? theme.background : theme.secondary,
                      },
                    ]}>
                    {presetHa.toFixed(1)} ha
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 3-Metric Quick Summary Strip */}
          <View
            style={[
              styles.metricsStrip,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.metricCell}>
              <Text style={[styles.metricValue, { color: theme.sage.ink }]}>
                {fieldScaleCount}/{scaleAssessment.length}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.secondary }]}>
                Field Sensors
              </Text>
            </View>
            <View
              style={[
                styles.metricDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <View style={styles.metricCell}>
              <Text style={[styles.metricValue, { color: theme.personal.ink }]}>
                ~{hlsPixelCount} px
              </Text>
              <Text style={[styles.metricLabel, { color: theme.secondary }]}>
                30 m HLS / Soil
              </Text>
            </View>
            <View
              style={[
                styles.metricDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <View style={styles.metricCell}>
              <Text style={[styles.metricValue, { color: theme.gold.ink }]}>
                1 : {smapEquivalentFarms.toLocaleString()}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.secondary }]}>
                9 km SMAP Box
              </Text>
            </View>
          </View>
        </View>

        {/* Concentric SMAP / DEM / HLS / Farm Footprint Diagram */}
        <View
          style={[
            styles.card,
            CardShadow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <ScaleFootprintDiagram farmAreaHa={safeHa} />
        </View>

        {/* Full 7-Dataset Sensor Audit */}
        <View style={styles.sectionHeader}>
          <Heading title="Sensor Resolution Breakdown" />
          <View
            style={[
              styles.countBadge,
              { backgroundColor: theme.surfaceSubtle },
            ]}>
            <ThemedText type="code" themeColor="secondary">
              {scaleAssessment.length} DATASETS
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.card,
            CardShadow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          {scaleAssessment.map((entry, idx) => {
            const isField = entry.resolvesFarm;
            const isSubRegional = entry.advisoryTier === 'sub_regional';
            const resLabel =
              entry.nativeResolutionKm < 1
                ? `${Math.round(entry.nativeResolutionKm * 1000)} m`
                : `${entry.nativeResolutionKm} km`;
            const pixelAreaLabel =
              entry.pixelAreaKm2 < 0.01
                ? `${(entry.pixelAreaKm2 * 100).toFixed(2)} ha/px`
                : `${entry.pixelAreaKm2.toFixed(0)} km²/px`;

            const badgeBg = isField
              ? theme.sage.surface
              : isSubRegional
                ? theme.personal.surface
                : theme.gold.surface;
            const badgeFg = isField
              ? theme.sage.ink
              : isSubRegional
                ? theme.personal.ink
                : theme.gold.ink;

            return (
              <View
                key={entry.dataset}
                style={[
                  styles.sensorItem,
                  idx > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    paddingTop: 14,
                  },
                ]}>
                <View style={styles.sensorTopRow}>
                  <View style={styles.flexOne}>
                    <ThemedText type="smallBold">{entry.dataset}</ThemedText>
                    <View style={styles.sensorChipsRow}>
                      <View
                        style={[
                          styles.resChip,
                          { backgroundColor: theme.surfaceSubtle },
                        ]}>
                        <Text
                          style={[
                            styles.resChipText,
                            { color: theme.foreground },
                          ]}>
                          {resLabel} pixel
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.pixelAreaText,
                          { color: theme.mutedText },
                        ]}>
                        {pixelAreaLabel}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[styles.scaleBadge, { backgroundColor: badgeBg }]}>
                    <ThemedText type="code" style={{ color: badgeFg }}>
                      {TIER_LABELS[entry.advisoryTier]}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="small" themeColor="secondary">
                  {entry.note}
                </ThemedText>
              </View>
            );
          })}
        </View>

        <Button title="Back to Field Pulse" onPress={handleBack} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[2],
    paddingBottom: roofiSpacing[3],
    gap: roofiSpacing[3],
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCol: {
    flex: 1,
    gap: 2,
  },
  resetPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  resetPillText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[1],
    paddingBottom: roofiSpacing[8],
    gap: roofiSpacing[4],
  },
  card: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: roofiSpacing[3],
  },
  parcelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: roofiSpacing[2],
  },
  flexOne: {
    flex: 1,
    gap: 4,
  },
  parcelValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parcelBigValue: {
    fontFamily: roofiTypography.fontFamily.displayMedium,
    fontSize: 28,
    lineHeight: 32,
  },
  kmBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  kmBadgeText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 12,
    fontWeight: '500',
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetsRow: {
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  presetChipText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 12,
    fontWeight: '500',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: roofiRadii.lg,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricDivider: {
    width: 1,
    height: 26,
  },
  metricValue: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 14,
    fontWeight: '500',
  },
  metricLabel: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  sensorItem: {
    gap: 6,
  },
  sensorTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: roofiSpacing[2],
  },
  sensorChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  resChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: roofiRadii.pill,
  },
  resChipText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
    fontWeight: '500',
  },
  pixelAreaText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
  },
  scaleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  pressed: { opacity: 0.75 },
});
