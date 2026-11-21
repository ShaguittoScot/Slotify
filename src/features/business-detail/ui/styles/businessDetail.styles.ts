/**
 * Business Detail Feature — Screen and Modular Components Styles
 * Adaptado a los temas Slotify Actual y Obsidian (Modo Claro y Oscuro)
 * Respetando el color de marca (accentColor / brandColor) del establecimiento.
 */

import { StyleSheet, Platform } from 'react-native';
import type { ThemeColors } from '@/shared/theme';

export function createBusinessDetailStyles(
  colors: ThemeColors,
  accentColor: string = colors.action.primary
) {
  const isDark = colors.isDark;

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
      paddingBottom: 110, // Espacio suficiente para que el CTA fijo no tape contenido
    },

    // ── 1. PORTADA Y HERO ──
    coverContainer: {
      height: 210,
      width: '100%',
      position: 'relative',
      backgroundColor: isDark ? '#141418' : '#27272A',
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    coverFallback: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#141418' : '#1E1E24',
    },
    coverOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    floatingNavBar: {
      position: 'absolute',
      top: 12,
      left: 16,
      right: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 20,
    },
    floatingCircleBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(20, 20, 24, 0.75)' : 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
      }),
    },

    // ── 2. TARJETA DE IDENTIDAD PRINCIPAL ──
    identityCard: {
      backgroundColor: colors.background.secondary,
      marginHorizontal: 16,
      marginTop: -38,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border.main,
      padding: 18,
      zIndex: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: 10,
        },
        android: {
          elevation: 5,
        },
        web: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        },
      }),
    },
    identityHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    logoBox: {
      width: 72,
      height: 72,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: accentColor,
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImage: {
      width: 72,
      height: 72,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: `${accentColor}60`,
      backgroundColor: colors.background.tertiary,
    },
    logoText: {
      fontSize: 28,
      fontWeight: '800',
      color: accentColor,
    },
    identityMainInfo: {
      flex: 1,
      gap: 5,
    },
    businessName: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: colors.text.primary,
      lineHeight: 28,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    sectorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.16)',
    },
    sectorPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#A5B4FC' : accentColor,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
    },
    verifiedText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#10B981',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    locationText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      color: colors.text.secondary,
    },

    // ── 3. CONTENEDOR COMÚN DE SECCIÓN ──
    sectionCard: {
      backgroundColor: colors.background.secondary,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border.main,
      padding: 18,
    },
    sectionHeader: {
      marginBottom: 12,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: colors.text.primary,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.text.muted,
      marginTop: 3,
      lineHeight: 18,
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.background.tertiary,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text.muted,
    },

    // ── 4. PRESENTACIÓN Y PROPUESTA DE VALOR ──
    aboutText: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 22,
    },
    highlightsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    highlightChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 11,
      borderRadius: 10,
      backgroundColor: colors.background.tertiary,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    highlightChipText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text.primary,
    },

    // ── 5. PROFESIONALES Y EQUIPO ──
    staffScrollContent: {
      gap: 12,
      paddingVertical: 4,
    },
    staffCard: {
      width: 148,
      backgroundColor: colors.background.tertiary,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border.light,
      padding: 12,
      alignItems: 'center',
      gap: 8,
    },
    staffAvatarBox: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.background.secondary,
      borderWidth: 1.5,
      borderColor: `${accentColor}50`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    staffAvatarImage: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.background.secondary,
    },
    staffAvatarText: {
      fontSize: 18,
      fontWeight: '800',
      color: accentColor,
    },
    staffName: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.text.primary,
      textAlign: 'center',
    },
    staffRoleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E4E4E7',
    },
    staffRoleText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.muted,
      textAlign: 'center',
    },

    // ── 6. GALERÍA DE FOTOGRAFÍAS ──
    galleryScrollContent: {
      gap: 12,
      paddingVertical: 4,
    },
    galleryCard: {
      width: 210,
      height: 140,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: colors.background.tertiary,
      borderWidth: 1,
      borderColor: colors.border.light,
      position: 'relative',
    },
    galleryImage: {
      width: '100%',
      height: '100%',
    },
    galleryOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    galleryCaption: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    // ── 7. UBICACIÓN, HORARIOS Y CONTACTO ──
    locationActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.background.tertiary,
      borderWidth: 1,
      borderColor: colors.border.light,
      marginTop: 12,
    },
    locationActionBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#A5B4FC' : accentColor,
    },
    scheduleContainer: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      gap: 8,
    },
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    scheduleDayText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    scheduleHoursText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text.primary,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    contactInfoCol: {
      flex: 1,
      gap: 2,
    },
    contactLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: colors.text.muted,
      letterSpacing: 0.5,
    },
    contactPhone: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
    },
    callBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
    },
    callBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#10B981',
    },

    // ── 8. BOTTOM BAR CON CTA DE RESERVA ──
    bottomBarContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background.secondary,
      borderTopWidth: 1,
      borderTopColor: colors.border.main,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 28 : 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 -3px 12px rgba(0, 0, 0, 0.06)',
        },
      }),
    },
    bottomBarSummaryCol: {
      flex: 1,
      gap: 2,
    },
    bottomBarSummaryLabel: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      color: colors.text.muted,
      letterSpacing: 0.5,
    },
    bottomBarPriceHint: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text.primary,
    },
    bookCtaButton: {
      flex: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: accentColor,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      ...Platform.select({
        ios: {
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    bookCtaText: {
      fontSize: 15.5,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },

    // ── 9. SKELETON / ESTADOS DE CARGA ──
    skeletonContainer: {
      padding: 16,
      gap: 16,
    },
    skeletonCover: {
      height: 180,
      borderRadius: 18,
      backgroundColor: colors.background.tertiary,
    },
    skeletonCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border.light,
      padding: 18,
      gap: 12,
    },
    skeletonLineLong: {
      width: '80%',
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.background.tertiary,
    },
    skeletonLineShort: {
      width: '50%',
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.background.tertiary,
    },

    // ── 10. MENSAJES DE ERROR Y 404 ──
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
