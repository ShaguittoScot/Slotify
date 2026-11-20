/**
 * Business Detail Feature — Screen and Header Styles
 */

import { StyleSheet, Platform } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createBusinessDetailStyles(colors: ThemeColors, accentColor: string = colors.action.primary) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    screenContainer: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollContent: {
      paddingBottom: 120, // Espacio suficiente para no tapar contenido con el bottom bar fijo
    },

    // Barra de navegación superior
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      backgroundColor: colors.background.secondary,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.tertiary,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    navTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      marginHorizontal: 12,
      color: colors.text.primary,
    },
    navSpacer: {
      width: 40,
    },

    // Encabezado comercial
    headerCard: {
      backgroundColor: colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
      gap: 16,
    },
    headerMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatarBox: {
      width: 64,
      height: 64,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: accentColor,
      backgroundColor: colors.isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(99, 102, 241, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: {
      width: 64,
      height: 64,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: `${accentColor}50`,
      backgroundColor: colors.background.tertiary,
    },
    avatarText: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.isDark ? '#A78BFA' : accentColor,
    },
    headerTitleContainer: {
      flex: 1,
      gap: 6,
    },
    businessName: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: colors.text.primary,
    },
    categoryPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.10)',
      borderWidth: 1,
      borderColor: colors.isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.isDark ? '#A5B4FC' : accentColor,
    },
    slugRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: 4,
    },
    slugText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text.muted,
    },

    // Sección de información operativa
    infoCard: {
      backgroundColor: colors.background.secondary,
      marginTop: 16,
      marginHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border.main,
      padding: 16,
      gap: 14,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: colors.text.primary,
      marginBottom: 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoTextCol: {
      flex: 1,
      gap: 2,
    },
    infoLabel: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      color: colors.text.muted,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },

    // Bottom Bar fija con acción principal (Reservar cita)
    bottomBarContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background.secondary,
      borderTopWidth: 1,
      borderTopColor: colors.border.main,
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: colors.isDark ? 0.3 : 0.08,
          shadowRadius: 6,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)',
        },
      }),
    },
    bookCtaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: accentColor,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    bookCtaText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },

    // Estados de Carga (Skeleton)
    skeletonContainer: {
      padding: 16,
      gap: 16,
    },
    skeletonHeaderCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border.light,
      padding: 20,
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    },
    skeletonAvatar: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.background.tertiary,
    },
    skeletonHeaderLines: {
      flex: 1,
      gap: 8,
    },
    skeletonLineTitle: {
      width: '70%',
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.background.tertiary,
    },
    skeletonLinePill: {
      width: '40%',
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.background.tertiary,
    },
    skeletonLineSlug: {
      width: '55%',
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.background.tertiary,
    },
    skeletonInfoBox: {
      backgroundColor: colors.background.secondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border.light,
      padding: 16,
      gap: 12,
    },
    skeletonBarLong: {
      width: '85%',
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.background.tertiary,
    },
    skeletonBarShort: {
      width: '60%',
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.background.tertiary,
    },

    // Estados de Error y No Encontrado (404)
    feedbackCenter: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
    },
    feedbackCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.background.secondary,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border.main,
      padding: 28,
      alignItems: 'center',
      gap: 12,
    },
    feedbackIconCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.background.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    feedbackErrorIconCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.status.errorBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    feedbackTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text.primary,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    feedbackDescription: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 8,
    },
    feedbackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.action.primary,
    },
    feedbackButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.action.primaryText,
    },
  });
}
