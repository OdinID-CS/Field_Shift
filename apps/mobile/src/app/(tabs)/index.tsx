import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  KpiMetricCard,
  SmartInsightCard,
  TopSearchRegionHeader,
} from '@/components/design-system';
import { PlannerIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Heading, Label } from '@/components/ui';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  roofiRadii,
  roofiSpacing,
  roofiTypography,
} from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/lib/toast';

const CELL_METRICS: Record<
  string,
  {
    soilMoisturePct: string;
    airTempC: string;
    soilTempC: string;
    canopyPct: string;
    insight: string;
  }
> = {
  ASH_R05_C05: {
    soilMoisturePct: '52',
    airTempC: '29',
    soilTempC: '25',
    canopyPct: '67',
    insight:
      'Optimal major-season moisture in Ejura-Kumasi sandy clay loam — minor-season cowpea relay holds soil cover.',
  },
  ASH_R04_C04: {
    soilMoisturePct: '58',
    airTempC: '28',
    soilTempC: '24',
    canopyPct: '71',
    insight:
      'Higher upland rainfall (1,426 mm) increases runoff on 3.68% slopes — cover mulch strongly lowers soil wash.',
  },
  ASH_R06_C06: {
    soilMoisturePct: '47',
    airTempC: '30',
    soilTempC: '26',
    canopyPct: '62',
    insight:
      'Faster drainage in sandy loam soils calls for early drought-tolerant planting windows in late March.',
  },
  ASH_R05_C04: {
    soilMoisturePct: '54',
    airTempC: '29',
    soilTempC: '25',
    canopyPct: '69',
    insight:
      'Gentle 0.72% terrain slope in Akomadan-Offinso retains moisture well for maize-soybean relay sequences.',
  },
  ASH_R04_C05: {
    soilMoisturePct: '55',
    airTempC: '28',
    soilTempC: '24',
    canopyPct: '70',
    insight:
      'Rich 11.2 g/kg organic carbon in Sekyere Central supports high-residue mucuna cover during Harmattan.',
  },
};

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const isOfficer =
    session?.role === 'extension_officer' || session?.role === 'agronomist';
  const {
    cells,
    selectedCell,
    selectCell,
    strategies,
  } = usePilotState();

  const [plotMenuOpen, setPlotMenuOpen] = useState(false);

  const handleSelectCell = (cellId: string) => {
    selectCell(cellId);
    const target = cells.find((c) => c.cellId === cellId);
    if (target) {
      toast.info(`Plot: ${target.zoneName.split(' ')[0]}`);
    }
  };

  const kpis = CELL_METRICS[selectedCell.cellId] ?? CELL_METRICS.ASH_R05_C05;
  const topPlan = strategies.find((s) => !s.isBaseline) ?? strategies[0];

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopSearchRegionHeader
        regionCaption="Ashanti Region"
        regionName="Ghana"
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select plot"
            accessibilityState={{ expanded: plotMenuOpen }}
            onPress={() => setPlotMenuOpen((prev) => !prev)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 11,
              paddingVertical: 7,
              borderRadius: roofiRadii.pill,
              backgroundColor: theme.personal.surface,
              borderWidth: 1,
              borderColor: plotMenuOpen ? theme.primary : theme.personal.edge,
              opacity: pressed ? 0.75 : 1,
            })}>
            <PlannerIcon name="pin" size={13} color={theme.primary} />
            <Text
              style={{
                color: theme.personal.ink,
                fontFamily: roofiTypography.fontFamily.body,
                fontSize: 12.5,
                fontWeight: '600',
              }}>
              {selectedCell.zoneName.split(' ')[0]}
            </Text>
            <PlannerIcon name="chevron" size={12} color={theme.personal.ink} />
          </Pressable>
        }
      />

      {plotMenuOpen && (
        <View
          style={{
            paddingHorizontal: roofiSpacing[5],
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            backgroundColor: theme.surface,
            gap: 4,
          }}>
          {cells.map((cell) => {
            const selected = cell.cellId === selectedCell.cellId;
            const shortName = cell.zoneName.split(' ')[0];
            return (
              <Pressable
                key={cell.cellId}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  handleSelectCell(cell.cellId);
                  setPlotMenuOpen(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 10,
                  backgroundColor: selected
                    ? theme.surfaceSubtle
                    : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                })}>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: theme.foreground,
                      fontFamily: selected
                        ? roofiTypography.fontFamily.displayMedium
                        : roofiTypography.fontFamily.body,
                      fontSize: 13.5,
                      fontWeight: selected ? '600' : '400',
                    }}>
                    {shortName} · {cell.zoneName}
                  </Text>
                  <Text
                    style={{
                      color: theme.secondary,
                      fontFamily: roofiTypography.fontFamily.body,
                      fontSize: 11,
                    }}>
                    {cell.soilTexture} · pH {cell.soilPh}
                  </Text>
                </View>
                <Text
                  style={{
                    color: selected ? theme.primary : theme.secondary,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontSize: 12,
                    fontWeight: selected ? '600' : '400',
                  }}>
                  {selected ? 'Active' : cell.cellId.replace('ASH_', '')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KpiMetricCard
              icon={{
                ios: 'drop',
                android: 'water_drop',
                web: 'water_drop',
              }}
              value={kpis.soilMoisturePct}
              unit="%"
              label="Soil Moisture"
            />
            <KpiMetricCard
              icon={{
                ios: 'leaf',
                android: 'eco',
                web: 'eco',
              }}
              value={kpis.canopyPct}
              unit="%"
              label="Ground Cover"
            />
          </View>
          <View style={styles.kpiRow}>
            <KpiMetricCard
              icon={{
                ios: 'thermometer.medium',
                android: 'thermostat',
                web: 'thermostat',
              }}
              value={kpis.airTempC}
              unit="°C"
              label="Air Temp"
            />
            <KpiMetricCard
              icon={{
                ios: 'cloud.rain',
                android: 'water_drop',
                web: 'water_drop',
              }}
              value={`${selectedCell.typicalAnnualRainMm}`}
              unit=" mm"
              label="Typical Rain"
            />
          </View>
        </View>

        {topPlan ? (
          <View
            style={[
              styles.scaleLauncherCard,
              CardShadow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.scaleLauncherTop}>
              <View
                style={[
                  styles.scaleLauncherIconBox,
                  { backgroundColor: theme.sage.surface },
                ]}>
                <PlannerIcon name="zap" size={20} color={theme.sage.ink} />
              </View>
              <View style={styles.flexOne}>
                <Label>TOP SUGGESTED PLAN</Label>
                <ThemedText type="sectionTitle">{topPlan.name}</ThemedText>
                <ThemedText type="small" themeColor="secondary">
                  {topPlan.sequence}
                  {topPlan.expectedBenefits[0]
                    ? ` · ${topPlan.expectedBenefits[0].replace(
                        /Biological nitrogen fixation \(~30-60 kg N\/ha\) lowers urea dependence/i,
                        'Natural nitrogen saves ~1–2 urea bags/ha',
                      )}`
                    : ''}
                </ThemedText>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/chat')}
                style={({ pressed }) => [
                  styles.scaleLauncherBtn,
                  {
                    flex: 1,
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Text style={[styles.scaleLauncherBtnText, { color: '#FFFFFF' }]}>
                  Ask Chat
                </Text>
                <PlannerIcon name="chat" size={16} color="#FFFFFF" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/tools')}
                style={({ pressed }) => [
                  styles.scaleLauncherBtn,
                  {
                    flex: 1,
                    backgroundColor: theme.foreground,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.scaleLauncherBtnText,
                    { color: theme.background },
                  ]}>
                  Open Tools
                </Text>
                <PlannerIcon name="chevron" size={16} color={theme.background} />
              </Pressable>
            </View>
          </View>
        ) : null}
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
  workspaceSwitcherWrap: {
    gap: 10,
  },
  workspaceSwitcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workspaceRoleText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 12,
  },
  workspacePillsRow: {
    gap: 8,
  },
  workspacePill: {
    minHeight: 42,
    maxWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  workspaceInitialBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  workspaceInitialText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
    fontWeight: '500',
  },
  workspacePillLabel: {
    flexShrink: 1,
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 13,
    fontWeight: '500',
  },
  kpiGrid: {
    gap: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
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
  scaleLauncherCard: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  scaleLauncherTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  scaleLauncherIconBox: {
    width: 44,
    height: 44,
    borderRadius: roofiRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexOne: { flex: 1, gap: 3 },
  scaleLauncherPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scaleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  scaleLauncherBtn: {
    minHeight: 46,
    borderRadius: roofiRadii.pill,
    paddingHorizontal: roofiSpacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scaleLauncherBtnText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 13,
    fontWeight: '500',
  },
  pressed: { opacity: 0.75 },
});
