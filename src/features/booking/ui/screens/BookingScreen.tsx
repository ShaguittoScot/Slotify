import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '@/shared/theme';
import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import { supabase } from '@/shared/lib/supabase';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useAuthStore } from '@/features/auth/model';
import { useExploreStore } from '@/features/explore/model';
import type { BusinessDto } from '@/features/explore/types';
import { useCalendarStore } from '@/features/calendar/model';
import {
  resolveBusinessTimeZone,
  scheduleInstant,
  toBusinessClock,
} from '@/features/calendar/model/businessTime';
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

interface PublicBusinessBookingDto {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  timeZone?: string;
  sector?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  minAdvanceHours?: number;
  maxAdvanceDays?: number;
  services?: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  }[];
  formConfig?: {
    title?: string;
    description?: string;
    presentationStyle?: PresentationStyle;
    accentColor?: string;
    secondaryColor?: string;
    logoUrl?: string | null;
    businessName?: string;
    fields?: FormField[];
  } | null;
}

interface PublicAppointmentConfirmationDto {
  id: string;
  businessName: string;
  businessSlug: string;
  startTime: string;
  endTime: string;
  clientName: string;
  agreedTotal: number;
  status: string;
  cancellationToken?: string;
}

type ConfirmedReceipt = ConsumerBookedAppointment & {
  cancellationToken?: string;
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

function parseTimeLabelTo24h(label: string): string {
  const cleaned = label.trim().toUpperCase();
  const match = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/.exec(cleaned);
  if (!match) return '10:00';
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3];
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function buildClientFormSchema(
  business: BusinessDto,
  savedCustomSchema: FormSchema | null,
  overrideStyle?: PresentationStyle
): FormSchema {
  const accentColor = business.brandColor || savedCustomSchema?.accentColor || '#18181B';
  const secondaryColor = savedCustomSchema?.secondaryColor || accentColor;

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
  const {
    businesses: storeBusinesses,
    isLoading: exploreLoading,
    fetchBusinesses,
  } = useExploreStore();
  const { addSlot } = useCalendarStore();

  const [savedLocalSchema, setSavedLocalSchema] = useState<FormSchema | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(routeSlug || '');
  const [publicBusiness, setPublicBusiness] = useState<PublicBusinessBookingDto | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState<boolean>(Boolean(routeSlug));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [styleOverride, setStyleOverride] = useState<PresentationStyle | undefined>(
    undefined
  );
  const [confirmedBooking, setConfirmedBooking] =
    useState<ConfirmedReceipt | null>(null);

  // Sincronizar cuando cambia el parámetro de ruta `slug`
  useEffect(() => {
    if (routeSlug) {
      setSelectedSlug(routeSlug);
    }
  }, [routeSlug]);

  // Cargar catálogo público desde backend cuando no viene `routeSlug`
  useEffect(() => {
    if (!routeSlug && storeBusinesses.length === 0) {
      void fetchBusinesses();
    }
  }, [routeSlug, storeBusinesses.length, fetchBusinesses]);

  // Seleccionar el primer negocio real disponible si no hubo `slug` inicial
  useEffect(() => {
    if (!selectedSlug && storeBusinesses.length > 0) {
      setSelectedSlug(storeBusinesses[0].slug);
    }
  }, [selectedSlug, storeBusinesses]);

  // Cargar esquema local opcional del admin si aplica
  useEffect(() => {
    let mounted = true;
    loadFormSchemaLocally()
      .then((local) => {
        if (mounted && local && local.title && Array.isArray(local.fields)) {
          setSavedLocalSchema(local);
        }
      })
      .catch(() => {
        // Sin esquema local guardado
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Obtener configuración pública del negocio activo desde el backend
  useEffect(() => {
    if (!selectedSlug) {
      setPublicBusiness(null);
      setLoadingBusiness(false);
      return;
    }

    let cancelled = false;
    const loadPublicBusiness = async () => {
      setLoadingBusiness(true);
      setLoadError(null);
      try {
        const res = await apiClient.get<{ data: PublicBusinessBookingDto }>(
          API_ENDPOINTS.PUBLIC_BOOKING.GET_BUSINESS(selectedSlug)
        );
        if (cancelled) return;
        if (res.data?.data?.id) {
          setPublicBusiness(res.data.data);
        } else {
          setPublicBusiness(null);
          setLoadError('No se encontró la información del establecimiento.');
        }
      } catch (err) {
        if (cancelled) return;
        setPublicBusiness(null);
        const message = isAxiosError<{ error?: string; message?: string }>(err)
          ? err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            'No se pudo cargar el formulario de reserva.'
          : 'No se pudo cargar el formulario de reserva.';
        setLoadError(message);
      } finally {
        if (!cancelled) setLoadingBusiness(false);
      }
    };

    void loadPublicBusiness();
    return () => {
      cancelled = true;
    };
  }, [selectedSlug, retryKey]);

  const availableBusinesses = useMemo<BusinessDto[]>(() => {
    const map = new Map<string, BusinessDto>();
    storeBusinesses.forEach((b) => {
      if (b?.slug) map.set(b.slug.toLowerCase(), b);
    });
    if (publicBusiness?.slug && !map.has(publicBusiness.slug.toLowerCase())) {
      map.set(publicBusiness.slug.toLowerCase(), {
        id: publicBusiness.id,
        name: publicBusiness.name,
        slug: publicBusiness.slug,
        phone: publicBusiness.phone ?? undefined,
        category: publicBusiness.sector || 'Servicios Profesionales',
        timeZone: publicBusiness.timeZone,
        minAdvanceHours: publicBusiness.minAdvanceHours,
        maxAdvanceDays: publicBusiness.maxAdvanceDays,
        logoUrl: publicBusiness.logoUrl,
        brandColor: publicBusiness.brandColor,
        services: (publicBusiness.services || []).map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
        })),
      });
    }
    return Array.from(map.values());
  }, [storeBusinesses, publicBusiness]);

  const activeBusiness = useMemo<BusinessDto | null>(() => {
    if (publicBusiness) {
      return {
        id: publicBusiness.id,
        name: publicBusiness.name,
        slug: publicBusiness.slug,
        phone: publicBusiness.phone ?? undefined,
        category: publicBusiness.sector || 'Servicios Profesionales',
        timeZone: publicBusiness.timeZone,
        minAdvanceHours: publicBusiness.minAdvanceHours,
        maxAdvanceDays: publicBusiness.maxAdvanceDays,
        logoUrl: publicBusiness.logoUrl,
        brandColor: publicBusiness.brandColor,
        services: (publicBusiness.services || []).map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
        })),
      };
    }

    if (!selectedSlug) return null;
    return (
      availableBusinesses.find(
        (b) => b.slug.toLowerCase() === selectedSlug.toLowerCase()
      ) ?? null
    );
  }, [publicBusiness, availableBusinesses, selectedSlug]);

  const effectiveFormSchema = useMemo<FormSchema | null>(() => {
    if (!activeBusiness) return null;

    if (publicBusiness?.formConfig && Array.isArray(publicBusiness.formConfig.fields)) {
      return {
        title: publicBusiness.formConfig.title || 'Reserva tu Cita en Línea',
        description:
          publicBusiness.formConfig.description ||
          `Completa tus datos para confirmar tu espacio en ${activeBusiness.name}.`,
        presentationStyle:
          publicBusiness.formConfig.presentationStyle || 'classic_scroll',
        accentColor:
          publicBusiness.formConfig.accentColor ||
          activeBusiness.brandColor ||
          '#18181B',
        secondaryColor: publicBusiness.formConfig.secondaryColor,
        logoUrl: publicBusiness.formConfig.logoUrl ?? activeBusiness.logoUrl ?? null,
        businessName: publicBusiness.formConfig.businessName || activeBusiness.name,
        fields: publicBusiness.formConfig.fields,
      };
    }

    const matchingLocal =
      savedLocalSchema?.businessName &&
      savedLocalSchema.businessName.trim().toLowerCase() ===
        activeBusiness.name.trim().toLowerCase()
        ? savedLocalSchema
        : null;

    return matchingLocal;
  }, [activeBusiness, publicBusiness, savedLocalSchema]);

  const activeSchema = useMemo<FormSchema | null>(() => {
    if (!activeBusiness) return null;
    return buildClientFormSchema(activeBusiness, effectiveFormSchema, styleOverride);
  }, [activeBusiness, effectiveFormSchema, styleOverride]);

  const initialClientAnswers = useMemo(() => {
    const prefill: Record<string, any> = {};
    if (user?.fullName && user.fullName !== 'Pendiente') {
      prefill['field_client_name'] = user.fullName;
      prefill['f1'] = user.fullName;
    }
    return prefill;
  }, [user?.fullName]);

  const handleRetry = useCallback(() => {
    if (!routeSlug && storeBusinesses.length === 0) {
      void fetchBusinesses();
    }
    setRetryKey((k) => k + 1);
  }, [routeSlug, storeBusinesses.length, fetchBusinesses]);

  const handleFormSubmit = async (
    _answers: Record<string, any>,
    summary: BookingSubmissionSummary
  ) => {
    if (!activeBusiness || !activeSchema || isSubmitting) return;

    const tz = resolveBusinessTimeZone(
      publicBusiness?.timeZone || activeBusiness.timeZone
    );
    const wallDay = toBusinessClock(summary.isoDate, tz);
    const time24 = parseTimeLabelTo24h(summary.timeLabel);
    const startDate = scheduleInstant(wallDay, time24, tz);

    if (!startDate) {
      Alert.alert(
        'Horario no válido',
        'No fue posible interpretar la fecha u hora elegida. Intenta con otro horario.'
      );
      return;
    }

    const durationMinutes = Math.max(5, summary.totalDuration || 30);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);
    const clientName =
      summary.clientName || user?.fullName || 'Cliente Slotify';
    const clientPhone =
      summary.clientPhone && summary.clientPhone !== 'Sin especificar'
        ? summary.clientPhone
        : undefined;

    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const res = await apiClient.post<{ data: PublicAppointmentConfirmationDto }>(
        API_ENDPOINTS.PUBLIC_BOOKING.CREATE_APPOINTMENT(activeBusiness.slug),
        {
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          durationMinutes,
          clientName,
          clientPhone,
          clientEmail: user?.email || undefined,
          agreedTotal: summary.totalPrice,
          notes: summary.notes || undefined,
        },
        accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : undefined
      );

      const created = res.data?.data;
      if (!created?.id) {
        Alert.alert(
          'No se pudo agendar',
          'El servidor no confirmó la creación de la cita.'
        );
        return;
      }

      const normalizedStatus: 'confirmed' | 'pending' =
        created.status === 'pending' ? 'pending' : 'confirmed';

      const newBooking: ConfirmedReceipt = {
        id: created.id,
        businessSlug: created.businessSlug || activeBusiness.slug,
        businessName: created.businessName || activeBusiness.name,
        accentColor: activeSchema.accentColor,
        clientName: created.clientName || clientName,
        clientPhone: clientPhone || 'Sin especificar',
        serviceNames: summary.serviceNames,
        totalPrice: Number(created.agreedTotal ?? summary.totalPrice),
        totalDuration: durationMinutes,
        dateLabel: summary.dateLabel,
        isoDate: created.startTime || startDate.toISOString(),
        timeLabel: summary.timeLabel,
        notes: summary.notes,
        status: normalizedStatus,
        createdAt: new Date().toISOString(),
        cancellationToken: created.cancellationToken,
      };

      await saveConsumerAppointmentLocally(newBooking);

      addSlot({
        resourceId: created.id,
        type: 'appointment',
        title: summary.serviceNames.join(' + '),
        startTime: created.startTime || startDate.toISOString(),
        endTime: created.endTime || endDate.toISOString(),
        status: normalizedStatus,
        employeeName: activeBusiness.name,
        clientName: newBooking.clientName,
        clientPhone: clientPhone,
        agreedTotal: newBooking.totalPrice,
        servicePrice: `$${newBooking.totalPrice}`,
      });

      setConfirmedBooking(newBooking);
    } catch (err) {
      const message = isAxiosError<{ error?: string; message?: string; errors?: string[] }>(err)
        ? err.response?.data?.error ||
          err.response?.data?.errors?.[0] ||
          err.response?.data?.message ||
          err.message ||
          'No se pudo agendar tu cita. Intenta de nuevo.'
        : 'No se pudo agendar tu cita. Intenta de nuevo.';
      Alert.alert('No se pudo agendar', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingBusiness || (exploreLoading && !activeBusiness)) {
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

  if (loadError || !activeBusiness || !activeSchema) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[
          styles.safeArea,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <View style={styles.centered}>
          <View
            style={[
              styles.feedbackCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.main,
              },
            ]}
          >
            <View
              style={[
                styles.feedbackIconCircle,
                { backgroundColor: colors.background.tertiary },
              ]}
            >
              <Feather
                name={loadError ? 'alert-circle' : 'calendar'}
                size={24}
                color={loadError ? colors.status.error : colors.text.muted}
              />
            </View>
            <Text style={[styles.feedbackTitle, { color: colors.text.primary }]}>
              {loadError
                ? 'No pudimos cargar el formulario'
                : 'No hay negocios disponibles aún'}
            </Text>
            <Text style={[styles.feedbackBody, { color: colors.text.secondary }]}>
              {loadError ||
                'Explora los establecimientos registrados para elegir dónde reservar tu cita.'}
            </Text>
            <View style={styles.feedbackActions}>
              <AnimatedPressable
                onPress={handleRetry}
                style={[
                  styles.feedbackPrimaryBtn,
                  { backgroundColor: colors.action.primary },
                ]}
              >
                <Text
                  style={[
                    styles.feedbackPrimaryText,
                    { color: colors.action.primaryText },
                  ]}
                >
                  Reintentar
                </Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => router.push('/(main)/explore' as any)}
                style={[
                  styles.feedbackSecondaryBtn,
                  { backgroundColor: colors.background.tertiary },
                ]}
              >
                <Text
                  style={[
                    styles.feedbackSecondaryText,
                    { color: colors.text.primary },
                  ]}
                >
                  Explorar negocios
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
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
          submitButtonLabel={
            isSubmitting ? 'Registrando reserva...' : 'Confirmar y Agendar Cita'
          }
        />
        {isSubmitting && (
          <View style={styles.submittingOverlay}>
            <View
              style={[
                styles.submittingBox,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.action.primary} />
              <Text style={[styles.loadingText, { color: colors.text.primary, marginTop: 10 }]}>
                Confirmando disponibilidad...
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ─── Modal Pulido de Confirmación de Reserva ─── */}
      <Modal
        visible={Boolean(confirmedBooking)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmedBooking(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setConfirmedBooking(null)}
        >
          {confirmedBooking && (
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={styles.confirmationCardPressWrap}
            >
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
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar comprobante"
                    onPress={() => setConfirmedBooking(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Feather name="x" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
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
            </Pressable>
          )}
        </Pressable>
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
  confirmationCardPressWrap: {
    width: '100%',
    maxWidth: 420,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  submittingBox: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  feedbackCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  feedbackIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  feedbackBody: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  feedbackActions: {
    flexDirection: 'row',
    gap: 10,
  },
  feedbackPrimaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  feedbackPrimaryText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  feedbackSecondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  feedbackSecondaryText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
