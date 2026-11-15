import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

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

function cellSquareCoords(cell: PilotCellSummary, halfDeg = 0.022) {
  return [
    { latitude: cell.centreLat - halfDeg, longitude: cell.centreLon - halfDeg },
    { latitude: cell.centreLat - halfDeg, longitude: cell.centreLon + halfDeg },
    { latitude: cell.centreLat + halfDeg, longitude: cell.centreLon + halfDeg },
    { latitude: cell.centreLat + halfDeg, longitude: cell.centreLon - halfDeg },
  ];
}

/**
 * Interactive native / Expo Go map displaying Ashanti 5x5 km pilot cells.
 * Isolated from web bundles via `ashanti-map-preview.web.tsx`.
 */
export function AshantiMapPreview({
  cells,
  selectedCellId,
  onSelectCell,
}: AshantiMapPreviewProps) {
  const theme = useTheme();
  const activeCell =
    cells.find((c) => c.cellId === selectedCellId) ?? cells[0];

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>


      <View style={[styles.mapFrame, { borderColor: theme.border }]}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 6.875,
            longitude: -1.425,
            latitudeDelta: 0.18,
            longitudeDelta: 0.18,
          }}>
          {cells.map((cell) => {
            const isSelected = cell.cellId === selectedCellId;
            return (
              <Polygon
                key={`poly-${cell.cellId}`}
                coordinates={cellSquareCoords(cell)}
                strokeColor={isSelected ? theme.primary : theme.foreground}
                fillColor={
                  isSelected
                    ? 'rgba(54, 112, 255, 0.26)'
                    : 'rgba(23, 23, 23, 0.12)'
                }
                strokeWidth={isSelected ? 2.5 : 1.5}
                tappable
                onPress={() => onSelectCell(cell.cellId)}
              />
            );
          })}
          {cells.map((cell) => (
            <Marker
              key={`pin-${cell.cellId}`}
              coordinate={{
                latitude: cell.centreLat,
                longitude: cell.centreLon,
              }}
              title={cell.cellId}
              description={`${cell.zoneName} · Slope ${cell.slopePct}%`}
              pinColor={
                cell.cellId === selectedCellId ? '#3670FF' : '#171717'
              }
              onPress={() => onSelectCell(cell.cellId)}
            />
          ))}
        </MapView>
      </View>
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
      {/* <ThemedText type="small" themeColor="secondary">
        Tap any 5×5 km cell pin to switch local EO climate, soil pH, and slope
        priors.
      </ThemedText> */}
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
  mapFrame: {
    height: 184,
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
