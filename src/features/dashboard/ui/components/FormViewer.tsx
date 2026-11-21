import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  LinearTransition,
  FadeInDown,
} from 'react-native-reanimated';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { FormSchema, FormField, FormServiceItem } from '../screens/FormBuilderScreen';
import { LinearGradient } from 'expo-linear-gradient';

const AVAILABLE_TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '03:30 PM',
  '05:00 PM',
  '06:30 PM',
];

export interface DateTimeSelection {
  dateLabel: string;
  isoDate: string;
  time: string;
}

export interface BookingSubmissionSummary {
  serviceNames: string[];
  totalPrice: number;
  totalDuration: number;
  dateLabel: string;
  isoDate: string;
  timeLabel: string;
  clientName: string;
  clientPhone: string;
  notes: string;
}

interface FormViewerProps {
  schema: FormSchema;
  onSubmit: (answers: Record<string, any>, summary: BookingSubmissionSummary) => void;
  onCancel?: () => void;
  initialAnswers?: Record<string, any>;
  submitButtonLabel?: string;
}

function buildUpcomingDays(): { key: string; dayName: string; dayNumber: string; monthShort: string; fullLabel: string; isoDate: string }[] {
  const days = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : dayNames[d.getDay()];
    const dayNumber = String(d.getDate());
    const monthShort = monthNames[d.getMonth()];
    const fullLabel =
      i === 0
        ? `Hoy (${dayNumber} ${monthShort})`
        : i === 1
        ? `Mañana (${dayNumber} ${monthShort})`
        : `${dayNames[d.getDay()]} ${dayNumber} ${monthShort}`;

    days.push({
      key: d.toISOString().split('T')[0],
      dayName,
      dayNumber,
      monthShort,
      fullLabel,
      isoDate: d.toISOString(),
    });
  }
  return days;
}

