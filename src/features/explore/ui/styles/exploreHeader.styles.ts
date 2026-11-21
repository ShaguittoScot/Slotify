import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createExploreHeaderStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.main,
      backgroundColor: colors.background.primary,
      gap: 12,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 2,
    },
    tagDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.text.accent,
    },
    tagLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: colors.text.muted,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: colors.text.primary,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border.main,
      backgroundColor: colors.background.secondary,
      paddingHorizontal: 14,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      height: '100%',
      color: colors.text.primary,
    },
    categoryScroll: {
      gap: 8,
      paddingVertical: 2,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 12,
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
      fontSize: 12.5,
    },
    categoryChipTextActive: {
      color: colors.action.primaryText,
      fontWeight: '700',
    },
    categoryChipTextInactive: {
      color: colors.text.muted,
      fontWeight: '600',
    },
  });
}
