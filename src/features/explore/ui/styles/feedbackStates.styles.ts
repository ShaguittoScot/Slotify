import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createFeedbackStatesStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Skeleton Card
    skeletonCard: {
      backgroundColor: colors.background.secondary,
      borderColor: colors.border.main,
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      gap: 10,
    },
    skeletonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    skeletonAvatar: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background.tertiary,
    },
    skeletonInfo: {
      flex: 1,
      gap: 6,
    },
    skeletonBarLong: {
      width: '60%',
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.background.tertiary,
    },
    skeletonBarShort: {
      width: '35%',
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.background.tertiary,
    },
    skeletonFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      paddingTop: 10,
    },
    skeletonPill: {
      width: 100,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.background.tertiary,
    },
    skeletonBtn: {
      width: 75,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.background.tertiary,
    },

    // Empty & Error States
    container: {
      backgroundColor: colors.background.secondary,
      borderColor: colors.border.main,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
    },
    errorContainer: {
      backgroundColor: colors.background.secondary,
      borderColor: colors.status.error + '50',
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.status.errorBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.text.primary,
    },
    description: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      color: colors.text.muted,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
      marginTop: 6,
      backgroundColor: colors.action.primary,
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.action.primaryText,
    },
  });
}

