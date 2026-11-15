import { StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Label } from '@/components/ui';
import { roofiRadii, roofiSpacing, roofiTypography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Nested visual footprint comparison contrasting SMAP (9 km),
 * Copernicus DEM (90 m), NASA HLS / iSDAsoil (30 m), and the user's farm parcel.
 * Redesigned with the Autis Planner (roofi) nested card architecture so labels
 * never collide at any farm size.
 */
export function ScaleFootprintDiagram({ farmAreaHa }: { farmAreaHa: number }) {
  const theme = useTheme();
  const safeHa = Math.max(0.5, farmAreaHa);
  const farmKm2 = safeHa / 100;

  // 1 HLS / iSDAsoil pixel = 30 m x 30 m = 900 m² = 0.09 ha
  const hlsPixelCount = Math.max(1, Math.round(safeHa / 0.09));
  // 1 SMAP pixel = 9 km x 9 km = 81 km² = 8,100 ha
  const smapEquivalentFarms = Math.max(1, Math.round(8100 / safeHa));

  // Visual progress bar width for farm size (log-scaled between 28% and 100%)
  const parcelFillPct = Math.min(
    100,
    Math.max(28, Math.round(24 + Math.log2(safeHa + 0.5) * 20)),
  );

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.surfaceSubtle,
          borderColor: theme.border,
        },
      ]}>
      {/* Top header & ratio badge */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextCol}>
          <Label>RESOLUTION FOOTPRINT</Label>
          <ThemedText type="smallBold">Scale Honesty Picture</ThemedText>
        </View>
        <View

        >
          <Text style={[styles.ratioBadgeText, { color: theme.gold.ink }]}>
            1 SMAP px ≈ {smapEquivalentFarms.toLocaleString()} farms
          </Text>
        </View>
      </View>

      {/* Outer Ring: SMAP / IMERG (~9-10 km Regional Box) */}
      <View
        style={[
          styles.smapOuterBox,
          {
            backgroundColor: theme.surface,
            borderColor: theme.gold.ink,
          },
        ]}>
        <View style={styles.layerHeaderRow}>
          <View style={styles.layerTitleGroup}>
            {/* <View
              style={[styles.layerDot, { backgroundColor: theme.gold.ink }]}
            /> */}
            <Text style={[styles.layerTitle, { color: theme.gold.ink }]}>
              SMAP / IMERG Regional Box
            </Text>
          </View>
          <View
          // 
          >
            <Text style={[styles.layerMetaText, { color: theme.gold.ink }]}>
              9–10 km · 8,100 ha
            </Text>
          </View>
        </View>

        {/* Middle Ring: Copernicus DEM 90 m Terrain */}
        <View
          style={[
            styles.demMiddleBox,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.layerHeaderRow}>
            <View style={styles.layerTitleGroup}>
              {/* <View
                style={[styles.layerDot, { backgroundColor: theme.sage.ink }]}
              /> */}
              <Text style={[styles.layerTitle, { color: theme.foreground }]}>
                Copernicus DEM Terrain
              </Text>
            </View>
            <View
            // 
            >
              <Text style={[styles.layerMetaText, { color: theme.sage.ink }]}>
                90 m · 0.81 ha
              </Text>
            </View>
          </View>

          {/* Inner Ring: 30 m NASA HLS & iSDAsoil v2 */}
          <View
            style={[
              styles.hlsInnerBox,
              {
                backgroundColor: theme.personal.surface,
                borderColor: theme.personal.edge,
              },
            ]}>
            <View style={styles.layerHeaderRow}>
              <View style={styles.layerTitleGroup}>
                {/* <View
                  style={[styles.layerDot, { backgroundColor: theme.primary }]}
                /> */}
                <Text
                  style={[styles.layerTitle, { color: theme.personal.ink }]}>
                  NASA HLS + iSDAsoil v2
                </Text>
              </View>
              <View
              // 
              >
                <Text
                  style={[styles.layerMetaText, { color: theme.personal.ink }]}>
                  30 m · 0.09 ha
                </Text>
              </View>
            </View>

            {/* Core Parcel Block: User's Farm */}
            <View
              style={[
                styles.farmParcelTrack,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.personal.edge,
                },
              ]}>
              <View
                style={[
                  styles.farmParcelFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${parcelFillPct}%`,
                  },
                ]}
              />
              <View style={styles.farmParcelContent}>
                <View style={styles.farmParcelTitleRow}>
                  <Text
                    style={[
                      styles.farmParcelTitle,
                      { color: theme.foreground },
                    ]}>
                    Your Farm Parcel
                  </Text>
                  <View
                    style={[
                      styles.hlsCountChip,
                      { backgroundColor: theme.foreground },
                    ]}>
                    <Text
                      style={[
                        styles.hlsCountText,
                        { color: theme.background },
                      ]}>
                      ~{hlsPixelCount} HLS px
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.farmParcelSub, { color: theme.secondary }]}>
                  {safeHa.toFixed(1)} ha ({farmKm2.toFixed(3)} km²) · Direct
                  30 m field match
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Takeaway caption */}
      <View style={styles.captionBox}>
        <ThemedText type="small" themeColor="secondary">
          Your{' '}
          <ThemedText type="smallBold">{safeHa.toFixed(1)} ha</ThemedText> plot
          is resolved by{' '}
          <ThemedText type="smallBold" style={{ color: theme.personal.ink }}>
            ~{hlsPixelCount} pixels
          </ThemedText>{' '}
          at 30 m (HLS/iSDAsoil), whereas a single{' '}
          <ThemedText type="smallBold" style={{ color: theme.gold.ink }}>
            9 km SMAP box
          </ThemedText>{' '}
          spans regional moisture across {smapEquivalentFarms.toLocaleString()}{' '}
          similar farms.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: roofiSpacing[3],
    padding: roofiSpacing[3],
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: roofiSpacing[2],
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  ratioBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  ratioBadgeText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
    fontWeight: '500',
  },
  smapOuterBox: {
    borderRadius: roofiRadii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 11,
    gap: 9,
  },
  demMiddleBox: {
    borderRadius: roofiRadii.md,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  hlsInnerBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  layerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  layerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  layerDot: {
    width: 7,
    height: 7,
    borderRadius: roofiRadii.pill,
  },
  layerTitle: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  layerMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: roofiRadii.pill,
  },
  layerMetaText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 10,
    fontWeight: '500',
  },
  farmParcelTrack: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  farmParcelFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    opacity: 0.14,
  },
  farmParcelContent: {
    gap: 3,
  },
  farmParcelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  farmParcelTitle: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 13,
    fontWeight: '500',
  },
  hlsCountChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: roofiRadii.pill,
  },
  hlsCountText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 10,
    fontWeight: '500',
  },
  farmParcelSub: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
  },
  captionBox: {
    paddingHorizontal: 2,
  },
});
