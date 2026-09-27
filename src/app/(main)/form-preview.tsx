import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Definición de los campos del formulario ─────────────
interface FormField {
  key: string;
  icon: string;
  iconPack: 'feather' | 'material';
  label: string;
  placeholder: string;
  placeholderLarge: string;
  type: 'select' | 'counter' | 'textarea' | 'chips';
  gradient: [string, string];
}

const FORM_FIELDS: FormField[] = [
  {
    key: 'requiresProfessional',
    icon: 'chef-hat',
    iconPack: 'material',
    label: 'Chef / Mesero',
    placeholder: 'Selecciona tu mesero',
    placeholderLarge: 'Selecciona tu chef de estación',
    type: 'select',
    gradient: ['#F97316', '#FB923C'],
  },
  {
    key: 'requiresService',
    icon: 'silverware-fork-knife',
    iconPack: 'material',
    label: 'Tipo de Experiencia',
    placeholder: 'Ej. Menú del día',
    placeholderLarge: 'Ej. Menú degustación 7 tiempos',
    type: 'chips',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
  {
    key: 'requiresGuestCount',
    icon: 'users',
    iconPack: 'feather',
    label: 'Número de Comensales',
    placeholder: '2',
    placeholderLarge: '12',
    type: 'counter',
    gradient: ['#10B981', '#34D399'],
  },
  {
    key: 'requiresTable',
    icon: 'map-pin',
    iconPack: 'feather',
    label: 'Zona Preferida',
    placeholder: 'Selecciona zona',
    placeholderLarge: 'Selecciona zona o salón',
    type: 'chips',
    gradient: ['#EC4899', '#F472B6'],
  },
  {
    key: 'requiresSpecialRequests',
    icon: 'file-text',
    iconPack: 'feather',
    label: 'Peticiones Especiales',
    placeholder: 'Alergias, cumpleaños, dieta especial…',
    placeholderLarge: 'Alergias, celebraciones, requerimientos…',
    type: 'textarea',
    gradient: ['#6366F1', '#818CF8'],
  },
];

// Opciones de chips para "experiencia"
const SERVICE_CHIPS_SMALL = ['Menú del Día', 'Carta Regular', 'Brunch', 'Cena'];
const SERVICE_CHIPS_LARGE = ['Degustación', 'Maridaje', 'Buffet', 'À la carte', 'Privado'];

// Opciones de chips para "zona"
const ZONE_CHIPS_SMALL = ['Interior', 'Terraza', 'Barra', 'Ventana'];
const ZONE_CHIPS_LARGE = ['Salón VIP', 'Terraza', 'Rooftop', 'Jardín', 'Barra', 'Privado'];

export default function FormPreviewScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    config?: string;
    size?: string;
    businessName?: string;
  }>();

  const config = useMemo(() => {
    try {
      return params.config ? JSON.parse(params.config) : {};
    } catch {
      return {};
    }
  }, [params.config]);

  const size = (params.size || 'small') as 'small' | 'large';
  const businessName = params.businessName || 'Mi Restaurante';

  const activeFields = FORM_FIELDS.filter((f) => config[f.key]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.screen, { backgroundColor: isDark ? '#0A0A0A' : '#F5F3EF' }]}>  
        {/* ─── Header del Restaurante ─── */}
        <LinearGradient
          colors={isDark ? ['#1A1A1A', '#121212'] : ['#1C1917', '#292524']}
          style={styles.restaurantHeader}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>Vista Previa</Text>
              </View>
            </View>

            <View style={styles.restaurantInfo}>
              <View style={styles.restaurantLogo}>
                <Text style={{ fontSize: 28 }}>🍽️</Text>
              </View>
              <Text style={styles.restaurantName}>{businessName}</Text>
              <Text style={styles.restaurantTagline}>
                {size === 'large'
                  ? 'Experiencia gastronómica exclusiva'
                  : 'Tu mesa te espera'}
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ─── Formulario ─── */}
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={[styles.formTitle, { color: isDark ? '#E5E5E5' : '#1C1917' }]}>
              Reserva tu Mesa
            </Text>
            <Text style={[styles.formSubtitle, { color: isDark ? '#737373' : '#78716C' }]}>
              Completa los datos para asegurar tu experiencia
            </Text>
          </Animated.View>

          {/* Campo siempre visible: Fecha y Hora */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  style={styles.fieldIconDot}
                >
                  <Feather name="calendar" size={14} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.fieldLabel, { color: isDark ? '#D4D4D4' : '#44403C' }]}>
                  Fecha y Hora
                </Text>
              </View>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[
                    styles.dateTimeBox,
                    {
                      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Feather name="calendar" size={16} color={isDark ? '#A3A3A3' : '#78716C'} />
                  <Text style={[styles.dateTimeText, { color: isDark ? '#A3A3A3' : '#78716C' }]}>
                    Sábado, 28 Sep
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dateTimeBox,
                    {
                      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Feather name="clock" size={16} color={isDark ? '#A3A3A3' : '#78716C'} />
                  <Text style={[styles.dateTimeText, { color: isDark ? '#A3A3A3' : '#78716C' }]}>
                    8:00 PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Campos dinámicos */}
          {activeFields.map((field, idx) => {
            const IconComp = field.iconPack === 'material' ? MaterialCommunityIcons : Feather;
            const placeholder = size === 'large' ? field.placeholderLarge : field.placeholder;

            return (
              <Animated.View
                key={field.key}
                entering={FadeInUp.duration(400).delay(400 + idx * 100)}
              >
                <View style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <LinearGradient
                      colors={field.gradient}
                      style={styles.fieldIconDot}
                    >
                      <IconComp name={field.icon as any} size={14} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[styles.fieldLabel, { color: isDark ? '#D4D4D4' : '#44403C' }]}>
                      {field.label}
                    </Text>
                  </View>

                  {/* Renderizado según tipo */}
                  {field.type === 'select' && (
                    <TouchableOpacity
                      style={[
                        styles.selectInput,
                        {
                          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: isDark ? '#525252' : '#A8A29E', fontSize: 14 }}>
                        {placeholder}
                      </Text>
                      <Feather name="chevron-down" size={16} color={isDark ? '#525252' : '#A8A29E'} />
                    </TouchableOpacity>
                  )}

                  {field.type === 'counter' && (
                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        style={[
                          styles.counterBtn,
                          {
                            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                          },
                        ]}
                      >
                        <Feather name="minus" size={18} color={isDark ? '#737373' : '#78716C'} />
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.counterValue,
                          {
                            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                            borderColor: field.gradient[0] + '40',
                          },
                        ]}
                      >
                        <Text style={[styles.counterText, { color: field.gradient[0] }]}>
                          {placeholder}
                        </Text>
                        <Text style={{ fontSize: 11, color: isDark ? '#525252' : '#A8A29E' }}>
                          personas
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.counterBtn,
                          {
                            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                          },
                        ]}
                      >
                        <Feather name="plus" size={18} color={isDark ? '#737373' : '#78716C'} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {field.type === 'chips' && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsRow}
                    >
                      {(field.key === 'requiresService'
                        ? (size === 'large' ? SERVICE_CHIPS_LARGE : SERVICE_CHIPS_SMALL)
                        : (size === 'large' ? ZONE_CHIPS_LARGE : ZONE_CHIPS_SMALL)
                      ).map((chip, ci) => (
                        <TouchableOpacity
                          key={chip}
                          style={[
                            styles.chip,
                            ci === 0
                              ? {
                                  backgroundColor: field.gradient[0] + '18',
                                  borderColor: field.gradient[0] + '50',
                                }
                              : {
                                  backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: ci === 0 ? field.gradient[0] : (isDark ? '#A3A3A3' : '#78716C') },
                            ]}
                          >
                            {chip}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {field.type === 'textarea' && (
                    <View
                      style={[
                        styles.textareaBox,
                        {
                          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        },
                      ]}
                    >
                      <TextInput
                        placeholder={placeholder}
                        placeholderTextColor={isDark ? '#525252' : '#A8A29E'}
                        multiline
                        style={[styles.textareaInput, { color: isDark ? '#E5E5E5' : '#1C1917' }]}
                        editable={false}
                      />
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}

          {/* ─── Botón de Reservar ─── */}
          <Animated.View entering={FadeInUp.duration(500).delay(700)}>
            <TouchableOpacity style={styles.reserveBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.reserveBtnGradient}
              >
                <Text style={styles.reserveBtnText}>Confirmar Reservación</Text>
                <View style={styles.reserveBtnArrow}>
                  <Feather name="arrow-right" size={16} color="#6366F1" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.footerNote, { color: isDark ? '#525252' : '#A8A29E' }]}>
              Recibirás un correo de confirmación al instante
            </Text>
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  restaurantHeader: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(99,102,241,0.2)',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A5B4FC',
  },
  restaurantInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  restaurantLogo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  restaurantTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },

  // Form
  formScroll: { flex: 1 },
  formContent: { padding: 20 },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Fields
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldIconDot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Select
  selectInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  // Counter
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 20,
    fontWeight: '800',
  },

  // Chips
  chipsRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Textarea
  textareaBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 80,
  },
  textareaInput: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Date/Time
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeBox: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // CTA
  reserveBtn: {
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  reserveBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  reserveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reserveBtnArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 12,
  },
});
