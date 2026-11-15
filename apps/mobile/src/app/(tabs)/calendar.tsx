import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DekadHeatmapMatrix } from '@/components/dekad-heatmap-matrix';
import { PlannerIcon } from '@/components/icons';
import {
  type ChartPoint,
  HeroStatusCard,
  InteractiveAreaChartCard,
  SegmentedPillBar,
  TopBarHeader,
} from '@/components/design-system';
import { ThemedText } from '@/components/themed-text';
import { Heading } from '@/components/ui';
import { SEASONAL_VULNERABILITY_CALENDAR } from '@/constants/pilot-data';
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

type CalendarFilter = 'all' | 'bare' | 'cloud' | 'windows';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Windows' },
  { id: 'bare', label: 'Bare Risk' },
  { id: 'cloud', label: 'Cloud QA' },
  { id: 'windows', label: 'Dekad Windows' },
] as const;

const QA_TIER_LABELS = {
  high: 'QA: High clear-sky',
  moderate: 'QA: Moderate',
  low_cloud_gap: 'QA: Cloud-gap fill',
} as const;

const TEMP_BY_MONTH = [33, 35, 34, 31, 29, 27, 27, 28, 29, 29, 31, 32];
const ET0_BY_MONTH = [138, 140, 144, 130, 122, 112, 114, 118, 118, 120, 126, 132];

type ChartSectionKey = 'rain' | 'moisture' | 'temperature';

