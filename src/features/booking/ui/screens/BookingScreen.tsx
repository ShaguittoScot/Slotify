import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useAuthStore } from '@/features/auth/model';
import { useExploreStore } from '@/features/explore/model';
import { DEFAULT_BUSINESS_CATALOG } from '@/features/explore/constants/defaultBusinesses';
import type { BusinessDto } from '@/features/explore/types';
import { useCalendarStore } from '@/features/calendar/model';
import {
  FormSchema,
  FormField,
  PresentationStyle,
} from '@/features/dashboard/ui/screens/FormBuilderScreen';
import {
  FormViewer,
  BookingSubmissionSummary,
} from '@/features/dashboard/ui/components/FormViewer';
import {
  loadFormSchemaLocally,
  saveConsumerAppointmentLocally,
  ConsumerBookedAppointment,
} from '@/features/dashboard/model/formBranding';

const SECONDARY_COLOR_BY_SLUG: Record<string, string> = {
  'central-barber': '#C57747',
  'dental-sonrisas': '#2563EB',
  'zen-spa': '#0D9488',
  'glam-studio': '#F43F5E',
};

const SECTOR_OPTIONS_BY_CATEGORY: Record<string, { question: string; options: string[] }> = {
  Barbería: {
    question: '¿Tienes preferencia de barbero o estación?',
    options: ['Cualquier barbero disponible', 'Master Barber Principal', 'Sillón VIP Ejecutivo'],
  },
  Salud: {
    question: 'Motivo principal o especialista requerido',
    options: ['Valoración General / Limpieza', 'Especialista en Ortodoncia', 'Seguimiento de Tratamiento'],
  },
  'Spa & Bienestar': {
    question: 'Preferencia de ambiente y terapeuta',
    options: ['Cabina Relajante Estándar', 'Cabina Aromaterapia Deluxe', 'Terapeuta Senior'],
  },
  Belleza: {
    question: 'Estilista o especialista de preferencia',
    options: ['Primer especialista disponible', 'Directora Creativa / Stylist', 'Área Privada'],
  },
};

function formatSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Construye un FormSchema completo y pulido para cualquier establecimiento,
 * garantizando que el cliente siempre pueda elegir servicios, fecha/hora y llenar sus datos.
 */
function buildClientFormSchema(
  business: BusinessDto,
  savedCustomSchema: FormSchema | null,
  overrideStyle?: PresentationStyle
): FormSchema {
  const accentColor = business.brandColor || savedCustomSchema?.accentColor || '#6366F1';
  const secondaryColor =
    SECONDARY_COLOR_BY_SLUG[business.slug] ||
    savedCustomSchema?.secondaryColor ||
    accentColor;

  const services = (business.services || []).map((s) => ({
    id: s.id,
    name: s.name,
    price: Number(s.price),
    duration: Number(s.durationMinutes),
  }));

  const sectorMeta = SECTOR_OPTIONS_BY_CATEGORY[business.category || ''] || {
    question: 'Preferencia de atención o especialista',
    options: ['Cualquier especialista disponible', 'Especialista Principal', 'Atención Preferente'],
  };

  // Campos base garantizados para que el cliente llene todos sus datos de reserva
  const baseFields: FormField[] = [
    {
      id: 'field_services',
      type: 'service_catalog',
      question: '1. Selecciona los servicios que deseas agendar:',
      required: true,
    },
    {
      id: 'field_datetime',
      type: 'date_time',
      question: '2. Elige el día y horario de tu cita:',
      required: true,
    },
    {
      id: 'field_client_name',
      type: 'short_text',
      question: '3. Tu nombre completo:',
      required: true,
      placeholder: 'Ej. Alejandro Gómez',
    },
    {
      id: 'field_client_phone',
      type: 'phone',
      question: '4. Teléfono o WhatsApp de contacto:',
      required: true,
      placeholder: 'Ej. +52 55 1234 5678',
    },
    {
      id: 'field_sector_pref',
      type: 'single_choice',
      question: `5. ${sectorMeta.question}:`,
      required: false,
      options: sectorMeta.options,
    },
    {
      id: 'field_client_notes',
      type: 'paragraph',
      question: '6. Notas o peticiones especiales (opcional):',
      required: false,
      placeholder: 'Indica alergias, referencias o cualquier detalle adicional...',
    },
  ];

  // Si el administrador personalizó campos adicionales en el constructor, los incluimos
  if (savedCustomSchema && Array.isArray(savedCustomSchema.fields) && savedCustomSchema.fields.length > 0) {
    const extraCustomFields = savedCustomSchema.fields.filter(
      (f) =>
        f.type !== 'service_catalog' &&
        f.type !== 'date_time' &&
        !f.question.toLowerCase().includes('nombre completo') &&
        !f.question.toLowerCase().includes('teléfono') &&
        !f.question.toLowerCase().includes('telefono') &&
        !f.question.toLowerCase().includes('notas o peticiones')
    );

    if (extraCustomFields.length > 0) {
      // Insertamos preguntas personalizadas antes de las notas finales
      baseFields.splice(4, 1, ...extraCustomFields);
    }
  }

  return {
    title: savedCustomSchema?.title || 'Reserva tu Cita en Línea',
    description:
      savedCustomSchema?.description ||
      `Completa tus datos a continuación para confirmar tu espacio en ${business.name}.`,
    presentationStyle:
      overrideStyle || savedCustomSchema?.presentationStyle || 'classic_scroll',
    accentColor,
    secondaryColor,
    logoUrl: business.logoUrl || savedCustomSchema?.logoUrl || null,
    businessName: business.name,
    services: services.length > 0 ? services : undefined,
    fields: baseFields,
  };
}

