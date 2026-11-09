import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createExploreScreenStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    content: {
      flex: 1,
    },
    flatListContent: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 100,
    },
    listPadding: {
      paddingHorizontal: 16,
      paddingTop: 14,
      gap: 12,
    },
    itemSeparator: {
      height: 12,
    },
    resultsHeader: {
      marginBottom: 10,
    },
    resultsText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.text.muted,
    },
  });
}

