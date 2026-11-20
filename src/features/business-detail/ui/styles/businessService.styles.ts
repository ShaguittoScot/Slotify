/**
 * Business Detail Feature — Services Section & Cards Styles
 */

import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createBusinessServiceStyles(colors: ThemeColors, accentColor: string = colors.action.primary) {
  return StyleSheet.create({
    sectionContainer: {
      marginTop: 20,
      marginHorizontal: 16,
      gap: 12,
    },
    sectionHeader: {
      gap: 4,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: colors.text.primary,
    },
    serviceCountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      backgroundColor: colors.background.tertiary,
    },
    serviceCountText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text.secondary,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.text.muted,
      lineHeight: 18,
    },
    servicesList: {
      gap: 10,
    },

    // Tarjeta individual de servicio
    card: {
      backgroundColor: colors.background.secondary,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border.main,
      padding: 16,
      gap: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    serviceName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: colors.text.primary,
      lineHeight: 20,
    },
    priceTag: {
      fontSize: 16,
      fontWeight: '800',
      color: accentColor,
    },
    serviceDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.text.secondary,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      paddingTop: 10,
    },
    durationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    durationText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.muted,
    },
    bufferText: {
      fontSize: 11,
      color: colors.text.muted,
      fontStyle: 'italic',
    },

    // Estado vacío de servicios
    emptyBox: {
      backgroundColor: colors.background.secondary,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border.main,
      padding: 24,
      alignItems: 'center',
      gap: 8,
    },
    emptyIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text.primary,
    },
    emptyDescription: {
      fontSize: 13,
      textAlign: 'center',
      color: colors.text.muted,
      lineHeight: 18,
    },
  });
}
