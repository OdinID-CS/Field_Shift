import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBarHeader } from '@/components/design-system';
import { PlannerIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
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
import { toast } from '@/lib/toast';
import { useTheme } from '@/theme/useTheme';

const ROLE_LABELS: Record<string, string> = {
  farmer: 'Farmer',
  extension_officer: 'Extension Officer',
  agronomist: 'Agronomist',
};

export default function ProfileScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const {
    cells,
    selectedCell,
    selectCell,
    farmAreaHa,
    setFarmAreaHa,
    dataSourceMode,
    lastSyncedAt,
    queuedLogsCount,
    isConnected,
    isSyncing,
    refreshLivePilotData,
  } = usePilotState();

  const roleLabel = session ? (ROLE_LABELS[session.role] ?? session.role) : 'Guest';

  const handleSync = async () => {
    await refreshLivePilotData();
    if (!isConnected) {
      toast.warning(
        'Offline',
        queuedLogsCount > 0
          ? `${queuedLogsCount} saved on phone`
          : undefined,
      );
    } else {
      toast.success('Synced', 'Data is up to date.');
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <TopBarHeader
        title="Profile"
        subtitle={`${selectedCell.zoneName} · ${roleLabel}`}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* Account Card */}
        <View
          style={[
            styles.card,
            CardShadow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.rowBetween}>
            <View style={styles.accountLeft}>
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: theme.colors.personal.surface },
                ]}>
                <PlannerIcon
                  name="profile"
                  size={20}
                  color={theme.colors.personal.ink}
                />
              </View>
              <View style={styles.flexOne}>
                <ThemedText style={styles.cardTitle}>
                  {session?.displayName ?? 'Ashanti Farmer'}
                </ThemedText>
                <ThemedText type="small" themeColor="secondary">
                  {session?.phone ?? 'Offline Demo'}
                </ThemedText>
              </View>
            </View>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: theme.colors.sage.surface },
              ]}>
              <ThemedText
                type="small"
                style={{
                  color: theme.colors.sage.ink,
                  fontFamily: roofiTypography.fontFamily.body,
                  fontWeight: '500',
                }}>
                {roleLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Active Farm Area & Cell */}
        <View
          style={[
            styles.card,
            CardShadow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <ThemedText style={styles.cardTitle}>My Farm Location</ThemedText>
          <View style={styles.cellChipsWrap}>
            {cells.map((cell) => {
              const active = cell.cellId === selectedCell.cellId;
              return (
                <Pressable
                  key={cell.cellId}
                  accessibilityRole="button"
                  onPress={() => selectCell(cell.cellId)}
                  style={[
                    styles.cellChip,
                    {
                      backgroundColor: active
                        ? theme.colors.foreground
                        : theme.colors.surfaceSubtle,
                      borderColor: active
                        ? theme.colors.foreground
                        : theme.colors.border,
                    },
                  ]}>
                  <ThemedText
                    type="small"
                    style={{
                      color: active
                        ? theme.colors.background
                        : theme.colors.secondary,
                      fontFamily: roofiTypography.fontFamily.body,
                      fontWeight: '500',
                    }}>
                    {cell.zoneName}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          <View style={styles.rowBetween}>
            <View style={styles.flexOne}>
              <ThemedText style={styles.cardSubTitle}>Farm Size</ThemedText>
              <ThemedText type="small" themeColor="secondary">
                {farmAreaHa.toFixed(1)} hectares
              </ThemedText>
            </View>
            <View style={styles.stepperRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease farm size"
                onPress={() => setFarmAreaHa(Math.max(0.5, farmAreaHa - 0.5))}
                style={[
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <ThemedText style={styles.stepperSymbol}>−</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase farm size"
                onPress={() => setFarmAreaHa(Math.min(50, farmAreaHa + 0.5))}
                style={[
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <ThemedText style={styles.stepperSymbol}>+</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Offline & Sync Status */}
        <View
          style={[
            styles.card,
            CardShadow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.rowBetween}>
            <View style={styles.flexOne}>
              <ThemedText style={styles.cardTitle}>
                Offline Pack & Sync
              </ThemedText>
              <ThemedText type="small" themeColor="secondary">
                {isConnected ? 'Online' : 'Offline'} · Source: {dataSourceMode}
                {queuedLogsCount > 0 ? ` · ${queuedLogsCount} queued` : ''}
              </ThemedText>
              {lastSyncedAt ? (
                <ThemedText type="small" themeColor="mutedText">
                  Last synced: {lastSyncedAt}
                </ThemedText>
              ) : null}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSyncing}
            onPress={() => void handleSync()}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.colors.primary,
                opacity: isSyncing || pressed ? 0.78 : 1,
              },
            ]}>
            <PlannerIcon name="repeat" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionBtnText}>
              {isSyncing ? 'Syncing...' : 'Sync Farm Data'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Sign Out / Switch Role */}
        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={({ pressed }) => [
            styles.signOutBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.78 : 1,
            },
          ]}>
          <ThemedText
            style={{
              color: theme.colors.error,
              fontFamily: roofiTypography.fontFamily.body,
              fontWeight: '500',
              fontSize: 14,
            }}>
            Switch Role / Sign Out
          </ThemedText>
        </Pressable>
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
  card: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  accountLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexOne: { flex: 1, gap: 2 },
  cardTitle: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '500',
    fontSize: 16,
  },
  cardSubTitle: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '500',
    fontSize: 14,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  cellChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cellChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 18,
  },
  actionBtn: {
    minHeight: 44,
    borderRadius: roofiRadii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: '500',
    fontSize: 14,
  },
  signOutBtn: {
    minHeight: 46,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