function CollapsibleChartSection({
  title,
  metricValue,
  summary,
  accentColor,
  span = 'full',
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  metricValue: string;
  summary: string;
  accentColor: string;
  span?: 'half' | 'full';
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [anim, isOpen]);

  const chevronRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const bodyTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const bodyScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  const isFullWidth = isOpen || span === 'full';

  return (
    <View
      style={[
        styles.windowCard,
        styles.bentoTile,
        CardShadow,
        {
          flexBasis: isFullWidth ? '100%' : '48%',
          backgroundColor: theme.surface,
          borderColor: isOpen ? accentColor : theme.border,
          borderWidth: isOpen ? 1.5 : 1,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.chartAccordionHeader,
          { opacity: pressed ? 0.8 : 1 },
        ]}>
        <View style={styles.bentoHeaderTop}>
          <View style={styles.chartTitleRow}>
            <View style={[styles.chartDot, { backgroundColor: accentColor }]} />
            <ThemedText
              type="small"
              themeColor="mutedText"
              style={styles.bentoMetaText}
              numberOfLines={1}>
              {metricValue}
            </ThemedText>
          </View>
          <View
            style={[
              styles.chartTogglePill,
              { backgroundColor: theme.surfaceSubtle },
            ]}>
            <ThemedText
              type="small"
              themeColor="secondary"
              style={styles.bentoMetaText}>
              {isOpen ? 'HIDE' : 'VIEW'}
            </ThemedText>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <PlannerIcon name="chevron" size={14} color={theme.secondary} />
            </Animated.View>
          </View>
        </View>

        <View style={styles.bentoTitleBlock}>
          <ThemedText
            type="default"
            style={styles.bentoTitleText}
            numberOfLines={2}>
            {title}
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="mutedText"
            style={styles.bentoSummaryText}
            numberOfLines={1}>
            {summary}
          </ThemedText>
        </View>
      </Pressable>

      {isOpen && (
        <Animated.View
          style={[
            styles.chartBodyWrap,
            {
              opacity: anim,
              transform: [{ translateY: bodyTranslateY }, { scale: bodyScale }],
            },
          ]}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

export default function CalendarScreen() {
  const theme = useTheme();
  const { cells, selectedCell, selectCell } = usePilotState();
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [openCharts, setOpenCharts] = useState<Record<ChartSectionKey, boolean>>({
    rain: false,
    moisture: false,
    temperature: false,
  });

  const toggleChart = (key: ChartSectionKey) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setOpenCharts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cycleCell = () => {
    const idx = cells.findIndex((c) => c.cellId === selectedCell.cellId);
    const next = cells[(idx + 1) % cells.length];
    selectCell(next.cellId);
    toast.info(
      `Cell ${next.cellId}`,
      `${next.zoneName} · 36-dekad vulnerability calendar`,
    );
  };

  const handleFilterSelect = (nextFilter: CalendarFilter) => {
    setFilter(nextFilter);
  };

  const filteredWindows = SEASONAL_VULNERABILITY_CALENDAR.filter((item) => {
    if (filter === 'bare') return item.bareFieldRisk;
    if (filter === 'cloud') return item.qaTier === 'low_cloud_gap';
    return true;
  });

  const bareCount = SEASONAL_VULNERABILITY_CALENDAR.filter(
    (item) => item.bareFieldRisk,
  ).length;

  const moistureChartPoints: ChartPoint[] = SEASONAL_VULNERABILITY_CALENDAR.map(
    (w) => ({
      xLabel: w.monthLabel,
      value: Math.round(w.ndviSmooth * 100),
      calloutTitle: `${w.monthLabel} ${w.dekadRange}`,
    }),
  );

  const tempChartPoints: ChartPoint[] = SEASONAL_VULNERABILITY_CALENDAR.map(
    (w, idx) => ({
      xLabel: w.monthLabel,
      value: TEMP_BY_MONTH[idx],
      calloutTitle: `${w.monthLabel} Tmax`,
    }),
  );

  const rainEt0BarData = SEASONAL_VULNERABILITY_CALENDAR.flatMap((w, idx) => [
    {
      value: w.rainMm,
      label: w.monthLabel,
      spacing: 2,
      labelWidth: 26,
      frontColor: w.bareFieldRisk ? theme.primary : theme.sage.edge,
    },
    {
      value: ET0_BY_MONTH[idx],
      frontColor: theme.pair.edge,
    },
  ]);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title={selectedCell.zoneName.split(' ')[0]}
        subtitle={`${selectedCell.soilTexture} · ${selectedCell.cellId}`}
        leftAction={{
          id: 'cycle-cell',
          icon: {
            ios: 'chevron.left',
            android: 'arrow_back',
            web: 'arrow_back',
          },
          onPress: cycleCell,
          accessibilityLabel: 'Switch pilot cell',
        }}
        rightActions={[
          {
            id: 'reset-filter',
            icon: {
              ios: 'ellipsis',
              android: 'more_vert',
              web: 'more_vert',
            },
            onPress: () => setFilter('all'),
            accessibilityLabel: 'Reset calendar filter',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SegmentedPillBar
          options={FILTER_OPTIONS}
          selectedId={filter}
          onSelect={handleFilterSelect}
        />

        {filter !== 'windows' ? (
          <>
            <DekadHeatmapMatrix windows={filteredWindows} />

            <HeroStatusCard
          value="67"
          unit="%"
          deltaText={
            filter === 'bare'
              ? `↓ ${bareCount} bare months exposed`
              : '↑ +14% vs dry baseline'
          }
          statusLabel={filter === 'bare' ? 'Bare Risk' : 'Optimal'}
          statusTone={filter === 'bare' ? 'warning' : 'optimal'}
          subtitle="Canopy Greenness & Moisture Window"
          metaLeft={selectedCell.cellId}
          metaRight="36-DEKAD BASELINE"
        />

        <View style={styles.sectionRow}>
          <Heading title="Climate & Canopy Charts" />
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

        <View style={styles.bentoGrid}>
          <CollapsibleChartSection
            title="Vegetation Cover & Moisture"
            metricValue="46% AVG"
            summary="MIN 22% · MAX 72%"
            accentColor="#1FB26B"
            span="half"
            isOpen={openCharts.moisture}
            onToggle={() => toggleChart('moisture')}>
            <InteractiveAreaChartCard
              title="Vegetation Cover & Moisture"
              points={moistureChartPoints}
              unit="%"
              colorTone="green"
              statChips={['Avg 46%', 'Min 22%', 'Max 72%']}
              yMin={0}
              yMax={100}
              yTickCount={4}
            />
          </CollapsibleChartSection>

          <CollapsibleChartSection
            title="Air & Surface Temperature"
            metricValue="30°C AVG"
            summary="MIN 27°C · MAX 35°C"
            accentColor="#F9D601"
            span="half"
            isOpen={openCharts.temperature}
            onToggle={() => toggleChart('temperature')}>
            <InteractiveAreaChartCard
              title="Air & Surface Temperature"
              points={tempChartPoints}
              unit="°C"
              colorTone="amber"
              statChips={['Avg 30°C', 'Min 27°C', 'Max 35°C']}
              yMin={20}
              yMax={40}
              yTickCount={4}
            />
          </CollapsibleChartSection>

          <CollapsibleChartSection
            title="Rainfall vs. ET₀ Demand"
            metricValue="1,426 MM/YR"
            summary="MM / MONTH · WET VS BARE DIP"
            accentColor={theme.sage.ink}
            span="full"
            isOpen={openCharts.rain}
            onToggle={() => toggleChart('rain')}>
            <View style={styles.statChipsRow}>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.sage.surface },
                ]}>
                <ThemedText type="code" style={{ color: theme.sage.ink }}>
                  Rain (Wet)
                </ThemedText>
              </View>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.personal.surface },
                ]}>
                <ThemedText type="code" style={{ color: theme.personal.ink }}>
                  Rain (Bare Dip)
                </ThemedText>
              </View>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.pair.surface },
                ]}>
                <ThemedText type="code" style={{ color: theme.pair.ink }}>
                  ET₀ Demand
                </ThemedText>
              </View>
            </View>
            <BarChart
              data={rainEt0BarData}
              barWidth={8}
              spacing={12}
              roundedTop
              hideRules
              noOfSections={4}
              maxValue={240}
              height={145}
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{
                color: theme.mutedText,
                fontFamily: roofiTypography.fontFamily.body,
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: theme.secondary,
                fontFamily: roofiTypography.fontFamily.body,
                fontSize: 10,
              }}
            />
          </CollapsibleChartSection>
        </View>
          </>
        ) : (
          <>
            <View style={styles.sectionRow}>
              <Heading title="Dekad Windows" />
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: theme.surfaceSubtle },
                ]}>
                <ThemedText type="code" themeColor="secondary">
                  {filteredWindows.length} · NDVI &lt; 0.28 BARE
                </ThemedText>
              </View>
            </View>

            {filteredWindows.map((win) => (
          <View
            key={win.id}
            style={[
              styles.windowCard,
              CardShadow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderLeftWidth: win.bareFieldRisk ? 4 : 1,
                borderLeftColor: win.bareFieldRisk
                  ? theme.primary
                  : theme.border,
              },
            ]}>
            <View style={styles.windowTopRow}>
              <View style={styles.flexOne}>
                <ThemedText type="sectionTitle">
                  {win.monthLabel} · {win.dekadRange}
                </ThemedText>
                <ThemedText type="small" themeColor="secondary">
                  {win.seasonLabel}
                </ThemedText>
              </View>

              <View style={styles.badgeColumn}>
                {win.bareFieldRisk && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: theme.personal.surface },
                    ]}>
                    <ThemedText
                      type="code"
                      style={{ color: theme.personal.ink }}>
                      BARE RISK
                    </ThemedText>
                  </View>
                )}
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.surfaceSubtle },
                  ]}>
                  <ThemedText type="code" themeColor="secondary">
                    {QA_TIER_LABELS[win.qaTier]}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.statChipsRow}>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.surfaceSubtle },
                ]}>
                <ThemedText type="code" themeColor="secondary">
                  Rain {win.rainMm} mm ({win.rainReliability})
                </ThemedText>
              </View>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.surfaceSubtle },
                ]}>
                <ThemedText type="code" themeColor="secondary">
                  SMAP z={win.smapAnomalyZ >= 0 ? '+' : ''}
                  {win.smapAnomalyZ.toFixed(2)}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.sage.surface },
                ]}>
                <ThemedText type="code" style={{ color: theme.sage.ink }}>
                  NDVI {win.ndviSmooth.toFixed(2)}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="default" themeColor="secondary">
              {win.summaryNote}
            </ThemedText>
          </View>
        ))}
          </>
        )}
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
  sectionRow: {
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
  windowCard: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  windowTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: roofiSpacing[2],
  },
  flexOne: { flex: 1, gap: 2 },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bentoTile: {
    flexGrow: 1,
    minWidth: 150,
  },
  chartAccordionHeader: {
    gap: 10,
  },
  bentoHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  bentoTitleBlock: {
    gap: 3,
  },
  bentoTitleText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 21,
  },
  bentoMetaText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '400',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  bentoSummaryText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '400',
    fontSize: 12,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  chartBodyWrap: {
    paddingTop: 6,
    gap: 10,
  },
});
