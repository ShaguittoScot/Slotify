import { Image } from 'expo-image';
import { version } from 'expo/package.json';
import { StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { spacing, useAppTheme } from '@/shared/theme';

export function WebBadge() {
  const { isDark } = useAppTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="code" themeColor="secondary" style={styles.versionText}>
        v{version}
      </ThemedText>
      <Image
        source={
          isDark
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        style={styles.badgeImage}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing['5'],
    alignItems: 'center',
    gap: spacing['2'],
  },
  versionText: {
    textAlign: 'center',
  },
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});