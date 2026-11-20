import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { CANONICAL_SECTOR_CATEGORIES } from '@/features/sector-templates/constants';
import { useAuthStore } from '@/features/auth/model';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBusinessOnboardingStore } from '../../model';

const getSuggestedService = (category: string) => {
  if (category === 'Salud y Bienestar') return { name: 'Consulta General', duration: '45', price: '500' };
  if (category === 'Belleza y Cuidado Personal') return { name: 'Corte de Cabello', duration: '45', price: '300' };
  if (category === 'Fitness y Deportes') return { name: 'Clase de Prueba', duration: '60', price: '0' };
  if (category === 'Servicios Profesionales') return { name: 'Llamada de Descubrimiento', duration: '15', price: '0' };
  return { name: 'Servicio Principal', duration: '30', price: '150' };
};

export const BusinessOnboardingWizardScreen = () => {
  const router = useRouter();

  // Auth Store: Únicamente identidad de usuario y logout
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  // Business Onboarding Store: Responsable de todo el proceso de onboarding del negocio
  const {
    step,
    category,
    businessName,
    businessPhone,
    slug,
    timeZone,
    selectedDays,
    startTime,
    endTime,
    serviceName,
    serviceDuration,
    servicePrice,
    isLoading,
    error,
    nextStep,
    prevStep,
    setCategory,
    setBusinessName,
    setBusinessPhone,
    toggleDay,
    setStartTime,
    setEndTime,
    setServiceName,
    setServiceDuration,
    setServicePrice,
    submitOnboarding,
    clearError,
  } = useBusinessOnboardingStore();

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Actualizar sugerencias de servicio cuando cambia la categoría
  useEffect(() => {
    if (category && !serviceName) {
      const suggestion = getSuggestedService(category);
      setServiceName(suggestion.name);
      setServiceDuration(suggestion.duration);
      setServicePrice(suggestion.price);
    }
  }, [category]);

  const formatDays = () => {
    if (selectedDays.length === 5 && !selectedDays.includes('S') && !selectedDays.includes('D')) {
      return 'Lunes a Viernes';
    }
    if (selectedDays.length === 7) return 'Todos los días';
    if (selectedDays.length === 0) return 'Ningún día seleccionado';
    return selectedDays.join(', ');
  };

  const handleNext = async () => {
    clearError();
    if (step === 4) {
      try {
        await submitOnboarding(user, updateUser);
      } catch {
        // El error ya queda registrado en el store y se muestra en pantalla
      }
      return;
    }
    nextStep();
  };

  const handleFinish = () => {
    router.replace('/(main)' as any);
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `¡Reserva tu cita en mi negocio a través de Slotify! Enlace: https://slotly.app/${slug || 'tu-negocio'}`,
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Ignorado
    }
  };

  const progress = (step / 5) * 100;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.shell}>
          {/* Header con botón de cerrar sesión */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={logout} style={styles.logoutBtnSm} activeOpacity={0.7}>
              <SymbolView
                name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
                size={16}
                tintColor="#EF4444"
              />
              <Text style={styles.logoutTextSm}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Barra de Progreso */}
          {step < 5 && (
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mensaje de error general si ocurre */}
            {error ? (
              <Animated.View entering={FadeIn} style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorBannerText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* PASO 1: SECTOR COMERCIAL */}
            {step === 1 && (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
                <Text style={styles.label}>Paso 1 de 4</Text>
                <Text style={styles.heading}>¿A qué sector pertenece tu negocio?</Text>
                <Text style={styles.desc}>
                  Esto nos ayudará a personalizar tu experiencia y sugerir los mejores servicios para ti.
                </Text>

                <View style={styles.cardList}>
                  {CANONICAL_SECTOR_CATEGORIES.map((cat, idx) => {
                    const isSelected = category === cat.name;
                    return (
                      <Animated.View
                        key={cat.name}
                        entering={FadeInDown.delay(idx * 30).springify().damping(16)}
                      >
                        <TouchableOpacity
                          style={[styles.card, isSelected && styles.cardSelected]}
                          onPress={() => setCategory(cat.name, cat.id || 1)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.cardIcon, isSelected && styles.cardIconSelected]}>
                            <SymbolView
                              name={cat.iconName as any}
                              size={18}
                              tintColor={isSelected ? '#C57747' : '#9CA3AF'}
                            />
                          </View>
                          <View style={styles.cardBody}>
                            <Text style={[styles.cardTitle, !isSelected && styles.cardTitleMuted]}>
                              {cat.name}
                            </Text>
                            <Text style={styles.cardSub}>{cat.description}</Text>
                          </View>
                          <View style={[styles.checkCircle, isSelected && styles.checkCircleOn]}>
                            {isSelected && (
                              <SymbolView
                                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                                size={13}
                                weight="bold"
                                tintColor="#FFFFFF"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* PASO 2: PERFIL E IDENTIDAD */}
            {step === 2 && (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
                <Text style={styles.label}>Paso 2 de 4</Text>
                <Text style={styles.heading}>Perfil e Identidad</Text>
                <Text style={styles.desc}>
                  Configura tu escaparate digital. Este será el nombre público que verán tus clientes.
                </Text>

                <Text style={styles.fieldLabel}>Nombre del negocio</Text>
                <View style={styles.inputRow}>
                  <SymbolView
                    name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
                    size={18}
                    tintColor={businessName.length > 0 ? '#C57747' : '#9CA3AF'}
                  />
                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Ej. Barbería Central"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.input, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                  />
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Teléfono del negocio (opcional)</Text>
                <View style={styles.inputRow}>
                  <SymbolView
                    name={{ ios: 'phone', android: 'phone', web: 'phone' }}
                    size={18}
                    tintColor={businessPhone.length > 0 ? '#C57747' : '#9CA3AF'}
                  />
                  <TextInput
                    value={businessPhone}
                    onChangeText={setBusinessPhone}
                    placeholder="555-123-4567"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    style={[styles.input, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                  />
                </View>

                {/* Previsualización del Slug */}
                <View style={styles.slugPreview}>
                  <Text style={styles.slugTitle}>Tu enlace único:</Text>
                  <View style={styles.slugBox}>
                    <SymbolView name={{ ios: 'link', android: 'link', web: 'link' }} size={14} tintColor="#6B7280" />
                    <Text style={styles.slugText} numberOfLines={1}>
                      <Text style={styles.slugDomain}>slotly.app/</Text>
                      <Text style={styles.slugValue}>{slug || 'tu-negocio'}</Text>
                    </Text>
                  </View>
                  <Text style={styles.slugHelper}>Podrás compartir este enlace para que te reserven 24/7.</Text>
                </View>
              </Animated.View>
            )}

            {/* PASO 3: DISPONIBILIDAD BASE */}
            {step === 3 && (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
                <Text style={styles.label}>Paso 3 de 4</Text>
                <Text style={styles.heading}>Disponibilidad Base</Text>
                <Text style={styles.desc}>
                  Configuraremos los horarios de atención de tu negocio. Podrás modificarlos y agregar descansos más adelante.
                </Text>

                <View style={styles.availabilityBox}>
                  <View style={styles.availRow}>
                    <View style={styles.availIconBox}>
                      <SymbolView name={{ ios: 'globe', android: 'public', web: 'public' }} size={18} tintColor="#C57747" />
                    </View>
                    <View style={styles.availContent}>
                      <Text style={styles.availLabel}>Zona Horaria</Text>
                      <Text style={styles.availValue}>{timeZone}</Text>
                    </View>
                  </View>
                  <View style={styles.availDivider} />
                  <View style={styles.availRow}>
                    <View style={styles.availIconBox}>
                      <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={18} tintColor="#C57747" />
                    </View>
                    <View style={styles.availContent}>
                      <Text style={styles.availLabel}>Días de Atención</Text>
                      <Text style={styles.availValue}>{formatDays()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsBottomSheetOpen(true)}>
                      <Text style={styles.editLink}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.availDivider} />
                  <View style={styles.availRow}>
                    <View style={styles.availIconBox}>
                      <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={18} tintColor="#C57747" />
                    </View>
                    <View style={styles.availContent}>
                      <Text style={styles.availLabel}>Horario de Atención</Text>
                      <Text style={styles.availValue}>
                        {startTime} a {endTime}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsBottomSheetOpen(true)}>
                      <Text style={styles.editLink}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* PASO 4: PRIMER SERVICIO */}
            {step === 4 && (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
                <Text style={styles.label}>Último paso</Text>
                <Text style={styles.heading}>Tu Primer Servicio</Text>
                <Text style={styles.desc}>
                  Para {category || 'tu sector'} configuraremos tu primer servicio. Podrás añadir más en cualquier momento.
                </Text>

                <View style={styles.addForm}>
                  <View>
                    <Text style={styles.editLabel}>Nombre del servicio</Text>
                    <TextInput
                      value={serviceName}
                      onChangeText={setServiceName}
                      placeholder="Ej. Corte de cabello"
                      placeholderTextColor="#9CA3AF"
                      style={[styles.editInput, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <View style={styles.editField}>
                      <Text style={styles.editLabel}>Duración (minutos)</Text>
                      <TextInput
                        value={serviceDuration}
                        onChangeText={setServiceDuration}
                        keyboardType="number-pad"
                        placeholder="30"
                        placeholderTextColor="#9CA3AF"
                        style={[styles.editInput, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                      />
                    </View>
                    <View style={styles.editField}>
                      <Text style={styles.editLabel}>Precio ($)</Text>
                      <TextInput
                        value={servicePrice}
                        onChangeText={setServicePrice}
                        keyboardType="decimal-pad"
                        placeholder="150"
                        placeholderTextColor="#9CA3AF"
                        style={[styles.editInput, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                      />
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* PASO 5: ÉXITO */}
            {step === 5 && (
              <Animated.View entering={FadeIn.duration(500)} style={styles.successCenter}>
                <View style={styles.successCircleOuter}>
                  <View style={styles.successCircleInner}>
                    <Feather name="check" size={38} color="#C57747" />
                  </View>
                </View>

                <Text style={styles.successHeading}>¡Cuenta y Negocio Listos!</Text>
                <Text style={styles.successDesc}>
                  Tu negocio ha sido configurado y confirmado exitosamente en el servidor. Ya puedes gestionar tus reservas o compartir tu enlace público.
                </Text>

                <View style={styles.successLinkBox}>
                  <Feather name="globe" size={16} color="#C57747" style={{ marginRight: 8 }} />
                  <Text style={styles.successLinkText} numberOfLines={1}>
                    <Text style={{ color: '#9CA3AF' }}>slotly.app/</Text>
                    <Text style={{ color: '#C57747', fontWeight: '800' }}>{slug || 'tu-negocio'}</Text>
                  </Text>
                </View>

                <View style={styles.successActions}>
                  <TouchableOpacity
                    style={styles.btnFilledSuccess}
                    onPress={handleFinish}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnFilledText}>Entrar al Dashboard</Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnOutlineSuccess}
                    onPress={handleShareLink}
                    activeOpacity={0.8}
                  >
                    <Feather name={isCopied ? 'check' : 'share-2'} size={16} color="#C57747" />
                    <Text style={[styles.btnOutlineText, { color: '#C57747', fontWeight: '700' }]}>
                      {isCopied ? '¡Enlace Compartido!' : 'Compartir enlace público'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* BARRA INFERIOR DE ACCIONES */}
          {step < 5 && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.bottomBar}>
              {step > 1 ? (
                <TouchableOpacity style={styles.btnOutline} onPress={prevStep} disabled={isLoading}>
                  <SymbolView
                    name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
                    size={14}
                    tintColor="#374151"
                  />
                  <Text style={styles.btnOutlineText}>Atrás</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              <TouchableOpacity
                style={[
                  styles.btnFilled,
                  (step === 1 && !category) && styles.btnFilledDisabled,
                  (step === 2 && !businessName.trim()) && styles.btnFilledDisabled,
                  (step === 4 && (!serviceName.trim() || !serviceDuration.trim())) && styles.btnFilledDisabled,
                  isLoading && styles.btnFilledDisabled,
                ]}
                disabled={
                  (step === 1 && !category) ||
                  (step === 2 && !businessName.trim()) ||
                  (step === 4 && (!serviceName.trim() || !serviceDuration.trim())) ||
                  isLoading
                }
                onPress={handleNext}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnFilledText}>
                      {step === 4 ? 'Guardar y Finalizar' : 'Continuar'}
                    </Text>
                    {step < 4 && (
                      <SymbolView
                        name={{ ios: 'chevron.forward', android: 'arrow_forward', web: 'arrow_forward' }}
                        size={14}
                        tintColor="#FFFFFF"
                      />
                    )}
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Modal / Bottom Sheet para editar disponibilidad */}
      <BottomSheet
        visible={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="Editar Disponibilidad"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Días de atención</Text>
          <View style={styles.daysGrid}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => {
              const isActive = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCircle, isActive && styles.dayCircleActive]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sheetLabel}>Horario general</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeInputBox}>
              <Text style={styles.timeLabel}>Apertura</Text>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00 AM"
              />
            </View>
            <View style={styles.timeSeparator}>
              <Text style={styles.timeTo}>hasta</Text>
            </View>
            <View style={styles.timeInputBox}>
              <Text style={styles.timeLabel}>Cierre</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="06:00 PM"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.sheetButton}
            onPress={() => setIsBottomSheetOpen(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.sheetButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoutBtnSm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutTextSm: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#C57747',
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
    flexGrow: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C57747',
    marginBottom: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 36,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 32,
  },
  cardList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardSelected: {
    borderColor: '#C57747',
    backgroundColor: '#FFFBF7',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconSelected: {
    backgroundColor: '#FFF3EA',
    borderColor: '#F0D4BD',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  cardTitleMuted: {
    color: '#9CA3AF',
  },
  cardSub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleOn: {
    borderColor: '#C57747',
    backgroundColor: '#C57747',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 12 }),
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  slugPreview: {
    marginTop: 28,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  slugTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  slugBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slugText: {
    fontSize: 15,
  },
  slugDomain: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  slugValue: {
    color: '#C57747',
    fontWeight: '700',
  },
  slugHelper: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  availabilityBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    overflow: 'hidden',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  availDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 54,
  },
  availIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF3EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availContent: {
    flex: 1,
  },
  availLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  availValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  editLink: {
    color: '#C57747',
    fontWeight: '600',
    fontSize: 14,
    padding: 4,
  },
  addForm: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  editRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  editField: {
    flex: 1,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  successCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  successCircleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF4ED',
    borderWidth: 2,
    borderColor: '#F0D4BD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#C57747',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  successCircleInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F0D4BD',
  },
  successHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  successDesc: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  successLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBF7',
    borderWidth: 1.5,
    borderColor: '#F0D4BD',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 36,
    width: '100%',
    maxWidth: 380,
  },
  successLinkText: {
    fontSize: 15,
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  btnFilledSuccess: {
    height: 54,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C57747',
    shadowColor: '#C57747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  btnOutlineSuccess: {
    height: 54,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F0D4BD',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.select({ ios: 32, default: 20 }),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnOutline: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  btnOutlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  btnFilled: {
    flex: 1.5,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C57747',
  },
  btnFilledDisabled: {
    opacity: 0.4,
  },
  btnFilledText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetContent: {
    paddingVertical: 16,
  },
  sheetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    marginTop: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayCircleActive: {
    backgroundColor: '#C57747',
    borderColor: '#C57747',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  timeInputBox: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  timeInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'center',
  },
  timeSeparator: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  timeTo: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  sheetButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