export function BookingScreen() {
  const { slug: routeSlug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { businesses: storeBusinesses } = useExploreStore();
  const { addSlot } = useCalendarStore();

  const [loading, setLoading] = useState(true);
  const [savedLocalSchema, setSavedLocalSchema] = useState<FormSchema | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    routeSlug || 'central-barber'
  );
  const [styleOverride, setStyleOverride] = useState<PresentationStyle | undefined>(
    undefined
  );
  const [confirmedBooking, setConfirmedBooking] =
    useState<ConsumerBookedAppointment | null>(null);

  // Sincronizar cuando cambia el parámetro de ruta `slug`
  useEffect(() => {
    if (routeSlug) {
      setSelectedSlug(routeSlug);
    }
  }, [routeSlug]);

  // Cargar formulario personalizado guardado localmente si existe
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const local = await loadFormSchemaLocally();
        if (mounted && local && local.title && Array.isArray(local.fields)) {
          setSavedLocalSchema(local);
        }
      } catch {
        // Fallback silencioso a catálogo por defecto
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Catálogo combinado de negocios disponibles para el cliente
  const availableBusinesses = useMemo<BusinessDto[]>(() => {
    const baseList =
      storeBusinesses.length > 0 ? storeBusinesses : DEFAULT_BUSINESS_CATALOG;

    // Si el admin guardó una identidad propia en el constructor, la agregamos como opción destacada
    if (savedLocalSchema?.businessName) {
      const customSlug = 'mi-negocio';
      const alreadyExists = baseList.some(
        (b) =>
          b.slug === customSlug ||
          b.name.toLowerCase() === savedLocalSchema.businessName?.toLowerCase()
      );
      if (!alreadyExists) {
        const customBiz: BusinessDto = {
          id: 'custom-admin-biz',
          name: savedLocalSchema.businessName,
          slug: customSlug,
          category: 'Destacado',
          logoUrl: savedLocalSchema.logoUrl || null,
          brandColor: savedLocalSchema.accentColor || '#6366F1',
          phone: '+52 55 8899 0011',
          minAdvanceHours: 1,
          services: DEFAULT_BUSINESS_CATALOG[0].services,
        };
        return [customBiz, ...baseList];
      }
    }

    return baseList;
  }, [storeBusinesses, savedLocalSchema]);

  // Resolver el establecimiento activo según `selectedSlug`
  const activeBusiness = useMemo<BusinessDto>(() => {
    const found = availableBusinesses.find(
      (b) => b.slug.toLowerCase() === selectedSlug.toLowerCase()
    );
    if (found) return found;

    return {
      id: `custom-${selectedSlug}`,
      name:
        savedLocalSchema?.businessName || formatSlugToTitle(selectedSlug || 'Slotify'),
      slug: selectedSlug || 'central-barber',
      category: 'Servicios Profesionales',
      logoUrl:
        savedLocalSchema?.logoUrl || DEFAULT_BUSINESS_CATALOG[0].logoUrl,
      brandColor: savedLocalSchema?.accentColor || '#6366F1',
      phone: '+52 55 1234 5678',
      minAdvanceHours: 2,
      services: DEFAULT_BUSINESS_CATALOG[0].services,
    };
  }, [availableBusinesses, selectedSlug, savedLocalSchema]);

  // Esquema final activo para FormViewer
  const activeSchema = useMemo<FormSchema>(() => {
    return buildClientFormSchema(activeBusiness, savedLocalSchema, styleOverride);
  }, [activeBusiness, savedLocalSchema, styleOverride]);

  // Pre-llenado inteligente con los datos del cliente autenticado
  const initialClientAnswers = useMemo(() => {
    const prefill: Record<string, any> = {};
    if (user?.fullName && user.fullName !== 'Pendiente') {
      prefill['field_client_name'] = user.fullName;
      prefill['f1'] = user.fullName;
    }
    return prefill;
  }, [user?.fullName]);

  const handleFormSubmit = async (
    _answers: Record<string, any>,
    summary: BookingSubmissionSummary
  ) => {
    const newBooking: ConsumerBookedAppointment = {
      id: `apt-${Date.now()}`,
      businessSlug: activeBusiness.slug,
      businessName: activeBusiness.name,
      accentColor: activeSchema.accentColor,
      clientName:
        summary.clientName || user?.fullName || 'Cliente Slotify',
      clientPhone: summary.clientPhone || '+52 55 0000 0000',
      serviceNames: summary.serviceNames,
      totalPrice: summary.totalPrice,
      totalDuration: summary.totalDuration,
      dateLabel: summary.dateLabel,
      isoDate: summary.isoDate,
      timeLabel: summary.timeLabel,
      notes: summary.notes,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    // 1. Persistir en almacenamiento local de citas de cliente
    await saveConsumerAppointmentLocally(newBooking);

    // 2. Sincronizar con useCalendarStore para que aparezca de inmediato en Mis Citas y Agenda
    const startDate = new Date(summary.isoDate);
    const isPM = summary.timeLabel.includes('PM');
    const [timePart] = summary.timeLabel.split(' ');
    const [rawHours, rawMinutes] = (timePart || '10:00').split(':').map(Number);
    let hours = rawHours || 10;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    startDate.setHours(hours, rawMinutes || 0, 0, 0);

    const endDate = new Date(
      startDate.getTime() + (summary.totalDuration || 30) * 60000
    );

    addSlot({
      resourceId: newBooking.id,
      type: 'appointment',
      title: summary.serviceNames.join(' + '),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      status: 'confirmed',
      employeeName: activeBusiness.name,
      clientName: newBooking.clientName,
      clientPhone: newBooking.clientPhone,
      agreedTotal: summary.totalPrice,
      servicePrice: `$${summary.totalPrice}`,
    });

    // 3. Mostrar comprobante interactivo de confirmación
    setConfirmedBooking(newBooking);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <ActivityIndicator size="large" color={colors.action.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Preparando formulario de reservación...
        </Text>
      </View>
    );
  }

  const isCurrentSlideMode =
    activeSchema.presentationStyle === 'interactive_slides';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[
        styles.safeArea,
        { backgroundColor: colors.background.primary },
      ]}
    >
      {/* ─── Barra Superior del Formulario de Cliente ─── */}
      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: colors.background.primary,
            borderBottomColor: isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <View style={styles.topHeaderLeft}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark ? '#262628' : '#F3F4F6',
              },
            ]}
            onPress={() => {
              if (routeSlug) {
                router.back();
              } else {
                router.push('/(main)/explore' as any);
              }
            }}
            activeOpacity={0.75}
          >
            <Feather
              name={routeSlug ? 'arrow-left' : 'compass'}
              size={18}
              color={colors.text.primary}
            />
          </TouchableOpacity>
          <View>
            <Text style={[styles.topHeaderTitle, { color: colors.text.primary }]}>
              Formulario de Reserva
            </Text>
            <Text style={[styles.topHeaderSub, { color: colors.text.muted }]}>
              Completa tus datos para agendar
            </Text>
          </View>
        </View>

        {/* Botón para alternar entre Vista Clásica (Scroll) y Paso a Paso (Slides) */}
        <TouchableOpacity
          style={[
            styles.modeToggleChip,
            {
              backgroundColor: `${activeSchema.accentColor}16`,
              borderColor: `${activeSchema.accentColor}38`,
            },
          ]}
          onPress={() =>
            setStyleOverride(
              isCurrentSlideMode ? 'classic_scroll' : 'interactive_slides'
            )
          }
          activeOpacity={0.75}
        >
          <Feather
            name={isCurrentSlideMode ? 'list' : 'layers'}
            size={14}
            color={activeSchema.accentColor}
          />
          <Text
            style={[
              styles.modeToggleText,
              { color: activeSchema.accentColor },
            ]}
          >
            {isCurrentSlideMode ? 'Modo Lista' : 'Paso a Paso'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Selector Rápido de Establecimiento ─── */}
      <View
        style={[
          styles.businessSelectorContainer,
          {
            backgroundColor: colors.background.primary,
            borderBottomColor: isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.businessSelectorScroll}
        >
          {availableBusinesses.map((biz) => {
            const isSelected =
              biz.slug.toLowerCase() === activeBusiness.slug.toLowerCase();
            const bizColor = biz.brandColor || '#6366F1';

            return (
              <TouchableOpacity
                key={biz.id}
                onPress={() => setSelectedSlug(biz.slug)}
                activeOpacity={0.8}
                style={[
                  styles.businessChip,
                  {
                    backgroundColor: isSelected
                      ? bizColor
                      : isDark
                      ? '#1F1F22'
                      : '#F4F4F5',
                    borderColor: isSelected
                      ? bizColor
                      : isDark
                      ? '#333'
                      : '#E4E4E7',
                  },
                ]}
              >
                <View
                  style={[
                    styles.businessDot,
                    {
                      backgroundColor: isSelected ? '#FFFFFF' : bizColor,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.businessChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text.primary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {biz.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Cuerpo del Formulario Interactivo ─── */}
      <View style={{ flex: 1 }}>
        <FormViewer
          schema={activeSchema}
          initialAnswers={initialClientAnswers}
          onSubmit={handleFormSubmit}
          submitButtonLabel="Confirmar y Agendar Cita"
        />
      </View>

      {/* ─── Modal Pulido de Confirmación de Reserva ─── */}
      <Modal
        visible={Boolean(confirmedBooking)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          {confirmedBooking && (
            <Animated.View
              entering={ZoomIn.duration(300)}
              style={[
                styles.confirmationCard,
                {
                  backgroundColor: isDark ? '#1A1A1E' : '#FFFFFF',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <LinearGradient
                colors={[
                  confirmedBooking.accentColor,
                  activeSchema.secondaryColor || confirmedBooking.accentColor,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmationBanner}
              >
                <View style={styles.checkIconCircle}>
                  <Feather name="check" size={30} color={confirmedBooking.accentColor} />
                </View>
                <Text style={styles.confirmationTitle}>¡Reserva Confirmada!</Text>
                <Text style={styles.confirmationSubtitle}>
                  Tu cita en {confirmedBooking.businessName} ha sido registrada con éxito.
                </Text>
              </LinearGradient>

              <View style={styles.summaryList}>
                <View style={styles.summaryRow}>
                  <Feather name="user" size={16} color={colors.text.muted} />
                  <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                    Cliente:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                    {confirmedBooking.clientName}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Feather name="phone" size={16} color={colors.text.muted} />
                  <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                    Contacto:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                    {confirmedBooking.clientPhone}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Feather name="calendar" size={16} color={colors.text.muted} />
                  <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                    Fecha y Hora:
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                    {confirmedBooking.dateLabel} • {confirmedBooking.timeLabel}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Feather name="scissors" size={16} color={colors.text.muted} />
                  <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                    Servicios:
                  </Text>
                  <Text
                    style={[styles.summaryValue, { color: colors.text.primary }]}
                    numberOfLines={2}
                  >
                    {confirmedBooking.serviceNames.join(', ')}
                  </Text>
                </View>

                {confirmedBooking.totalPrice > 0 && (
                  <View
                    style={[
                      styles.totalHighlightBox,
                      {
                        backgroundColor: isDark ? '#252529' : '#F8FAFC',
                        borderColor: `${confirmedBooking.accentColor}40`,
                      },
                    ]}
                  >
                    <Text style={[styles.totalLabel, { color: colors.text.secondary }]}>
                      Total estimado ({confirmedBooking.totalDuration} min)
                    </Text>
                    <Text
                      style={[
                        styles.totalAmount,
                        { color: confirmedBooking.accentColor },
                      ]}
                    >
                      ${confirmedBooking.totalPrice.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.confirmationActions}>
                <AnimatedPressable
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: confirmedBooking.accentColor },
                  ]}
                  onPress={() => {
                    setConfirmedBooking(null);
                    router.push('/(main)' as any);
                  }}
                >
                  <Feather name="calendar" size={17} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Ver en Mis Citas</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                    },
                  ]}
                  onPress={() => setConfirmedBooking(null)}
                >
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: colors.text.primary },
                    ]}
                  >
                    Hacer otra reservación
                  </Text>
                </AnimatedPressable>
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
  },

  // Header superior
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topHeaderSub: {
    fontSize: 12,
    marginTop: 1,
  },
  modeToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Selector horizontal de negocios
  businessSelectorContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  businessSelectorScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  businessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  businessDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  businessChipText: {
    fontSize: 12.5,
  },

  // Modal de Confirmación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  confirmationBanner: {
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  checkIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  confirmationSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 19,
  },
  summaryList: {
    padding: 20,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 90,
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  totalHighlightBox: {
    marginTop: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: '800',
  },
  confirmationActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
