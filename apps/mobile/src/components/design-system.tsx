import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { PlannerIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import {
  CardShadow,
  Radii,
  roofiRadii,
  roofiSpacing,
  roofiTypography,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppIconName = SymbolViewProps['name'];

export function TopSearchRegionHeader({
  searchQuery,
  onChangeSearch,
  searchPlaceholder = 'Search region or cell',
  regionCaption = 'Region',
  regionName,
}: {
  searchQuery: string;
  onChangeSearch: (text: string) => void;
  searchPlaceholder?: string;
  regionCaption?: string;
  regionName: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.plannerHeaderWrap,
        {
          backgroundColor: theme.background,
        },
      ]}>
      <View style={styles.plannerHeaderTopRow}>
        <View style={styles.headerTitleStack}>
          <Text
            style={[
              styles.plannerLabel,
              { color: theme.secondary },
            ]}>
            {`${regionCaption} · ${regionName}`.toUpperCase()}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.plannerScreenTitle,
              { color: theme.foreground },
            ]}>
            FIELD SHIFT
          </Text>
        </View>

        <View
          style={[
            styles.regionPillBadge,
            {
              backgroundColor: theme.personal.surface,
              borderColor: theme.personal.edge,
            },
          ]}>
          <PlannerIcon name="pin" size={14} color={theme.primary} />
          <Text
            style={[
              styles.regionPillText,
              { color: theme.personal.ink },
            ]}>
            5×5 KM EO
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.searchPill,
          {
            backgroundColor: theme.surfaceSubtle,
            borderColor: theme.border,
          },
        ]}>
        <PlannerIcon name="search" size={17} color={theme.secondary} />
        <TextInput
          value={searchQuery}
          onChangeText={onChangeSearch}
          placeholder={searchPlaceholder}
          placeholderTextColor={theme.secondary}
          selectionColor={theme.primary}
          style={[
            styles.searchInput,
            {
              color: theme.foreground,
              fontFamily: roofiTypography.fontFamily.body,
            },
          ]}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}

export interface HeaderAction {
  id: string;
  icon: AppIconName;
  onPress: () => void;
  variant?: 'neutral' | 'primary';
  badgeDot?: boolean;
  accessibilityLabel: string;
}

