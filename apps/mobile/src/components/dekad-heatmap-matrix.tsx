import { CloudRain, Sun } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Label } from '@/components/ui';
import type { DekadWindowSummary } from '@/constants/pilot-data';
import {
  CardShadow,
  roofiRadii,
  roofiSpacing,
  roofiTypography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DekadStepItem {
  dekadIndex: number; // 1..36
  code: string; // D01..D36
  numLabel: string; // 01..36
  daySpan: string;
  window: DekadWindowSummary;
  isCloudGap: boolean;
}

/**
 * All 36 dekads (12 months x 3 ten-day periods = D01..D36) rendered in
 * Autis Planner's horizontal calendar selection strip:
 * - Uppercase OliveDisplay-Bold active month + dekad badge (e.g. JAN · D01)
 * - Horizontal scrollable 36-dekad circle strip (01..36) with ring-only unselected state
 * - Selected dekad inspector with month context and summary note
 */
export function DekadHeatmapMatrix({
  windows,
}: {
  windows: DekadWindowSummary[];
}) {
  const theme = useTheme();

  const dekads = useMemo<DekadStepItem[]>(() => {
    const items: DekadStepItem[] = [];
    windows.forEach((win, monthIdx) => {
      for (let d = 0; d < 3; d++) {
        const dekadIndex = monthIdx * 3 + d + 1;
        items.push({
          dekadIndex,
          code: `D${String(dekadIndex).padStart(2, '0')}`,
          numLabel: String(dekadIndex).padStart(2, '0'),
          daySpan: d === 0 ? 'Days 1–10' : d === 1 ? 'Days 11–20' : 'Days 21–End',
          window: win,
          isCloudGap: win.qaTier === 'low_cloud_gap' && d === 1,
        });
      }
    });
    return items;
  }, [windows]);

  const [selectedDekadIndex, setSelectedDekadIndex] = useState<number>(1);
  const selectedDekad =
    dekads.find((item) => item.dekadIndex === selectedDekadIndex) ?? dekads[0];
  const fullMonthNames: Record<string, string> = {
    jan: 'January',
    feb: 'February',
    mar: 'March',
    apr: 'April',
    may: 'May',
    jun: 'June',
    jul: 'July',
    aug: 'August',
    sep: 'September',
    oct: 'October',
    nov: 'November',
    dec: 'December',
  };
  const activeMonthName =
    fullMonthNames[selectedDekad?.window.monthLabel.toLowerCase() ?? ''] ??
    selectedDekad?.window.monthLabel ??
    'January';

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      {/* Autis Planner Calendar Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Label>36-DEKAD EXPOSURE CALENDAR</Label>
          <View style={styles.monthHeadingRow}>
            <Text style={[styles.monthDisplayTitle, { color: theme.foreground }]}>
              {selectedDekad?.window.monthLabel.toUpperCase() ?? 'JAN'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.bareCountPill,
            { backgroundColor: theme.personal.surface },
          ]}>
          <Text style={[styles.bareCountText, { color: theme.personal.ink }]}>
            {activeMonthName} · {selectedDekad?.daySpan ?? 'Days 1–10'}
          </Text>
        </View>
      </View>

      {/* Horizontal Scrollable 36-Dekad Circle Strip (D01..D36) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}>
        {dekads.map((item) => {
          const active = item.dekadIndex === selectedDekadIndex;
          const isBare = item.window.bareFieldRisk;
          const hasRing = !active && (isBare || item.isCloudGap);
          const ringColor = isBare
            ? theme.gold.edge
            : item.isCloudGap
              ? theme.primary
              : 'transparent';
          const dotColor = isBare
            ? theme.gold.ink
            : item.isCloudGap
              ? theme.primary
              : item.window.ndviSmooth >= 0.45
                ? theme.sage.edge
                : theme.mutedText;

          return (
            <Pressable
              key={item.code}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item.window.monthLabel} ${item.code} (${item.daySpan})`}
              onPress={() => setSelectedDekadIndex(item.dekadIndex)}
              style={styles.dayCol}>
              <Text
                style={[
                  styles.monthCaption,
                  {
                    color: active ? theme.foreground : theme.mutedText,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontWeight: active ? '500' : '400',
                  },
                ]}>
                {item.window.monthLabel}
              </Text>

              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: active ? theme.primary : 'transparent',
                    borderWidth: hasRing ? 1.5 : 0,
                    borderColor: ringColor,
                  },
                ]}>
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: active
                        ? theme.onPrimary
                        : isBare
                          ? theme.gold.ink
                          : item.isCloudGap
                            ? theme.primary
                            : theme.foreground,
                    },
                  ]}>
                  {item.numLabel}
                </Text>
              </View>

              <View
                style={[
                  styles.dekadDot,
                  {
                    backgroundColor: active ? theme.primary : dotColor,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Legend Row */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[styles.swatch, { backgroundColor: theme.sage.edge }]}
          />
          <ThemedText type="small" themeColor="secondary" style={styles.regularText}>
            Cover OK
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: theme.gold.ink }]} />
          <ThemedText type="small" themeColor="secondary" style={styles.regularText}>
            Bare risk
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: theme.primary }]} />
          <ThemedText type="small" themeColor="secondary" style={styles.regularText}>
            Cloud QA
          </ThemedText>
        </View>
      </View>

      {/* Selected Dekad Inspector */}
      {selectedDekad && (
        <View
          style={[
            styles.inspector,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.inspectorHeader}>
            <View style={styles.titleIconRow}>
              {selectedDekad.window.bareFieldRisk ? (
                <Sun size={15} color={theme.gold.ink} />
              ) : (
                <CloudRain size={15} color={theme.sage.ink} />
              )}
              <ThemedText type="small" style={styles.mediumText}>
                {selectedDekad.code} · {selectedDekad.window.seasonLabel}
              </ThemedText>
            </View>
            <ThemedText
              type="small"
              style={[
                styles.regularText,
                {
                  color: selectedDekad.window.bareFieldRisk
                    ? theme.gold.ink
                    : theme.sage.ink,
                },
              ]}>
              NDVI {selectedDekad.window.ndviSmooth.toFixed(2)} ·{' '}
              {selectedDekad.window.rainMm} mm
            </ThemedText>
          </View>

          <ThemedText type="small" themeColor="secondary">
            {selectedDekad.window.summaryNote}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: roofiSpacing[2],
  },
  titleBlock: {
    gap: 2,
  },
  monthHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthDisplayTitle: {
    fontFamily: roofiTypography.fontFamily.displayMedium,
    fontWeight: '500',
    fontSize: roofiTypography.fontSize.screenTitle,
    lineHeight: roofiTypography.lineHeight.screenTitle,
    textTransform: 'uppercase',
  },
  dekadRangePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: roofiRadii.pill,
  },
  dekadRangeText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
    fontWeight: '500',
  },
  bareCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  bareCountText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
    fontWeight: '500',
  },
  stripContent: {
    gap: 6,
    paddingVertical: 2,
  },
  dayCol: {
    width: 42,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  monthCaption: {
    fontSize: roofiTypography.fontSize.caption,
  },
  dayCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: roofiRadii.pill,
  },
  dayNumber: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '500',
    fontSize: 13,
  },
  regularText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '400',
    fontSize: 12,
  },
  mediumText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '500',
    fontSize: 13,
  },
  dekadDot: {
    width: 5,
    height: 4,
    borderRadius: roofiRadii.pill,
    marginTop: 1,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inspector: {
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
