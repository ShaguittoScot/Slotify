import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createBusinessCardStyles(
  colors: ThemeColors,
  accentColor: string
) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.isDark ? '#121216' : colors.background.secondary,
      borderColor: colors.isDark ? '#22222A' : colors.border.main,
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarBox: {
      width: 46,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${accentColor}50`,
      backgroundColor: `${accentColor}16`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 46,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${accentColor}40`,
      backgroundColor: colors.background.tertiary,
    },
    avatarText: {
      fontSize: 17,
      fontWeight: '800',
      color: accentColor,
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
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accentColor,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.muted,
    },
    bookBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 11,
      backgroundColor: accentColor,
    },
    bookBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    servicesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.isDark ? '#1D1D24' : colors.border.light,
    },
    serviceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.isDark ? '#191920' : colors.background.tertiary,
    },
    serviceBadgeName: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    serviceBadgePrice: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.primary,
    },
    moreServicesBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.isDark ? '#191920' : colors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreServicesText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: accentColor,
    },
  });
}
