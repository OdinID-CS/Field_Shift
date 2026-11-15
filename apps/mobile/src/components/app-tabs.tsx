import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlannerIcon, type PlannerIconName } from '@/components/icons';
import {
  brandPalette,
  roofiNavigation,
  roofiRadii,
  roofiTypography,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { toast } from '@/lib/toast';
import { useTheme } from '@/theme/useTheme';

const VISIBLE_TABS = new Set(['index', 'calendar', 'compare', 'passport']);

const tabIcons: Record<string, PlannerIconName> = {
  index: 'home',
  calendar: 'calendar',
  compare: 'compare',
  passport: 'passport',
};

type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

export function RoofiBottomTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';
  const {
    dataSourceMode,
    isConnected,
    isSyncing,
    queuedLogsCount,
    refreshLivePilotData,
  } = usePilotState();

  const activeRouteName = state.routes[state.index]?.name;
  if (activeRouteName && !VISIBLE_TABS.has(activeRouteName)) {
    return null;
  }

  // Dynamic fill color for the right-side Sync extension tab based on live status
  const syncFillColor = isSyncing
    ? brandPalette.ultramarineBlue
    : !isConnected
      ? colors.error
      : queuedLogsCount > 0
        ? brandPalette.golden
        : colors.success;

  const syncIconColor =
    !isSyncing && isConnected && queuedLogsCount > 0
      ? brandPalette.chineseBlack
      : '#FFFFFF';

  const sourceLabel =
    dataSourceMode === 'supabase'
      ? 'Live Supabase'
      : dataSourceMode === 'cached'
        ? 'Cached Cell'
        : 'Ashanti Bundle';

  const handleSyncPress = async () => {
    await refreshLivePilotData();
    if (!isConnected) {
      toast.warning(
        'Offline mode',
        `Showing ${sourceLabel}${queuedLogsCount > 0 ? ` · ${queuedLogsCount} queued` : ''}.`,
      );
    } else if (queuedLogsCount > 0) {
      toast.info(
        `Syncing ${queuedLogsCount} queued item(s)`,
        `${sourceLabel} · Flushing offline field queue to Supabase.`,
      );
    } else {
      toast.success(
        `Synced · ${sourceLabel}`,
        '30 m HLS, 30 m iSDAsoil, and field logs are up to date.',
      );
    }
  };

  const visibleRoutes = state.routes.filter((route) => {
    if (!VISIBLE_TABS.has(route.name)) return false;
    const options = descriptors[route.key]?.options as
      | { href?: string | null }
      | undefined;
    return options?.href !== null;
  });

  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2);

  const renderTabItem = (route: (typeof state.routes)[number]) => {
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const options = descriptors[route.key]?.options as
      | {
          tabBarLabel?: string;
          title?: string;
          tabBarAccessibilityLabel?: string;
        }
      | undefined;

    const isFocused = state.index === routeIndex;
    const label =
      typeof options?.tabBarLabel === 'string'
        ? options.tabBarLabel
        : typeof options?.title === 'string'
          ? options.title
          : route.name;

    const iconName = tabIcons[route.name] ?? 'home';

    const onPress = () => {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigateToTab(route.key);
      }
    };

    const onLongPress = () => {
      emitter.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    if (isFocused) {
      return (
        <Pressable
          key={route.key}
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
          onPress={onPress}
          onLongPress={onLongPress}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: roofiRadii.pill,
            backgroundColor: roofiNavigation.activeSurface,
            opacity: pressed ? 0.8 : 1,
          })}>
          <PlannerIcon
            name={iconName}
            size={21}
            color={roofiNavigation.foreground}
            strokeWidth={2.1}
          />
          <Text
            numberOfLines={1}
            style={{
              color: roofiNavigation.foreground,
              fontFamily: roofiTypography.fontFamily.body,
              fontSize: 14,
              letterSpacing: -0.2,
            }}>
            {label}
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={{ selected: false }}
        accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => ({
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 13,
          paddingVertical: 9,
          borderRadius: roofiRadii.pill,
          opacity: pressed ? 0.5 : 1,
        })}>
        <PlannerIcon
          name={iconName}
          size={21}
          color={roofiNavigation.inactive}
          strokeWidth={1.7}
        />
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      {/* Primary 4-tab pill dock with half-floating center Chat FAB */}
      <View style={{ position: 'relative', alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 28,
            backgroundColor: roofiNavigation.background,
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(23,23,23,0.08)',
            elevation: 8,
            shadowColor: '#171717',
            shadowOpacity: isDark ? 0.4 : 0.16,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 4 },
            gap: 4,
          }}>
          {leftRoutes.map(renderTabItem)}
          <View style={{ width: 58 }} />
          {rightRoutes.map(renderTabItem)}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open ScalarField AI Advisor Chat"
          onPress={() => router.push('/chat')}
          style={({ pressed }) => ({
            position: 'absolute',
            top: -22,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: brandPalette.ultramarineBlue,
            borderWidth: 3,
            borderColor: colors.background,
            elevation: 10,
            shadowColor: brandPalette.ultramarineBlue,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            opacity: pressed ? 0.85 : 1,
          })}>
          <PlannerIcon name="chat" size={24} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Detached right-side Sync extension tab with status fill & queue count badge */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sync satellite data and offline queue (${queuedLogsCount} queued)`}
        onPress={() => void handleSyncPress()}
        style={({ pressed }) => ({
          position: 'relative',
          width: 53,
          height: 53,
          borderRadius: 27,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: syncFillColor,
          borderWidth: 2,
          borderColor: isDark ? '#171717' : '#FFFFFF',
          elevation: 8,
          shadowColor: '#171717',
          shadowOpacity: isDark ? 0.4 : 0.18,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          opacity: pressed ? 0.82 : 1,
        })}>
        <PlannerIcon
          name="repeat"
          size={21}
          color={syncIconColor}
          strokeWidth={2.1}
        />

        {queuedLogsCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              minWidth: 22,
              height: 22,
              paddingHorizontal: 5,
              borderRadius: roofiRadii.pill,
              backgroundColor: brandPalette.chineseBlack,
              borderWidth: 2,
              borderColor: isDark ? '#27292E' : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: roofiTypography.fontFamily.body,
                fontSize: 11,
                fontWeight: '500',
              }}>
              {queuedLogsCount > 99 ? '99+' : queuedLogsCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <RoofiBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarAccessibilityLabel: 'Home' }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarAccessibilityLabel: 'Calendar' }}
      />
      <Tabs.Screen
        name="compare"
        options={{ title: 'Compare', tabBarAccessibilityLabel: 'Compare' }}
      />
      <Tabs.Screen
        name="passport"
        options={{ title: 'Passport', tabBarAccessibilityLabel: 'Passport' }}
      />
    </Tabs>
  );
}
