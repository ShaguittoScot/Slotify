import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { CANONICAL_SECTOR_CATEGORIES } from '@/features/sector-templates/constants';
import { useAuthStore } from '@/features/auth/model';
import { BottomSheet } from '@/components/ui/BottomSheet';

// Helper to generate slug
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

// Initial template suggestions based on category
const getSuggestedService = (category: string) => {
  if (category === 'Salud y Bienestar') return { name: 'Consulta General', duration: '45', price: '500' };
  if (category === 'Belleza y Cuidado Personal') return { name: 'Corte de Cabello', duration: '45', price: '300' };
  if (category === 'Fitness y Deportes') return { name: 'Clase de Prueba', duration: '60', price: '0' };
  if (category === 'Servicios Profesionales') return { name: 'Llamada de Descubrimiento', duration: '15', price: '0' };
  return { name: 'Mi Primer Servicio', duration: '30', price: '100' };
};

export default function UnifiedOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const { user, completeOnboarding, logout } = useAuthStore();

  // State
  const [category, setCategory] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [timezone, setTimezone] = useState('Autodetectada (América/México)');
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // BottomSheet State
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState(['L', 'M', 'X', 'J', 'V']);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(prev => prev.filter(d => d !== day));
    } else {
      setSelectedDays(prev => [...prev, day]);
    }
  };
  
  const formatDays = () => {
    if (selectedDays.length === 5 && !selectedDays.includes('S') && !selectedDays.includes('D')) return 'Lunes a Viernes';
    if (selectedDays.length === 7) return 'Todos los días';
    if (selectedDays.length === 0) return 'Ningún día';
    return selectedDays.join(', ');
  };

  // Sync slug with business name
  useEffect(() => {
    setSlug(generateSlug(businessName));
  }, [businessName]);

  // Sync service suggestion when category changes
  useEffect(() => {
    if (category) {
      const suggestion = getSuggestedService(category);
      setServiceName(suggestion.name);
      setServiceDuration(suggestion.duration);
      setServicePrice(suggestion.price);
    }
  }, [category]);

  const handleNext = async () => {
    if (step === 4) {
      setIsLoading(true);
      try {
        const selectedCat = CANONICAL_SECTOR_CATEGORIES.find(c => c.name === category);
        await completeOnboarding({
          fullName: user?.fullName || 'Usuario',
          businessName,
          sectorTemplateId: selectedCat?.id || 99,
          businessPhone: '',
        });
        setStep(5);
      } catch (error) {
        console.error('Failed to sync profile', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = () => {
    router.replace('/(main)' as any);
  };

  // Progress percentage
  const progress = (step / 5) * 100;

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView 
        style={s.flex1} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.shell}>
          
          {/* Header con botón de cerrar sesión */}
          <View style={s.headerRow}>
            <TouchableOpacity onPress={logout} style={s.logoutBtnSm} activeOpacity={0.7}>
              <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} size={16} tintColor="#EF4444" />
              <Text style={s.logoutTextSm}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar (Hide on success) */}
          {step < 5 && (
            <View style={s.progressBarTrack}>
              <View style={[s.progressBarFill, { width: `${progress}%` }]} />
            </View>
          )}

          <ScrollView
            contentContainerStyle={s.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* STEP 1: CATEGORY */}
            {step === 1 && (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
                <Text style={s.label}>Paso 1 de 4</Text>
                <Text style={s.heading}>¿A qué sector pertenece tu negocio?</Text>
                <Text style={s.desc}>
                  Esto nos ayudará a personalizar tu experiencia y sugerir los mejores servicios para ti.
                </Text>

                <View style={s.cardList}>
                  {CANONICAL_SECTOR_CATEGORIES.map((cat, idx) => {
                    const isSelected = category === cat.name;
                    return (
                      <Animated.View key={cat.name} entering={FadeInDown.delay(idx * 40).springify().damping(16)}>
                        <TouchableOpacity
                          style={[s.card, isSelected && s.cardSelected]}
                          onPress={() => setCategory(cat.name)}
                          activeOpacity={0.7}
                        >
                          <View style={[s.cardIcon, isSelected && s.cardIconSelected]}>
                            <SymbolView
                              name={cat.iconName as any}
                              size={18}
                              tintColor={isSelected ? '#C57747' : '#9CA3AF'}
                            />
                          </View>
                          <View style={s.cardBody}>
                            <Text style={[s.cardTitle, !isSelected && s.cardTitleMuted]}>{cat.name}</Text>
                            <Text style={s.cardSub}>{cat.description}</Text>
                          </View>
                          <View style={[s.checkCircle, isSelected && s.checkCircleOn]}>
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

            {/* STEP 2: PROFILE */}
            {step === 2 && (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
                <Text style={s.label}>Paso 2 de 4</Text>
                <Text style={s.heading}>Perfil e Identidad</Text>
                <Text style={s.desc}>
                  Configura tu escaparate digital. Este será el nombre público que verán tus clientes.
                </Text>

                <Text style={s.fieldLabel}>Nombre del negocio</Text>
                <View style={s.inputRow}>
                  <SymbolView
                    name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
                    size={18}
                    tintColor={businessName.length > 0 ? '#C57747' : '#9CA3AF'}
                  />
                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Ej. Clínica Vital"
                    placeholderTextColor="#9CA3AF"
                    style={[s.input, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                  />
                </View>

                {/* SLUG PREVIEW */}
                <View style={s.slugPreview}>
                  <Text style={s.slugTitle}>Tu enlace único:</Text>
                  <View style={s.slugBox}>
                    <SymbolView name={{ ios: 'link', android: 'link', web: 'link' }} size={14} tintColor="#6B7280" />
                    <Text style={s.slugText} numberOfLines={1}>
                      <Text style={s.slugDomain}>slotly.app/</Text>
                      <Text style={s.slugValue}>{slug || 'tu-negocio'}</Text>
                    </Text>
                  </View>
                  <Text style={s.slugHelper}>Podrás compartir este enlace para que te reserven 24/7.</Text>
                </View>
              </Animated.View>
            )}

            {/* STEP 3: AVAILABILITY */}
            {step === 3 && (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
                <Text style={s.label}>Paso 3 de 4</Text>
                <Text style={s.heading}>Disponibilidad Base</Text>
                <Text style={s.desc}>
                  Para empezar rápido, configuraremos un horario estándar. Podrás añadir sedes, descansos y múltiples profesionales más adelante.
                </Text>

                <View style={s.availabilityBox}>
                  <View style={s.availRow}>
                    <View style={s.availIconBox}>
                      <SymbolView name={{ ios: 'globe', android: 'public', web: 'public' }} size={18} tintColor="#C57747" />
                    </View>
                    <View style={s.availContent}>
                      <Text style={s.availLabel}>Zona Horaria</Text>
                      <Text style={s.availValue}>{timezone}</Text>
                    </View>
                  </View>
                  <View style={s.availDivider} />
                  <View style={s.availRow}>
                    <View style={s.availIconBox}>
                      <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={18} tintColor="#C57747" />
                    </View>
                    <View style={s.availContent}>
                      <Text style={s.availLabel}>Días de Trabajo</Text>
                      <Text style={s.availValue}>{formatDays()}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsBottomSheetOpen(true)}>
                      <Text style={s.editLink}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.availDivider} />
                  <View style={s.availRow}>
                    <View style={s.availIconBox}>
                      <SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={18} tintColor="#C57747" />
                    </View>
                    <View style={s.availContent}>
                      <Text style={s.availLabel}>Horario Base</Text>
                      <Text style={s.availValue}>{startTime} a {endTime}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsBottomSheetOpen(true)}>
                      <Text style={s.editLink}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* STEP 4: FIRST SERVICE */}
            {step === 4 && (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
                <Text style={s.label}>Último paso</Text>
                <Text style={s.heading}>Tu Primer Servicio</Text>
                <Text style={s.desc}>
                  Para {category} te sugerimos esta plantilla. Puedes ajustar los datos o cambiar el nombre por completo.
                </Text>

                <View style={s.addForm}>
                  <View>
                    <Text style={s.editLabel}>Nombre del servicio</Text>
                    <TextInput
                      value={serviceName}
                      onChangeText={setServiceName}
                      placeholder="Ej. Corte de cabello"
                      placeholderTextColor="#9CA3AF"
                      style={[s.editInput, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                    />
                  </View>
                  <View style={s.editRow}>
                    <View style={s.editField}>
                      <Text style={s.editLabel}>Duración (min)</Text>
                      <TextInput
                        value={serviceDuration}
                        onChangeText={setServiceDuration}
                        keyboardType="number-pad"
                        style={[s.editInput, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                      />
                    </View>
                    <View style={s.editField}>
                      <Text style={s.editLabel}>Precio ($)</Text>
                      <TextInput
                        value={servicePrice}
                        onChangeText={setServicePrice}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        style={[s.editInput, Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}]}
                      />
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* STEP 5: SUCCESS */}
            {step === 5 && (
              <Animated.View entering={FadeIn.duration(500)} style={s.successCenter}>
                <View style={s.successCircle}>
                  <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={42} tintColor="#FFFFFF" />
                </View>
                <Text style={s.successHeading}>¡Tu espacio de {category} está listo!</Text>
                <Text style={s.successDesc}>
                  Hemos configurado todo para que empieces a recibir citas. Tu portal público está activo en:
                </Text>
                
                <View style={s.successLinkBox}>
                  <Text style={s.successLinkText} numberOfLines={1}>slotly.app/{slug}</Text>
                </View>

                <View style={s.successActions}>
                  <TouchableOpacity style={s.btnOutlineSuccess} onPress={() => {}}>
                    <SymbolView name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }} size={16} tintColor="#374151" />
                    <Text style={s.btnOutlineText}>Copiar enlace</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.btnFilledSuccess} onPress={handleFinish}>
                    <Text style={s.btnFilledText}>Ir al Dashboard</Text>
                    <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={16} tintColor="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

          </ScrollView>

          {/* BOTTOM BAR (Hidden on Success) */}
          {step < 5 && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={s.bottomBar}>
              {step > 1 ? (
                <TouchableOpacity style={s.btnOutline} onPress={handleBack}>
                  <SymbolView
                    name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
                    size={14}
                    tintColor="#374151"
                  />
                  <Text style={s.btnOutlineText}>Atrás</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              <TouchableOpacity
                style={[
                  s.btnFilled,
                  (step === 1 && !category) && s.btnFilledDisabled,
                  (step === 2 && !businessName) && s.btnFilledDisabled,
                  (step === 4 && (!serviceName || !serviceDuration)) && s.btnFilledDisabled,
                ]}
                disabled={
                  (step === 1 && !category) ||
                  (step === 2 && !businessName) ||
                  (step === 4 && (!serviceName || !serviceDuration)) ||
                  isLoading
                }
                onPress={handleNext}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={s.btnFilledText}>{step === 4 ? 'Guardar y Finalizar' : 'Continuar'}</Text>
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

      {/* Bottom Sheet para editar disponibilidad */}
      <BottomSheet 
        visible={isBottomSheetOpen} 
        onClose={() => setIsBottomSheetOpen(false)}
        title="Editar Disponibilidad"
      >
        <View style={s.sheetContent}>
          <Text style={s.sheetLabel}>Días laborables</Text>
          <View style={s.daysGrid}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => {
              const isActive = selectedDays.includes(day);
              return (
                <TouchableOpacity 
                  key={day} 
                  style={[s.dayCircle, isActive && s.dayCircleActive]} 
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dayText, isActive && s.dayTextActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Text style={s.sheetLabel}>Horario general</Text>
          <View style={s.timeRow}>
            <View style={s.timeInputBox}>
              <Text style={s.timeLabel}>Inicio</Text>
              <TextInput 
                style={s.timeInput} 
                value={startTime} 
                onChangeText={setStartTime} 
                placeholder="09:00 AM" 
              />
            </View>
            <View style={s.timeSeparator}>
              <Text style={s.timeTo}>hasta</Text>
            </View>
            <View style={s.timeInputBox}>
              <Text style={s.timeLabel}>Fin</Text>
              <TextInput 
                style={s.timeInput} 
                value={endTime} 
                onChangeText={setEndTime} 
                placeholder="06:00 PM" 
              />
            </View>
          </View>
          
          <TouchableOpacity style={s.sheetButton} onPress={() => setIsBottomSheetOpen(false)}>
            <Text style={s.sheetButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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

  // Header & Logout
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

  // Progress Bar
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
    paddingTop: 32,
    paddingBottom: 120,
    flexGrow: 1,
  },

  // Typography
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

  // STEP 1 Cards
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

  // STEP 2 Inputs & Slug
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
    marginTop: 32,
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

  // STEP 3 Availability
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
    marginLeft: 54, // align with content
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

  // STEP 4 Add Form
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

  // STEP 5 Success Center
  successCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C57747',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#C57747',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  successLinkBox: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 40,
  },
  successLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  btnOutlineSuccess: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  btnFilledSuccess: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
  },

  // Bottom Bar (Steps 1-4)
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
  editLink: {
    color: '#C57747',
    fontWeight: '600',
    fontSize: 14,
    padding: 4,
  },
  // Bottom Sheet Styles
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
  }
});
