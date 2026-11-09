import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createBusinessCardStyles(colors: ThemeColors, accentColor: string) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background.secondary,
      borderColor: colors.isDark ? colors.border.light : colors.border.main,
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      gap: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatarBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: accentColor,
      backgroundColor: colors.isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(99, 102, 241, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${accentColor}40`,
      backgroundColor: colors.background.tertiary,
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.isDark ? '#A78BFA' : accentColor,
    },
    businessInfo: {
      flex: 1,
      gap: 3,
    },
    businessName: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.text.primary,
    },
    badgeContainer: {
      flexDirection: 'row',
    },
    categoryBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.10)',
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.isDark ? '#818CF8' : colors.action.primary,
    },
    servicesContainer: {
      gap: 6,
      marginTop: 2,
    },
    servicesHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    servicesLabel: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      color: colors.text.muted,
    },
    servicesNote: {
      fontSize: 11,
      fontStyle: 'italic',
      color: colors.text.muted,
    },
    servicesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    serviceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: colors.background.tertiary,
    },
    serviceBadgeName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.primary,
    },
    serviceBadgeMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    serviceBadgePrice: {
      fontSize: 12,
      fontWeight: '700',
      color: accentColor,
    },
    serviceBadgeDuration: {
      fontSize: 11,
      color: colors.text.muted,
    },
    metaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      paddingTop: 10,
    },
    slugContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
    },
    slugText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text.muted,
    },
    bookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 9,
      backgroundColor: accentColor,
    },
    bookBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}

