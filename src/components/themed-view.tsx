
import { View, type ViewProps } from 'react-native';

import { useAppTheme, type ThemeColors } from '@/shared/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: keyof ThemeColors['background'];
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type = 'primary',
  ...otherProps
}: ThemedViewProps) {
  const { colors, isDark } = useAppTheme();

  const backgroundColor =
    (isDark ? darkColor : lightColor) ?? colors.background[type];

  return (
    <View
      style={[{ backgroundColor }, style]}
      {...otherProps}
    />
  );
}
