import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { roofiTypography, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextVariant =
  | 'hero'
  | 'kpi'
  | 'title'
  | 'subtitle'
  | 'sectionTitle'
  | 'default'
  | 'smallBold'
  | 'small'
  | 'captionUppercase'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextVariant;
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = 'default',
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        {
          color: theme[themeColor ?? 'foreground'],
        },
        styles[type],
        type === 'linkPrimary' ? { color: theme.primary } : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    fontFamily: roofiTypography.fontFamily.displayMedium,
    fontSize: roofiTypography.fontSize.displayM,
    lineHeight: roofiTypography.lineHeight.displayM,
    fontWeight: '500',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  kpi: {
    fontFamily: roofiTypography.fontFamily.displayMedium,
    fontSize: roofiTypography.fontSize.stat,
    lineHeight: roofiTypography.lineHeight.stat,
    fontWeight: '500',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: roofiTypography.fontFamily.displayMedium,
    fontSize: roofiTypography.fontSize.screenTitle,
    lineHeight: roofiTypography.lineHeight.screenTitle,
    fontWeight: '500',
    letterSpacing: -0.35,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: roofiTypography.fontFamily.displayMedium,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: -0.25,
  },
  sectionTitle: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.price,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  default: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.body,
    lineHeight: roofiTypography.lineHeight.body,
    fontWeight: '500',
  },
  smallBold: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.button,
    lineHeight: 18,
    fontWeight: '500',
  },
  small: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.label,
    lineHeight: roofiTypography.lineHeight.label,
    fontWeight: '400',
  },
  captionUppercase: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: roofiTypography.fontSize.caption,
    lineHeight: roofiTypography.lineHeight.caption,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  link: {
    fontFamily: roofiTypography.fontFamily.body,
    lineHeight: 22,
    fontSize: 13,
    fontWeight: '500',
  },
  linkPrimary: {
    fontFamily: roofiTypography.fontFamily.body,
    lineHeight: 22,
    fontSize: 13,
    fontWeight: '500',
  },
  code: {
    fontFamily: roofiTypography.fontFamily.body,
    fontWeight: Platform.select({ android: '500' }) ?? '500',
    fontSize: 11,
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },
});