export function FormViewer({
  schema,
  onSubmit,
  initialAnswers,
  submitButtonLabel,
}: FormViewerProps) {
  const { colors, isDark } = useAppTheme();
  const upcomingDays = useMemo(() => buildUpcomingDays(), []);

  const [answers, setAnswers] = useState<Record<string, any>>(() => ({
    ...(initialAnswers || {}),
  }));
  const [validationErrorFieldId, setValidationErrorFieldId] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Para el modo 'interactive_slides'
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Sincronizar respuestas iniciales y valores por defecto para fecha/hora
  useEffect(() => {
    setAnswers((prev) => {
      const next = { ...(initialAnswers || {}), ...prev };
      schema.fields.forEach((f) => {
        if (f.type === 'date_time' && !next[f.id] && upcomingDays.length > 0) {
          next[f.id] = {
            dateLabel: upcomingDays[0].fullLabel,
            isoDate: upcomingDays[0].isoDate,
            time: AVAILABLE_TIME_SLOTS[1],
          } as DateTimeSelection;
        }
      });
      return next;
    });
    setCurrentSlideIndex(0);
    setValidationErrorFieldId(null);
    setValidationMessage(null);
  }, [schema.businessName, schema.fields.length]);

  const primaryColor = schema.accentColor || '#6366F1';
  const secondaryColor = schema.secondaryColor || primaryColor;
  const businessName = schema.businessName || 'Establecimiento Verificado';
  const serviceCatalog =
    schema.services && schema.services.length > 0 ? schema.services : [];

  const getInitials = (name: string) => {
    const clean = (name || 'SN').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const isFieldAnswered = (field: FormField, val: any): boolean => {
    if (field.type === 'service_catalog') {
      if (serviceCatalog.length === 0) return true;
      return Array.isArray(val) && val.length > 0;
    }
    if (val === undefined || val === null) return false;
    if (field.type === 'multiple_choice') {
      return Array.isArray(val) && val.length > 0;
    }
    if (field.type === 'date_time') {
      const dt = val as DateTimeSelection;
      return Boolean(dt && dt.dateLabel && dt.time);
    }
    if (field.type === 'rating_stars') {
      return typeof val === 'number' && val > 0;
    }
    if (typeof val === 'string') {
      return val.trim().length > 0;
    }
    return true;
  };

  const handleAnswer = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    if (validationErrorFieldId === fieldId) {
      setValidationErrorFieldId(null);
      setValidationMessage(null);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO DE SUMATORIAS Y RESUMEN DE CITA
  // ═══════════════════════════════════════════════════════════
  const hasServiceCatalog = schema.fields.some((f) => f.type === 'service_catalog');
  let totalPrice = 0;
  let totalDuration = 0;
  const selectedServiceNames: string[] = [];

  if (hasServiceCatalog) {
    const serviceField = schema.fields.find((f) => f.type === 'service_catalog');
    if (serviceField) {
      const selectedIds = (answers[serviceField.id] as string[]) || [];
      selectedIds.forEach((id) => {
        const srv = serviceCatalog.find((c) => c.id === id);
        if (srv) {
          totalPrice += srv.price;
          totalDuration += srv.duration;
          selectedServiceNames.push(srv.name);
        }
      });
    }
  }

  const buildSummary = (): BookingSubmissionSummary => {
    let dateLabel = upcomingDays[0]?.fullLabel || 'Hoy';
    let isoDate = upcomingDays[0]?.isoDate || new Date().toISOString();
    let timeLabel = '10:00 AM';
    let clientName = '';
    let clientPhone = '';
    let notes = '';

    schema.fields.forEach((field) => {
      const val = answers[field.id];
      if (!val) return;

      if (field.type === 'date_time' && val.dateLabel && val.time) {
        dateLabel = val.dateLabel;
        isoDate = val.isoDate || isoDate;
        timeLabel = val.time;
      } else if (
        field.type === 'phone' ||
        field.question.toLowerCase().includes('teléfono') ||
        field.question.toLowerCase().includes('telefono') ||
        field.question.toLowerCase().includes('whatsapp') ||
        field.question.toLowerCase().includes('celular')
      ) {
        if (typeof val === 'string') clientPhone = val.trim();
      } else if (
        field.type === 'short_text' &&
        (field.question.toLowerCase().includes('nombre') || !clientName)
      ) {
        if (typeof val === 'string') clientName = val.trim();
      } else if (field.type === 'paragraph') {
        if (typeof val === 'string') notes = val.trim();
      }
    });

    return {
      serviceNames:
        selectedServiceNames.length > 0
          ? selectedServiceNames
          : ['Cita General Reservada'],
      totalPrice,
      totalDuration: totalDuration || 30,
      dateLabel,
      isoDate,
      timeLabel,
      clientName: clientName || 'Cliente Slotify',
      clientPhone: clientPhone || 'Sin especificar',
      notes,
    };
  };

  const validateAndSubmitAll = () => {
    for (const field of schema.fields) {
      if (field.required && !isFieldAnswered(field, answers[field.id])) {
        setValidationErrorFieldId(field.id);
        setValidationMessage(`Por favor responde: "${field.question}"`);
        return;
      }
    }
    setValidationErrorFieldId(null);
    setValidationMessage(null);
    onSubmit(answers, buildSummary());
  };

  const handleNextSlide = () => {
    const currentField = schema.fields[currentSlideIndex];
    if (currentField?.required && !isFieldAnswered(currentField, answers[currentField.id])) {
      setValidationErrorFieldId(currentField.id);
      setValidationMessage('Completa este paso obligatorio para continuar.');
      return;
    }

    if (currentSlideIndex < schema.fields.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      validateAndSubmitAll();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setValidationErrorFieldId(null);
      setValidationMessage(null);
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const answeredCount = schema.fields.filter((f) =>
    isFieldAnswered(f, answers[f.id])
  ).length;

  // ─── Cabecera de Identidad de Marca Reutilizable ───
  const renderBrandIdentityBanner = (compact = false) => (
    <LinearGradient
      colors={[primaryColor, secondaryColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.brandBanner,
        compact && styles.brandBannerCompact,
      ]}
    >
      <View style={styles.brandBannerRow}>
        <View
          style={[
            styles.brandLogoContainer,
            compact && styles.brandLogoContainerCompact,
          ]}
        >
          {schema.logoUrl ? (
            <Image
              source={{ uri: schema.logoUrl }}
              style={styles.brandLogoImage}
              resizeMode="cover"
              testID="public-form-logo"
            />
          ) : (
            <Text
              style={[
                styles.brandInitials,
                compact && { fontSize: 15 },
              ]}
            >
              {getInitials(businessName)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={11} color="#FFFFFF" />
            <Text style={styles.verifiedBadgeText}>RESERVA OFICIAL</Text>
          </View>
          <Text
            style={[
              styles.brandBusinessName,
              compact && { fontSize: 16 },
            ]}
            numberOfLines={1}
          >
            {businessName}
          </Text>
        </View>

        {/* Indicador de progreso de llenado */}
        <View style={styles.completionPill}>
          <Feather name="check-square" size={12} color="#FFFFFF" />
          <Text style={styles.completionPillText}>
            {answeredCount}/{schema.fields.length}
          </Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.brandFormMeta}>
          <Text style={styles.brandFormTitle}>{schema.title}</Text>
          {schema.description ? (
            <Text style={styles.brandFormDescription}>{schema.description}</Text>
          ) : null}
        </View>
      )}
    </LinearGradient>
  );

  // ─── Componentes de Renderizado de Campos ───
  const renderFieldInput = (field: FormField, isSlideMode: boolean) => {
    const value = answers[field.id];
    const hasError = validationErrorFieldId === field.id;

    if (field.type === 'service_catalog') {
      if (serviceCatalog.length === 0) {
        return (
          <View
            style={[
              styles.optionCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.main,
              },
            ]}
          >
            <Feather name="info" size={16} color={colors.text.muted} style={{ marginRight: 10 }} />
            <Text style={{ color: colors.text.secondary, fontSize: 13.5, flex: 1 }}>
              Este negocio aún no tiene servicios publicados; puedes continuar para solicitar una cita general.
            </Text>
          </View>
        );
      }

      const selectedServiceIds = (value as string[]) || [];

      return (
        <View style={styles.optionsContainer}>
          {serviceCatalog.map((srv) => {
            const isSelected = selectedServiceIds.includes(srv.id);

            return (
              <TouchableOpacity
                key={srv.id}
                activeOpacity={0.75}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? `${primaryColor}30`
                        : `${primaryColor}14`
                      : colors.background.secondary,
                    borderColor: isSelected
                      ? primaryColor
                      : hasError
                      ? colors.status.error
                      : colors.border.main,
                    justifyContent: 'space-between',
                  },
                  isSlideMode && styles.optionCardLarge,
                ]}
                onPress={() => {
                  const next = isSelected
                    ? selectedServiceIds.filter((id) => id !== srv.id)
                    : [...selectedServiceIds, srv.id];
                  handleAnswer(field.id, next);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderRadius: 6,
                        borderColor: isSelected ? primaryColor : colors.text.muted,
                        backgroundColor: isSelected ? primaryColor : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? primaryColor : colors.text.primary },
                        isSlideMode && styles.optionTextLarge,
                      ]}
                    >
                      {srv.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.text.muted,
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      <Feather name="clock" size={12} /> {srv.duration} min
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.pricePill,
                    {
                      backgroundColor: isSelected
                        ? secondaryColor
                        : colors.background.tertiary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: isSelected ? '#FFFFFF' : colors.text.primary,
                    }}
                  >
                    ${Number(srv.price).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (field.type === 'date_time') {
      const currentSelection: DateTimeSelection = (value as DateTimeSelection) || {
        dateLabel: upcomingDays[0]?.fullLabel || 'Hoy',
        isoDate: upcomingDays[0]?.isoDate || new Date().toISOString(),
        time: AVAILABLE_TIME_SLOTS[1],
      };

      return (
        <View style={{ gap: 16 }}>
          {/* Selector de Día */}
          <View>
            <View style={styles.subLabelRow}>
              <Feather name="calendar" size={14} color={primaryColor} />
              <Text style={[styles.subLabelText, { color: colors.text.secondary }]}>
                Selecciona el día
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollRow}
            >
              {upcomingDays.map((day) => {
                const isSelectedDay = currentSelection.dateLabel === day.fullLabel;
                return (
                  <TouchableOpacity
                    key={day.key}
                    activeOpacity={0.78}
                    onPress={() =>
                      handleAnswer(field.id, {
                        ...currentSelection,
                        dateLabel: day.fullLabel,
                        isoDate: day.isoDate,
                      })
                    }
                    style={[
                      styles.dayPillCard,
                      {
                        backgroundColor: isSelectedDay
                          ? primaryColor
                          : colors.background.tertiary,
                        borderColor: isSelectedDay
                          ? primaryColor
                          : colors.border.main,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayPillName,
                        {
                          color: isSelectedDay
                            ? 'rgba(255,255,255,0.88)'
                            : colors.text.muted,
                        },
                      ]}
                    >
                      {day.dayName}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillNumber,
                        { color: isSelectedDay ? '#FFFFFF' : colors.text.primary },
                      ]}
                    >
                      {day.dayNumber}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillMonth,
                        {
                          color: isSelectedDay
                            ? 'rgba(255,255,255,0.85)'
                            : colors.text.muted,
                        },
                      ]}
                    >
                      {day.monthShort}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Selector de Horario */}
          <View>
            <View style={styles.subLabelRow}>
              <Feather name="clock" size={14} color={secondaryColor} />
              <Text style={[styles.subLabelText, { color: colors.text.secondary }]}>
                Horarios disponibles
              </Text>
            </View>
            <View style={styles.timeGrid}>
              {AVAILABLE_TIME_SLOTS.map((slotTime) => {
                const isSelectedTime = currentSelection.time === slotTime;
                return (
                  <TouchableOpacity
                    key={slotTime}
                    activeOpacity={0.78}
                    onPress={() =>
                      handleAnswer(field.id, {
                        ...currentSelection,
                        time: slotTime,
                      })
                    }
                    style={[
                      styles.timeSlotChip,
                      {
                        backgroundColor: isSelectedTime
                          ? `${secondaryColor}22`
                          : colors.background.tertiary,
                        borderColor: isSelectedTime
                          ? secondaryColor
                          : colors.border.main,
                      },
                    ]}
                  >
                    <Feather
                      name="clock"
                      size={12}
                      color={isSelectedTime ? secondaryColor : colors.text.muted}
                    />
                    <Text
                      style={[
                        styles.timeSlotText,
                        {
                          color: isSelectedTime
                            ? secondaryColor
                            : colors.text.primary,
                          fontWeight: isSelectedTime ? '700' : '500',
                        },
                      ]}
                    >
                      {slotTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      );
    }

    switch (field.type) {
      case 'short_text':
      case 'phone':
      case 'email':
      case 'paragraph': {
        const isPhone =
          field.type === 'phone' ||
          field.question.toLowerCase().includes('teléfono') ||
          field.question.toLowerCase().includes('telefono') ||
          field.question.toLowerCase().includes('whatsapp');
        const isEmail =
          field.type === 'email' ||
          field.question.toLowerCase().includes('correo') ||
          field.question.toLowerCase().includes('email');

        const defaultPlaceholder =
          field.placeholder ||
          (isPhone
            ? 'Ej. +52 55 1234 5678'
            : isEmail
            ? 'Ej. cliente@correo.com'
            : field.type === 'paragraph'
            ? 'Escribe tus comentarios o notas aquí...'
            : 'Escribe tu respuesta aquí...');

        return (
          <View style={styles.inputWithIconWrapper}>
            {field.type !== 'paragraph' && (
              <View style={styles.inputLeadingIcon}>
                <Feather
                  name={
                    isPhone
                      ? 'phone'
                      : isEmail
                      ? 'mail'
                      : field.question.toLowerCase().includes('nombre')
                      ? 'user'
                      : 'edit-3'
                  }
                  size={16}
                  color={value ? primaryColor : colors.text.muted}
                />
              </View>
            )}
            <TextInput
              style={[
                styles.textInput,
                field.type !== 'paragraph' && !isSlideMode && { paddingLeft: 42 },
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: hasError
                    ? colors.status.error
                    : value
                    ? primaryColor
                    : colors.border.main,
                  color: colors.text.primary,
                  minHeight: field.type === 'paragraph' ? 96 : 52,
                },
                isSlideMode && styles.textInputLarge,
              ]}
              placeholder={defaultPlaceholder}
              placeholderTextColor={colors.text.muted}
              multiline={field.type === 'paragraph'}
              keyboardType={
                isPhone
                  ? 'phone-pad'
                  : isEmail
                  ? 'email-address'
                  : 'default'
              }
              autoCapitalize={isEmail ? 'none' : 'sentences'}
              value={value || ''}
              onChangeText={(text) => handleAnswer(field.id, text)}
            />
          </View>
        );
      }

      case 'single_choice':
      case 'multiple_choice': {
        const isMulti = field.type === 'multiple_choice';
        return (
          <View style={styles.optionsContainer}>
            {field.options?.map((opt, idx) => {
              const isSelected = isMulti
                ? (value as string[])?.includes(opt)
                : value === opt;

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? `${primaryColor}30`
                          : `${primaryColor}15`
                        : colors.background.secondary,
                      borderColor: isSelected
                        ? primaryColor
                        : hasError
                        ? colors.status.error
                        : colors.border.main,
                    },
                    isSlideMode && styles.optionCardLarge,
                  ]}
                  onPress={() => {
                    if (isMulti) {
                      const curr = (value as string[]) || [];
                      const next = isSelected
                        ? curr.filter((i) => i !== opt)
                        : [...curr, opt];
                      handleAnswer(field.id, next);
                    } else {
                      handleAnswer(field.id, opt);
                      if (isSlideMode) setTimeout(handleNextSlide, 350);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderRadius: isMulti ? 6 : 12,
                        borderColor: isSelected ? primaryColor : colors.text.muted,
                        backgroundColor: isSelected ? primaryColor : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      { color: isSelected ? primaryColor : colors.text.primary },
                      isSlideMode && styles.optionTextLarge,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }

      case 'rating_stars': {
        const rating = value || 0;
        return (
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  handleAnswer(field.id, star);
                  if (isSlideMode) setTimeout(handleNextSlide, 400);
                }}
              >
                <AntDesign
                  name={(star <= rating ? 'star' : 'staro') as any}
                  size={isSlideMode ? 44 : 32}
                  color={star <= rating ? secondaryColor : colors.text.muted}
                />
              </TouchableOpacity>
            ))}
          </View>
        );
      }

      default:
        return null;
    }
  };

  // Componente de barra inferior pegajosa con resumen en vivo
  const SummaryBar = () => {
    if (!hasServiceCatalog || totalPrice === 0) return null;
    const summary = buildSummary();
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          styles.summaryBar,
          {
            backgroundColor: isDark ? '#111' : '#FFF',
            borderTopColor: primaryColor,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 12,
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            {selectedServiceNames.length}{' '}
            {selectedServiceNames.length === 1 ? 'servicio' : 'servicios'} • {summary.dateLabel}
          </Text>
          <Text
            style={{
              color: primaryColor,
              fontSize: 20,
              fontWeight: '800',
            }}
          >
            ${totalPrice.toFixed(2)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {summary.timeLabel}
          </Text>
          <Text
            style={{
              color: secondaryColor,
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            <Feather name="clock" size={13} /> {totalDuration} min
          </Text>
        </View>
      </Animated.View>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: ESTILO SLIDES (TYPEFORM)
  // ═══════════════════════════════════════════════════════════
  if (schema.presentationStyle === 'interactive_slides') {
    const currentField = schema.fields[currentSlideIndex];
    const progress =
      schema.fields.length > 0
        ? ((currentSlideIndex + 1) / schema.fields.length) * 100
        : 100;

    return (
      <View
        style={[styles.container, { backgroundColor: colors.background.primary }]}
      >
        {/* Cabecera corporativa compacta */}
        <View style={styles.slidesBrandWrapper}>
          {renderBrandIdentityBanner(true)}
        </View>

        {/* Barra de progreso superior con colores corporativos */}
        <View
          style={[
            styles.progressBarBg,
            { backgroundColor: colors.border.main },
          ]}
        >
          <Animated.View
            layout={LinearTransition}
            style={[
              styles.progressBarFill,
              { width: `${progress}%`, backgroundColor: primaryColor },
            ]}
          />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.slideScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {currentField && (
              <Animated.View
                key={currentField.id}
                entering={SlideInRight.duration(400).springify()}
                exiting={SlideOutLeft.duration(300)}
                style={styles.slideContent}
              >
                <View
                  style={[
                    styles.slideNumberBadge,
                    { backgroundColor: `${secondaryColor}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.slideQuestionNumber,
                      { color: primaryColor },
                    ]}
                  >
                    Paso {currentSlideIndex + 1} de {schema.fields.length}{' '}
                    <Feather name="arrow-right" />
                  </Text>
                </View>

                <Text
                  style={[
                    styles.slideQuestionText,
                    { color: colors.text.primary },
                  ]}
                >
                  {currentField.question}
                  {currentField.required && (
                    <Text style={{ color: colors.status.error }}> *</Text>
                  )}
                </Text>

                {validationMessage && validationErrorFieldId === currentField.id && (
                  <View style={styles.validationBanner}>
                    <Feather name="alert-circle" size={15} color="#EF4444" />
                    <Text style={styles.validationBannerText}>{validationMessage}</Text>
                  </View>
                )}

                <View style={styles.slideInputWrapper}>
                  {renderFieldInput(currentField, true)}
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Controles de Navegación del Slide */}
        <View
          style={[
            styles.slideNavigation,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.slideNavBtn,
              { opacity: currentSlideIndex === 0 ? 0.3 : 1 },
            ]}
            onPress={handlePrevSlide}
            disabled={currentSlideIndex === 0}
          >
            <Feather name="chevron-left" size={26} color={colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.slideMainBtnWrapper}
            onPress={handleNextSlide}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[primaryColor, secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.slideMainBtn}
            >
              <Text style={styles.slideMainBtnText}>
                {currentSlideIndex === schema.fields.length - 1
                  ? submitButtonLabel || 'Confirmar Reserva'
                  : 'Siguiente'}
              </Text>
              <Feather
                name={
                  currentSlideIndex === schema.fields.length - 1
                    ? 'check'
                    : 'arrow-right'
                }
                size={18}
                color="#FFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <SummaryBar />
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: ESTILO CLÁSICO SCROLL (GOOGLE FORMS)
  // ═══════════════════════════════════════════════════════════
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.classicScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabecera del Formulario con Identidad de Marca (Logotipo y Colores Corporativos) */}
          <Animated.View entering={FadeInDown.duration(400)}>
            {renderBrandIdentityBanner(false)}
          </Animated.View>

          {validationMessage && (
            <Animated.View entering={FadeIn.duration(250)} style={styles.validationBanner}>
              <Feather name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.validationBannerText}>{validationMessage}</Text>
            </Animated.View>
          )}

          {/* Lista de Campos */}
          {schema.fields.map((field, idx) => {
            const isComplete = isFieldAnswered(field, answers[field.id]);
            const hasFieldError = validationErrorFieldId === field.id;

            return (
              <Animated.View
                key={field.id}
                entering={FadeInDown.duration(400).delay(100 + idx * 70)}
                style={[
                  styles.classicFieldCard,
                  {
                    backgroundColor: colors.background.primary,
                    borderLeftColor: hasFieldError
                      ? '#EF4444'
                      : idx % 2 === 0
                      ? primaryColor
                      : secondaryColor,
                    borderLeftWidth: 4,
                  },
                ]}
              >
                <View style={styles.classicQuestionHeader}>
                  <Text
                    style={[
                      styles.classicFieldQuestion,
                      { color: colors.text.primary, flex: 1, marginBottom: 0 },
                    ]}
                  >
                    {field.question}
                    {field.required && (
                      <Text style={{ color: colors.status.error }}> *</Text>
                    )}
                  </Text>
                  {isComplete && (
                    <View
                      style={[
                        styles.completedFieldBadge,
                        { backgroundColor: `${primaryColor}18` },
                      ]}
                    >
                      <Feather name="check" size={12} color={primaryColor} />
                    </View>
                  )}
                </View>

                <View style={styles.classicInputWrapper}>
                  {renderFieldInput(field, false)}
                </View>
              </Animated.View>
            );
          })}

          {/* Botón de Enviar con Degradado Corporativo */}
          <Animated.View entering={FadeIn.delay(350)}>
            <TouchableOpacity
              style={styles.classicSubmitBtnWrapper}
              onPress={validateAndSubmitAll}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[primaryColor, secondaryColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.classicSubmitBtn}
              >
                <Feather name="check-circle" size={18} color="#FFFFFF" />
                <Text style={styles.classicSubmitBtnText}>
                  {submitButtonLabel || 'Confirmar Reservación'}
                </Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 130 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <SummaryBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Cabecera de Identidad Corporativa
  brandBanner: {
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  brandBannerCompact: {
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brandLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogoContainerCompact: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
  },
  brandInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  brandBusinessName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  completionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completionPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  brandFormMeta: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  brandFormTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  brandFormDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  slidesBrandWrapper: {
    width: '100%',
  },

  // Validación
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  validationBannerText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Elementos Comunes
  inputWithIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputLeadingIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 2,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  textInputLarge: {
    fontSize: 20,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionCardLarge: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { fontSize: 15.5, fontWeight: '600' },
  optionTextLarge: { fontSize: 18, fontWeight: '600' },
  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  // Selector de Fecha y Hora
  subLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  subLabelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysScrollRow: {
    gap: 10,
    paddingVertical: 2,
  },
  dayPillCard: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillName: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayPillNumber: {
    fontSize: 19,
    fontWeight: '800',
    marginVertical: 2,
  },
  dayPillMonth: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  timeSlotText: {
    fontSize: 13,
  },

  starsContainer: { flexDirection: 'row', gap: 12, alignItems: 'center' },

  // ESTILO: Interactive Slides
  progressBarBg: { height: 5, width: '100%' },
  progressBarFill: { height: '100%' },
  slideScrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  slideContent: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  slideNumberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 14,
  },
  slideQuestionNumber: { fontSize: 14, fontWeight: '700' },
  slideQuestionText: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 24,
  },
  slideInputWrapper: { minHeight: 120 },
  slideNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 16,
  },
  slideNavBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideMainBtnWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  slideMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 25,
    gap: 8,
  },
  slideMainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // ESTILO: Classic Scroll
  classicScrollContent: { padding: 16, gap: 16 },
  classicFieldCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  classicQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  completedFieldBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classicFieldQuestion: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  classicInputWrapper: {},
  classicSubmitBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  classicSubmitBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  classicSubmitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Resumen / Sumatoria
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    borderTopWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
});
