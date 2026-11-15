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
  const {
    cells,
    selectedCell,
    selectCell,
    strategies,
  } = usePilotState();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectCell = (cellId: string) => {
    selectCell(cellId);
    const target = cells.find((c) => c.cellId === cellId);
    if (target) {
      toast.info(
        `Switched to ${target.cellId}`,
        `${target.zoneName} · ${target.soilTexture} (pH ${target.soilPh})`,
      );
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    const trimmed = text.trim().toLowerCase();
    if (trimmed.length >= 2) {
      const match = cells.find(
        (c) =>
          c.cellId.toLowerCase().includes(trimmed) ||
          c.zoneName.toLowerCase().includes(trimmed) ||
          c.soilTexture.toLowerCase().includes(trimmed),
      );
      if (match && match.cellId !== selectedCell.cellId) {
        handleSelectCell(match.cellId);
      }
    }
  };

  const kpis = CELL_METRICS[selectedCell.cellId] ?? CELL_METRICS.ASH_R05_C05;
  const topPlan = strategies.find((s) => !s.isBaseline) ?? strategies[0];

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopSearchRegionHeader
        searchQuery={searchQuery}
        onChangeSearch={handleSearchChange}
        searchPlaceholder="Search soil, district, or cell"
        regionCaption="Ashanti Region"
        regionName="Ghana"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Autis Planner Horizontal Workspace / Cell Switcher */}
        <View style={styles.workspaceSwitcherWrap}>
          <View style={styles.workspaceSwitcherHeader}>
            <Label>PILOT WORKSPACE CELL</Label>
            <Text
              style={[
                styles.workspaceRoleText,
                { color: theme.secondary },
              ]}>
              {selectedCell.soilTexture} · pH {selectedCell.soilPh}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workspacePillsRow}>
            {cells.map((cell) => {
              const selected = cell.cellId === selectedCell.cellId;
              const shortDistrict = cell.zoneName.split(' ')[0];
              return (
                <Pressable
                  key={cell.cellId}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={cell.zoneName}
                  onPress={() => handleSelectCell(cell.cellId)}
                  style={[
                    styles.workspacePill,
                    {
                      backgroundColor: selected
                        ? theme.foreground
                        : theme.surface,
                      borderColor: selected ? theme.foreground : theme.border,
                    },
                  ]}>
                  <View
                    style={[
                      styles.workspaceInitialBox,
                      {
                        backgroundColor: selected
                          ? theme.surfaceSubtle
                          : theme.personal.surface,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.workspaceInitialText,
                        { color: theme.primary },
                      ]}>
                      {shortDistrict.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.workspacePillLabel,
                      {
                        color: selected
                          ? theme.background
                          : theme.foreground,
                      },
                    ]}>
                    {shortDistrict} · {cell.cellId.replace('ASH_', '')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <SmartInsightCard
          icon={{ ios: 'leaf', android: 'eco', web: 'eco' }}
          category="THIS WEEK ON YOUR FARM"
          headline={kpis.insight}
          footer={`${selectedCell.zoneName} · Major & Minor Rain Windows`}
          tone="green"
        />

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
                    ? ` · ${topPlan.expectedBenefits[0]}`
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