export function TopBarHeader({
  title,
  subtitle,
  leftAction,
  rightActions = [],
}: {
  title: string;
  subtitle?: string;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.topHeaderBar,
        {
          backgroundColor: theme.background,
        },
      ]}>
      <View style={styles.headerLeftGroup}>
        {leftAction && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={leftAction.accessibilityLabel}
            onPress={leftAction.onPress}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <PlannerIcon name="back" size={19} color={theme.foreground} />
          </Pressable>
        )}

        <View style={styles.headerTitleStack}>
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={[
                styles.plannerLabel,
                { color: theme.secondary },
              ]}>
              {subtitle.toUpperCase()}
            </Text>
          ) : null}
          <Text
            numberOfLines={1}
            style={[
              styles.plannerScreenTitle,
              { color: theme.foreground },
            ]}>
            {title}
          </Text>
        </View>
      </View>

      {rightActions.length > 0 && (
        <View style={styles.headerRightActions}>
          {rightActions.map((action) => {
            const isPrimary = action.variant === 'primary';
            return (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel}
                onPress={action.onPress}
                style={({ pressed }) => [
                  isPrimary ? styles.primaryCircleButton : styles.iconButton,
                  {
                    backgroundColor: isPrimary
                      ? theme.primary
                      : theme.surfaceSubtle,
                    borderColor: isPrimary ? theme.primary : theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                {isPrimary ? (
                  <PlannerIcon
                    name="plus"
                    size={20}
                    color={theme.onPrimary}
                  />
                ) : (
                  <SymbolView
                    name={action.icon}
                    size={18}
                    tintColor={theme.foreground}
                  />
                )}
                {action.badgeDot && (
                  <View
                    style={[
                      styles.actionDot,
                      {
                        backgroundColor: theme.primary,
                        borderColor: theme.background,
                      },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export interface SegmentedOption<T extends string = string> {
  id: T;
  label: string;
}

export function SegmentedPillBar<T extends string>({
  options,
  selectedId,
  onSelect,
}: {
  options: readonly SegmentedOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
}) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.segmentedContainer,
        {
          backgroundColor: theme.surfaceSubtle,
          borderColor: theme.border,
        },
      ]}>
      {options.map((opt) => {
        const active = opt.id === selectedId;
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(opt.id)}
            style={({ pressed }) => [
              styles.segmentedOption,
              active && {
                backgroundColor: theme.surface,
                shadowColor: theme.foreground,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 1,
              },
              pressed && styles.pressed,
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.segmentedText,
                {
                  color: active ? theme.foreground : theme.secondary,
                  fontFamily: roofiTypography.fontFamily.body,
                },
              ]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function KpiMetricCard({
  icon,
  value,
  unit,
  label,
}: {
  icon: AppIconName;
  value: string;
  unit?: string;
  label: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.kpiCard,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View
        style={[
          styles.kpiIconBox,
          { backgroundColor: theme.personal.surface },
        ]}>
        <SymbolView name={icon} size={18} tintColor={theme.primary} />
      </View>

      <View style={styles.kpiBody}>
        <View style={styles.kpiValueRow}>
          <ThemedText type="kpi">{value}</ThemedText>
          {unit ? (
            <ThemedText type="smallBold" themeColor="secondary">
              {' '}
              {unit}
            </ThemedText>
          ) : null}
        </View>
        <ThemedText
          type="captionUppercase"
          themeColor="secondary"
          numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
    </View>
  );
}

export function HeroStatusCard({
  value,
  unit,
  deltaText,
  statusLabel,
  statusTone = 'optimal',
  subtitle,
  metaLeft,
  metaRight,
}: {
  value: string;
  unit?: string;
  deltaText: string;
  statusLabel: string;
  statusTone?: 'optimal' | 'warning';
  subtitle: string;
  metaLeft: string;
  metaRight: string;
}) {
  const theme = useTheme();
  const isWarning = statusTone === 'warning';
  const pillBg = isWarning ? theme.gold.surface : theme.sage.surface;
  const pillFg = isWarning ? theme.gold.ink : theme.sage.ink;

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroMetricGroup}>
          <ThemedText type="hero">
            {value}
            {unit ? <Text style={styles.heroUnit}> {unit}</Text> : null}
          </ThemedText>
          <ThemedText
            type="smallBold"
            style={{ color: isWarning ? theme.gold.ink : theme.sage.ink }}>
            {deltaText}
          </ThemedText>
        </View>

        <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
          <ThemedText type="code" style={{ color: pillFg }}>
            {statusLabel.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="default" themeColor="secondary">
        {subtitle}
      </ThemedText>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.heroMetaRow}>
        <View style={styles.heroMetaItem}>
          <PlannerIcon name="calendar" size={15} color={theme.secondary} />
          <ThemedText type="smallBold" themeColor="secondary">
            {metaLeft}
          </ThemedText>
        </View>

        <ThemedText type="small" themeColor="mutedText">
          {metaRight}
        </ThemedText>
      </View>
    </View>
  );
}

export interface ChartPoint {
  xLabel: string;
  value: number;
  calloutTitle?: string;
}

export interface ChartTimeframeOption {
  id: string;
  label: string;
}

function interpolateCatmullRom(values: number[], totalSlices: number): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return new Array(totalSlices).fill(values[0]);

  const result: number[] = [];
  const n = values.length;
  for (let i = 0; i < totalSlices; i++) {
    const tGlobal = (i / Math.max(1, totalSlices - 1)) * (n - 1);
    const idx = Math.min(n - 2, Math.floor(tGlobal));
    const t = tGlobal - idx;

    const p0 = values[Math.max(0, idx - 1)];
    const p1 = values[idx];
    const p2 = values[Math.min(n - 1, idx + 1)];
    const p3 = values[Math.min(n - 1, idx + 2)];

    const t2 = t * t;
    const t3 = t2 * t;
    const interp =
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    result.push(interp);
  }
  return result;
}

export function InteractiveAreaChartCard({
  title,
  points,
  unit = '%',
  colorTone = 'green',
  timeframes,
  activeTimeframeId,
  onSelectTimeframe,
  statChips,
  yMin,
  yMax,
  yTickCount = 4,
}: {
  title: string;
  points: ChartPoint[];
  unit?: string;
  colorTone?: 'green' | 'amber';
  timeframes?: ChartTimeframeOption[];
  activeTimeframeId?: string;
  onSelectTimeframe?: (id: string) => void;
  statChips?: string[];
  yMin?: number;
  yMax?: number;
  yTickCount?: number;
}) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(260);
  const [selectedIdx, setSelectedIdx] = useState(() =>
    Math.min(Math.max(0, Math.floor(points.length / 2)), points.length - 1),
  );

  const safeIdx = Math.min(selectedIdx, Math.max(0, points.length - 1));
  const strokeColor =
    colorTone === 'amber' ? theme.warning : theme.primary;
  const fillTint =
    colorTone === 'amber'
      ? 'rgba(180, 83, 9, 0.16)'
      : 'rgba(255, 106, 43, 0.18)';
  const fillBottomTint =
    colorTone === 'amber'
      ? 'rgba(180, 83, 9, 0.03)'
      : 'rgba(255, 106, 43, 0.03)';

  const rawValues = points.map((p) => p.value);
  const minVal =
    yMin !== undefined ? yMin : Math.floor(Math.min(...rawValues, 0));
  const maxVal =
    yMax !== undefined ? yMax : Math.ceil(Math.max(...rawValues, minVal + 1));
  const span = Math.max(1e-6, maxVal - minVal);

  const plotHeight = 148;
  const smoothCount = Math.max(36, points.length * 6);
  const smoothValues = useMemo(
    () => interpolateCatmullRom(rawValues, smoothCount),
    [rawValues, smoothCount],
  );

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = 0; i <= yTickCount; i++) {
      ticks.push(Math.round(maxVal - (span * i) / yTickCount));
    }
    return ticks;
  }, [maxVal, span, yTickCount]);

  const toY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const norm = (clamped - minVal) / span;
    return plotHeight - norm * (plotHeight - 16) - 8;
  };

  const handlePlotLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0 && Math.abs(measured - plotWidth) > 1) {
      setPlotWidth(measured);
    }
  };

  const smoothCoords = smoothValues.map((val, idx) => ({
    x: (idx / Math.max(1, smoothValues.length - 1)) * plotWidth,
    y: toY(val),
  }));

  const activePoint = points[safeIdx] ?? { xLabel: '', value: 0 };
  const activeX =
    points.length > 1
      ? (safeIdx / (points.length - 1)) * plotWidth
      : plotWidth / 2;
  const activeY = toY(activePoint.value);
  const tooltipLeft = Math.max(4, Math.min(plotWidth - 96, activeX - 46));
  const tooltipTop = Math.max(2, activeY - 46);

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.chartHeaderRow}>
        <ThemedText type="sectionTitle">{title}</ThemedText>

        {timeframes && timeframes.length > 0 && (
          <View style={styles.timeframeRow}>
            {timeframes.map((tf) => {
              const isActive = tf.id === activeTimeframeId;
              return (
                <Pressable
                  key={tf.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => onSelectTimeframe?.(tf.id)}
                  style={({ pressed }) => [
                    styles.timeframePill,
                    {
                      backgroundColor: isActive
                        ? theme.foreground
                        : theme.surfaceSubtle,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.timeframeText,
                      {
                        color: isActive ? theme.background : theme.secondary,
                        fontFamily: roofiTypography.fontFamily.body,
                      },
                    ]}>
                    {tf.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {statChips && statChips.length > 0 && (
        <View style={styles.statChipsRow}>
          {statChips.map((chip) => (
            <View
              key={chip}
              style={[
                styles.statChip,
                { backgroundColor: theme.surfaceSubtle },
              ]}>
              <ThemedText type="code" themeColor="secondary">
                {chip}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.chartBody}>
        <View style={[styles.yAxisColumn, { height: plotHeight }]}>
          {yTicks.map((tick, idx) => (
            <ThemedText
              key={`${tick}-${idx}`}
              type="small"
              themeColor="mutedText"
              style={styles.yTickLabel}>
              {tick}
              {unit}
            </ThemedText>
          ))}
        </View>

        <View style={styles.plotOuter}>
          <View
            onLayout={handlePlotLayout}
            style={[styles.plotCanvas, { height: plotHeight }]}>
            {yTicks.map((_, idx) => (
              <View
                key={`grid-${idx}`}
                style={[
                  styles.gridLine,
                  {
                    top:
                      (idx / Math.max(1, yTicks.length - 1)) *
                        (plotHeight - 16) +
                      8,
                    backgroundColor: theme.border,
                  },
                ]}
              />
            ))}

            {smoothCoords.map((pt, idx) => {
              const sliceWidth = plotWidth / smoothCoords.length + 0.8;
              const areaHeight = Math.max(0, plotHeight - pt.y);
              return (
                <View
                  key={`fill-${idx}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: pt.x - sliceWidth / 2,
                    top: pt.y,
                    width: sliceWidth,
                    height: areaHeight,
                    backgroundColor: fillTint,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: areaHeight * 0.45,
                      backgroundColor: fillBottomTint,
                    }}
                  />
                </View>
              );
            })}

            {smoothCoords.slice(0, -1).map((pt, idx) => {
              const next = smoothCoords[idx + 1];
              const dx = next.x - pt.x;
              const dy = next.y - pt.y;
              const length = Math.hypot(dx, dy) + 1.2;
              const angle = Math.atan2(dy, dx);
              const mx = (pt.x + next.x) / 2;
              const my = (pt.y + next.y) / 2;
              return (
                <View
                  key={`seg-${idx}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: mx - length / 2,
                    top: my - 1.25,
                    width: length,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: strokeColor,
                    transform: [{ rotate: `${angle}rad` }],
                  }}
                />
              );
            })}

            <View
              pointerEvents="none"
              style={[
                styles.crosshairLine,
                {
                  left: activeX,
                  height: plotHeight,
                  borderColor: theme.mutedText,
                },
              ]}
            />

            <View
              pointerEvents="none"
              style={[
                styles.calloutBubble,
                CardShadow,
                {
                  left: tooltipLeft,
                  top: tooltipTop,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <ThemedText type="small" themeColor="mutedText">
                {activePoint.calloutTitle ?? activePoint.xLabel}
              </ThemedText>
              <ThemedText type="smallBold">
                {activePoint.value}
                {unit}
              </ThemedText>
            </View>

            <View
              pointerEvents="none"
              style={[
                styles.activeRingDot,
                {
                  left: activeX - 5,
                  top: activeY - 5,
                  borderColor: strokeColor,
                  backgroundColor: theme.surface,
                },
              ]}
            />

            <View style={styles.touchOverlay}>
              {points.map((pt, idx) => (
                <Pressable
                  key={`tap-${pt.xLabel}-${idx}`}
                  style={styles.touchColumn}
                  onPress={() => setSelectedIdx(idx)}
                  accessibilityLabel={`Inspect ${pt.xLabel}: ${pt.value}${unit}`}
                />
              ))}
            </View>
          </View>

          <View style={styles.xAxisRow}>
            {points.map((pt, idx) => {
              const showLabel =
                points.length <= 7 ||
                idx === 0 ||
                idx === points.length - 1 ||
                idx % 2 === 0;
              return (
                <Text
                  key={`x-${pt.xLabel}-${idx}`}
                  numberOfLines={1}
                  style={[
                    styles.xAxisLabel,
                    {
                      color:
                        idx === safeIdx ? theme.foreground : theme.mutedText,
                      fontFamily: roofiTypography.fontFamily.body,
                    },
                  ]}>
                  {showLabel ? pt.xLabel : ''}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export function SmartInsightCard({
  icon,
  category,
  headline,
  footer,
  tone = 'green',
}: {
  icon: AppIconName;
  category: string;
  headline: string;
  footer: string;
  tone?: 'green' | 'amber';
}) {
  const theme = useTheme();
  const isAmber = tone === 'amber';

  return (
    <View
      style={[
        styles.insightCard,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderLeftWidth: 4,
          borderLeftColor: isAmber ? theme.warning : theme.primary,
        },
      ]}>
      <View
        style={[
          styles.insightIconBadge,
          {
            backgroundColor: isAmber
              ? theme.gold.surface
              : theme.personal.surface,
          },
        ]}>
        <SymbolView
          name={icon}
          size={19}
          tintColor={isAmber ? theme.gold.ink : theme.primary}
        />
      </View>

      <View style={styles.insightContent}>
        <ThemedText type="captionUppercase" themeColor="secondary">
          {category}
        </ThemedText>
        <ThemedText type="default">{headline}</ThemedText>
        <ThemedText type="small" themeColor="mutedText">
          {footer}
        </ThemedText>
      </View>
    </View>
  );
}

export function FieldParcelBanner({
  badgeText,
  accentColor = '#3670FF',
}: {
  badgeText: string;
  accentColor?: string;
}) {
  return (
    <View style={styles.aerialCanvas}>
      <View style={styles.aerialPatchTopLeft} />
      <View style={styles.aerialPatchTopRight} />
      <View style={styles.aerialPatchBottomLeft} />
      <View style={styles.aerialPatchBottomRight} />
      <View style={styles.aerialAccessTrackH} />
      <View style={styles.aerialAccessTrackV} />

      <View
        style={[
          styles.aerialPolygon,
          {
            borderColor: accentColor,
            backgroundColor: 'rgba(54, 112, 255, 0.25)',
          },
        ]}>
        <View style={styles.aerialTagPill}>
          <Text style={styles.aerialTagText}>{badgeText}</Text>
        </View>
      </View>
    </View>
  );
}

export function ThreeZoneGaugeBar({
  label = 'Strategy fit',
  scorePercent,
  zoneLabels = ['Low fit', 'Optimal', 'Robust'],
}: {
  label?: string;
  scorePercent: number;
  zoneLabels?: [string, string, string];
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(scorePercent)));
  const pillColor =
    clamped < 45
      ? theme.warning
      : clamped < 75
        ? theme.primary
        : theme.success;
  const clampedLeftPct = Math.max(8, Math.min(82, clamped - 7));

  return (
    <View style={styles.gaugeWrapper}>
      <ThemedText type="captionUppercase" themeColor="secondary">
        {label}
      </ThemedText>

      <View style={styles.gaugeTrackArea}>
        <View style={styles.gaugeTrackRow}>
          <View
            style={[
              styles.gaugeSegment,
              styles.gaugeSegLeft,
              { flex: 32, backgroundColor: '#F9D601' },
            ]}
          />
          <View
            style={[
              styles.gaugeSegment,
              { flex: 38, backgroundColor: '#3670FF' },
            ]}
          />
          <View
            style={[
              styles.gaugeSegment,
              styles.gaugeSegRight,
              { flex: 30, backgroundColor: '#1FB26B' },
            ]}
          />
        </View>

        <View
          style={[
            styles.gaugeMarkerPill,
            {
              left: `${clampedLeftPct}%`,
              backgroundColor: pillColor,
              borderColor: theme.surface,
            },
          ]}>
          <Text style={styles.gaugeMarkerText}>{clamped}%</Text>
        </View>
      </View>

      <View style={styles.gaugeLabelsRow}>
        <ThemedText type="small" themeColor="mutedText">
          {zoneLabels[0]}
        </ThemedText>
        <ThemedText type="small" themeColor="mutedText">
          {zoneLabels[1]}
        </ThemedText>
        <ThemedText type="small" themeColor="mutedText">
          {zoneLabels[2]}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plannerHeaderWrap: {
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[2],
    paddingBottom: roofiSpacing[3],
    gap: roofiSpacing[3],
  },
  plannerHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: roofiSpacing[3],
  },
  plannerLabel: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.label,
    lineHeight: roofiTypography.lineHeight.label,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  plannerScreenTitle: {
    fontFamily: roofiTypography.fontFamily.displayMedium,
    fontSize: roofiTypography.fontSize.screenTitle,
    lineHeight: roofiTypography.lineHeight.screenTitle,
    fontWeight: '500',
    letterSpacing: -0.35,
    textTransform: 'uppercase',
  },
  regionPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  regionPillText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[2],
    paddingBottom: roofiSpacing[3],
    gap: roofiSpacing[3],
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  headerLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleStack: {
    flex: 1,
    gap: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryCircleButton: {
    width: 40,
    height: 40,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentedOption: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: roofiRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedText: {
    fontSize: 13,
    fontWeight: '500',
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  kpiIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiBody: {
    flex: 1,
    gap: 2,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  card: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  heroMetricGroup: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
  },
  heroUnit: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 18,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeframePill: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  chartBody: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  yAxisColumn: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 2,
    width: 38,
  },
  yTickLabel: {
    fontVariant: ['tabular-nums'],
  },
  plotOuter: {
    flex: 1,
  },
  plotCanvas: {
    position: 'relative',
    width: '100%',
    overflow: 'visible',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  crosshairLine: {
    position: 'absolute',
    top: 4,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
  },
  calloutBubble: {
    position: 'absolute',
    minWidth: 78,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.lg,
    borderWidth: 1,
    alignItems: 'center',
    zIndex: 5,
  },
  activeRingDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
    zIndex: 4,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    zIndex: 6,
  },
  touchColumn: {
    flex: 1,
    height: '100%',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xAxisLabel: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  insightIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
    gap: 4,
  },
  aerialCanvas: {
    height: 132,
    borderRadius: Radii.md,
    backgroundColor: '#3A4726',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aerialPatchTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '54%',
    height: '48%',
    backgroundColor: '#564E35',
  },
  aerialPatchTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '44%',
    height: '52%',
    backgroundColor: '#2B361C',
  },
  aerialPatchBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40%',
    height: '48%',
    backgroundColor: '#48522E',
  },
  aerialPatchBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '58%',
    height: '44%',
    backgroundColor: '#323E21',
  },
  aerialAccessTrackH: {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(182, 165, 134, 0.5)',
    transform: [{ rotate: '-5deg' }],
  },
  aerialAccessTrackV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '34%',
    width: 3,
    backgroundColor: 'rgba(182, 165, 134, 0.45)',
    transform: [{ rotate: '12deg' }],
  },
  aerialPolygon: {
    width: '62%',
    height: '66%',
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 8,
    transform: [{ rotate: '-2deg' }],
  },
  aerialTagPill: {
    backgroundColor: 'rgba(20, 26, 18, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  aerialTagText: {
    fontFamily: roofiTypography.fontFamily.body,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  gaugeWrapper: {
    gap: 6,
  },
  gaugeTrackArea: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeTrackRow: {
    height: 8,
    flexDirection: 'row',
    borderRadius: roofiRadii.pill,
    overflow: 'hidden',
    gap: 2,
  },
  gaugeSegment: {
    height: '100%',
  },
  gaugeSegLeft: {
    borderTopLeftRadius: roofiRadii.pill,
    borderBottomLeftRadius: roofiRadii.pill,
  },
  gaugeSegRight: {
    borderTopRightRadius: roofiRadii.pill,
    borderBottomRightRadius: roofiRadii.pill,
  },
  gaugeMarkerPill: {
    position: 'absolute',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: roofiRadii.pill,
    borderWidth: 2,
  },
  gaugeMarkerText: {
    fontFamily: roofiTypography.fontFamily.body,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.75 },
});
