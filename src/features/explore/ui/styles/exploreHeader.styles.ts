import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createExploreHeaderStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.main,
      backgroundColor: colors.isDark
        ? 'rgba(18, 18, 24, 0.96)'
        : 'rgba(255, 255, 255, 0.96)',
      gap: 10,
    },
    headerTitle: {
      fontSize: 21,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: colors.text.primary,
    },
    headerSubtitle: {
      fontSize: 13,
      lineHeight: 17,
      color: colors.text.secondary,
    },
    searchRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.main,
      backgroundColor: colors.background.secondary,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      height: '100%',
      color: colors.text.primary,
    },
    searchBtn: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.action.primary,
    },
    categoryScroll: {
      gap: 8,
      paddingVertical: 2,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 18,
      borderWidth: 1,
    },
    categoryChipActive: {
      backgroundColor: colors.action.primary,
      borderColor: colors.action.primary,
    },
    categoryChipInactive: {
      backgroundColor: colors.background.secondary,
      borderColor: colors.border.main,
    },
    categoryChipText: {
      fontSize: 13,
    },
    categoryChipTextActive: {
      color: colors.action.primaryText,
      fontWeight: '700',
    },
    categoryChipTextInactive: {
      color: colors.text.secondary,
      fontWeight: '500',
    },
  });
}

