import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { PlannerIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import type { PilotCellSummary } from '@/constants/pilot-data';
import {
  CardShadow,
  roofiRadii,
  roofiSpacing,
  roofiTypography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface AshantiMapPreviewProps {
  cells: PilotCellSummary[];
  selectedCellId: string;
  onSelectCell: (cellId: string) => void;
}

/**
 * Offline-first interactive SVG spatial grid map for mobile & web.
 * Does not depend on Google Maps SDK or external API keys, ensuring
 * crash-free launch across all Android & iOS devices.
 */
export function AshantiMapPreview({
  cells,
  selectedCellId,
  onSelectCell,
}: AshantiMapPreviewProps) {
  const theme = useTheme();
  const activeCell =
    cells.find((c) => c.cellId === selectedCellId) ?? cells[0];

  const minLon = -1.52;
  const maxLon = -1.33;
  const minLat = 6.78;
  const maxLat = 6.97;

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconChip,
              { backgroundColor: theme.personal.surface },
            ]}>
            <PlannerIcon name="pin" size={14} color={theme.primary} />
          </View>
          <ThemedText
            type="sectionTitle"
            style={{
              fontFamily: roofiTypography.fontFamily.body,
              fontWeight: '500',
            }}>
            Ashanti 5×5 km Grid Map
          </ThemedText>
        </View>
        <ThemedText
          type="small"
          themeColor="mutedText"
          style={{
            fontFamily: roofiTypography.fontFamily.body,
            fontWeight: '400',
          }}>
          {activeCell.centreLat.toFixed(3)}°N,{' '}
          {Math.abs(activeCell.centreLon).toFixed(3)}°W
        </ThemedText>
      </View>

      <View
        style={[
          styles.mapBox,
          {
            backgroundColor: theme.surfaceSubtle,
            borderColor: theme.border,
          },
        ]}>
        <Svg width="100%" height={156} viewBox="0 0 320 156">
          {[38, 78, 118].map((y) => (
            <Line
              key={`h-${y}`}
              x1={8}
              y1={y}
              x2={312}
              y2={y}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}
          {[64, 160, 256].map((x) => (
            <Line
              key={`v-${x}`}
              x1={x}
              y1={8}
              x2={x}
              y2={148}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}

          {cells.map((cell) => {
            const nx = (cell.centreLon - minLon) / (maxLon - minLon);
            const ny = 1 - (cell.centreLat - minLat) / (maxLat - minLat);
            const cx = Math.round(28 + nx * 264);
            const cy = Math.round(24 + ny * 108);
            const isSelected = cell.cellId === selectedCellId;
            return (
              <Rect
                key={cell.cellId}
                x={cx - 34}
                y={cy - 20}
                width={68}
                height={40}
                rx={10}
                fill={isSelected ? theme.personal.surface : theme.surface}
                stroke={isSelected ? theme.primary : theme.sage.edge}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
            );
          })}

          {cells.map((cell) => {
            const nx = (cell.centreLon - minLon) / (maxLon - minLon);
            const ny = 1 - (cell.centreLat - minLat) / (maxLat - minLat);
            const cx = Math.round(28 + nx * 264);
            const cy = Math.round(24 + ny * 108);
            const isSelected = cell.cellId === selectedCellId;
            return (
              <SvgText
                key={`lbl-${cell.cellId}`}
                x={cx}
                y={cy + 3}
                fontSize={10}
                fontFamily={roofiTypography.fontFamily.body}
                fontWeight="500"
                textAnchor="middle"
                fill={isSelected ? theme.personal.ink : theme.foreground}>
                {cell.cellId.replace('ASH_', '')}
              </SvgText>
            );
          })}
        </Svg>

        <View style={styles.pillSelectorRow}>
          {cells.map((cell) => {
            const isSelected = cell.cellId === selectedCellId;
            return (
              <Pressable
                key={`btn-${cell.cellId}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelectCell(cell.cellId)}
                style={[
                  styles.cellChip,
                  {
                    backgroundColor: isSelected
                      ? theme.foreground
                      : theme.surface,
                    borderColor: isSelected ? theme.foreground : theme.border,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={{
                    fontFamily: roofiTypography.fontFamily.body,
                    fontWeight: '500',
                    color: isSelected ? theme.background : theme.secondary,
                  }}>
                  {cell.cellId}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ThemedText type="small" themeColor="secondary">
        Tap a 5×5 km cell pill above to switch EO baselines across Ejura,
        Mampong, and Offinso.
      </ThemedText>
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
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBox: {
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  pillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cellChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
});
