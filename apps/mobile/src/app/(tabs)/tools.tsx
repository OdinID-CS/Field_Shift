import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AshantiMapPreview } from '@/components/ashanti-map-preview';
import { TopBarHeader } from '@/components/design-system';
import { PlannerIcon, type PlannerIconName } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Heading } from '@/components/ui';
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

interface ToolCardItem {
  id: string;
  title: string;
  subtitle: string;
  icon: PlannerIconName;
  tintBg: string;
  tintInk: string;
  route: '/calendar' | '/compare' | '/passport' | '/scale-honesty';
}

export default function ToolsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const { cells, selectedCell, selectCell } = usePilotState();

  const isOfficerOrAgronomist =
    session?.role === 'extension_officer' || session?.role === 'agronomist';

  const farmerTools: ToolCardItem[] = [
    {
      id: 'calendar',
      title: 'Planting Calendar',
      subtitle: 'Check wet, bare-soil, and cloudy 10-day windows for your farm.',
      icon: 'calendar',
      tintBg: theme.sage.surface,
      tintInk: theme.sage.ink,
      route: '/calendar',
    },
    {
      id: 'compare',
      title: 'Compare Crop Plans',
      subtitle: 'Pick your priorities and compare 5 Ashanti crop rotations.',
      icon: 'compare',
      tintBg: theme.personal.surface,
      tintInk: theme.personal.ink,
      route: '/compare',
    },
    {
      id: 'scan',
      title: 'Scan My Plot',
      subtitle: 'Take a photo offline to check ground cover and log an update.',
      icon: 'passport',
      tintBg: theme.gold.surface,
      tintInk: theme.gold.ink,
      route: '/passport',
    },
  ];

  const officerTools: ToolCardItem[] = [
    {
      id: 'scale',
      title: 'Scale Honesty Audit',
      subtitle: 'Compare parcel hectares against 9 km SMAP & 30 m HLS footprints.',
      icon: 'map',
      tintBg: theme.pair.surface,
      tintInk: theme.pair.ink,
      route: '/scale-honesty',
    },
    {
      id: 'passport',
      title: 'Evidence Passports & M8 Review',
      subtitle: 'Inspect dataset provenance, gaps, and grade officer outcomes.',
      icon: 'document',
      tintBg: theme.sage.surface,
      tintInk: theme.sage.ink,
      route: '/passport',
    },
  ];

  const renderToolCard = (tool: ToolCardItem) => (
    <Pressable
      key={tool.id}
      accessibilityRole="button"
      onPress={() => router.push(tool.route)}
      style={({ pressed }) => [
        styles.toolCard,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <View style={[styles.iconBox, { backgroundColor: tool.tintBg }]}>
        <PlannerIcon name={tool.icon} size={20} color={tool.tintInk} />
      </View>
      <View style={styles.toolBody}>
        <ThemedText style={styles.toolTitle}>{tool.title}</ThemedText>
        <ThemedText type="small" themeColor="secondary">
          {tool.subtitle}
        </ThemedText>
      </View>
      <PlannerIcon name="chevron" size={18} color={theme.mutedText} />
    </Pressable>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title="Tools"
        subtitle={`${selectedCell.zoneName} · ${isOfficerOrAgronomist ? 'Officer & Farm Tools' : 'Farm Tools'}`}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Heading title="Farm Tools" />
        </View>

        <View style={styles.cardList}>{farmerTools.map(renderToolCard)}</View>

        {isOfficerOrAgronomist ? (
          <>
            <View style={styles.sectionHeader}>
              <Heading title="Extension Officer Tools" />
              <View
                style={[
                  styles.rolePill,
                  { backgroundColor: theme.personal.surface },
                ]}>
                <ThemedText
                  type="small"
                  style={{
                    color: theme.personal.ink,
                    fontFamily: roofiTypography.fontFamily.body,
                    fontWeight: '500',
                  }}>
                  {session?.role === 'agronomist' ? 'Agronomist' : 'Officer'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.cardList}>{officerTools.map(renderToolCard)}</View>

            <AshantiMapPreview
              cells={cells}
              selectedCellId={selectedCell.cellId}
              onSelectCell={selectCell}
            />
          </>
        ) : (
          <View
            style={[
              styles.infoNote,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}>
            <PlannerIcon name="shield" size={16} color={theme.secondary} />
            <ThemedText type="small" themeColor="secondary" style={styles.flexOne}>
              Detailed satellite maps, Scale Honesty audits, and M8 outcome
              grading are available when signed in as an Extension Officer or
              Agronomist.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[2],
    paddingBottom: BottomTabInset + roofiSpacing[6],
    gap: roofiSpacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  cardList: {
    gap: 10,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBody: {
    flex: 1,
    gap: 3,
  },
  toolTitle: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '500',
    fontSize: 15,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
    padding: roofiSpacing[3],
  },
  flexOne: { flex: 1 },
});
