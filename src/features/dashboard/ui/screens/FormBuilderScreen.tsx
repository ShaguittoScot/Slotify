import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';
import { useRouter } from 'expo-router';
import { FluidToggleSwitch } from '@/components/ui/FluidToggleSwitch';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Tipos ────────────────────────────────────────────────
export interface BookingFormConfig {
  requiresProfessional: boolean;
  requiresService: boolean;
  requiresGuestCount: boolean;
  requiresTable: boolean;
  requiresSpecialRequests: boolean;
}

type RestaurantSize = 'small' | 'large';

// ─── Metadata de cada opción ──────────────────────────────
interface ConfigOption {
  key: keyof BookingFormConfig;
  icon: string;
  iconPack: 'feather' | 'material';
  title: string;
  description: string;
  descLarge: string;
  gradient: [string, string];
  previewLabel: string;
  previewPlaceholder: string;
  previewPlaceholderLarge: string;
}

const CONFIG_OPTIONS: ConfigOption[] = [
  {
    key: 'requiresProfessional',
    icon: 'chef-hat',
    iconPack: 'material',
    title: 'Seleccionar Chef / Mesero',
    description: 'El comensal puede elegir quién lo atiende.',
    descLarge: 'El comensal elige su mesero o chef de estación favorito.',
    gradient: ['#F97316', '#FB923C'],
    previewLabel: '👨‍🍳 Chef / Mesero',
    previewPlaceholder: 'Ej. Chef Martínez',
    previewPlaceholderLarge: 'Ej. Sección de Chef Ramírez',
  },
  {
    key: 'requiresService',
    icon: 'silverware-fork-knife',
    iconPack: 'material',
    title: 'Tipo de Experiencia',
    description: 'Menú del día, carta regular, brunch…',
    descLarge: 'Menú degustación, maridaje, buffet, carta à la carte…',
    gradient: ['#8B5CF6', '#A78BFA'],
    previewLabel: '🍽️ Experiencia',
    previewPlaceholder: 'Ej. Menú del día',
    previewPlaceholderLarge: 'Ej. Menú degustación 7 tiempos',
  },
  {
    key: 'requiresGuestCount',
    icon: 'users',
    iconPack: 'feather',
    title: 'Número de Comensales',
    description: '¿Cuántas personas vendrán a la mesa?',
    descLarge: '¿Cuántas personas? Ideal para grupos y eventos.',
    gradient: ['#10B981', '#34D399'],
    previewLabel: '👥 Comensales',
    previewPlaceholder: '2 personas',
    previewPlaceholderLarge: '12 personas',
  },
  {
    key: 'requiresTable',
    icon: 'map-pin',
    iconPack: 'feather',
    title: 'Zona / Mesa Preferida',
    description: 'Terraza, salón, barra, ventana…',
    descLarge: 'Salón privado, terraza VIP, jardín, rooftop…',
    gradient: ['#EC4899', '#F472B6'],
    previewLabel: '🪑 Zona preferida',
    previewPlaceholder: 'Terraza',
    previewPlaceholderLarge: 'Salón Privado VIP',
  },
  {
    key: 'requiresSpecialRequests',
    icon: 'file-text',
    iconPack: 'feather',
    title: 'Peticiones Especiales',
    description: 'Alergias, cumpleaños, dietas especiales…',
    descLarge: 'Alergias, celebraciones, requerimientos corporativos…',
    gradient: ['#6366F1', '#818CF8'],
    previewLabel: '📝 Notas especiales',
    previewPlaceholder: 'Ej. Sin gluten, cumpleaños',
    previewPlaceholderLarge: 'Ej. Evento corporativo, menú vegetariano',
  },
];

// ═══════════════════════════════════════════════════════════
// ConfigCard — Tarjeta de opción animada
// ═══════════════════════════════════════════════════════════
function ConfigCard({
  option,
  active,
  onToggle,
  index,
  isDark,
  colors,
  size,
}: {
  option: ConfigOption;
  active: boolean;
  onToggle: () => void;
  index: number;
  isDark: boolean;
  colors: any;
  size: RestaurantSize;
}) {
  const scale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const desc = size === 'large' ? option.descLarge : option.description;

  const IconComponent = option.iconPack === 'material' ? MaterialCommunityIcons : Feather;

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(120 + index * 90).springify()}
      layout={Layout.springify()}
      style={animatedCardStyle}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onToggle}
        style={[
          styles.configCard,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
            borderColor: active
              ? option.gradient[0] + '60'
              : isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.06)',
            shadowColor: active ? option.gradient[0] : '#000',
            shadowOpacity: active ? 0.15 : 0.04,
          },
        ]}
      >
        {/* Icono con gradiente */}
        <LinearGradient
          colors={active ? option.gradient : [isDark ? '#3A3A3A' : '#E5E5E5', isDark ? '#525252' : '#D4D4D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.configIconBox}
        >
          <IconComponent name={option.icon as any} size={20} color="#FFFFFF" />
        </LinearGradient>

        {/* Texto */}
        <View style={styles.configTextBox}>
          <Text
            style={[
              styles.configTitle,
              { color: active ? colors.text.primary : colors.text.secondary },
            ]}
          >
            {option.title}
          </Text>
          <Text
            style={[styles.configDesc, { color: colors.text.muted }]}
            numberOfLines={2}
          >
            {desc}
          </Text>
        </View>

        {/* Toggle */}
        <FluidToggleSwitch
          value={active}
          onValueChange={onToggle}
          activeColor={option.gradient[0]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════
// LivePreviewCard — Vista previa reactiva
// ═══════════════════════════════════════════════════════════
function LivePreviewCard({
  config,
  isDark,
  colors,
  businessName,
  size,
}: {
  config: BookingFormConfig;
  isDark: boolean;
  colors: any;
  businessName: string;
  size: RestaurantSize;
}) {
  const activeOptions = CONFIG_OPTIONS.filter((opt) => config[opt.key]);

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(700)}
      style={styles.previewWrapper}
    >
      <View style={styles.previewHeaderRow}>
        <Text style={[styles.previewTitle, { color: colors.text.primary }]}>
          Vista Previa en Vivo
        </Text>
        <View style={[styles.previewBadge, { backgroundColor: '#10B98118' }]}>
          <View style={styles.previewDot} />
          <Text style={styles.previewBadgeText}>En vivo</Text>
        </View>
      </View>

      <View
        style={[
          styles.previewPhone,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        {/* Header del "formulario" */}
        <LinearGradient
          colors={isDark ? ['#262626', '#1E1E1E'] : ['#171717', '#262626']}
          style={styles.previewPhoneHeader}
        >
          <Text style={styles.previewBizName}>
            {businessName || 'Mi Restaurante'}
          </Text>
          <Text style={styles.previewBizSub}>Reservación en línea</Text>
        </LinearGradient>

        <View style={styles.previewBody}>
          {/* Campo siempre visible: Fecha y Hora */}
          <Animated.View layout={Layout.springify()} style={styles.previewField}>
            <Text style={[styles.previewFieldLabel, { color: isDark ? '#A3A3A3' : '#525252' }]}>
              📅 Fecha y Hora
            </Text>
            <View
              style={[
                styles.previewFieldInput,
                { backgroundColor: isDark ? '#262626' : '#F2F2F2' },
              ]}
            >
              <Text style={{ color: isDark ? '#737373' : '#A3A3A3', fontSize: 13 }}>
                Sábado 28 Sep, 8:00 PM
              </Text>
            </View>
          </Animated.View>

          {/* Campos dinámicos */}
          {activeOptions.map((opt) => (
            <Animated.View
              key={opt.key}
              entering={FadeInUp.duration(350).springify()}
              exiting={FadeOut.duration(200)}
              layout={Layout.springify()}
              style={styles.previewField}
            >
              <Text
                style={[styles.previewFieldLabel, { color: isDark ? '#A3A3A3' : '#525252' }]}
              >
                {opt.previewLabel}
              </Text>
              <View
                style={[
                  styles.previewFieldInput,
                  { backgroundColor: isDark ? '#262626' : '#F2F2F2' },
                ]}
              >
                <Text style={{ color: isDark ? '#737373' : '#A3A3A3', fontSize: 13 }}>
                  {size === 'large' ? opt.previewPlaceholderLarge : opt.previewPlaceholder}
                </Text>
              </View>
            </Animated.View>
          ))}

          {/* Botón simulado */}
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.previewCTA}
          >
            <Text style={styles.previewCTAText}>Reservar Mesa 🍽️</Text>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════
// SizeSelector — Selector de tamaño de restaurante
// ═══════════════════════════════════════════════════════════
function SizeSelector({
  size,
  onSelect,
  isDark,
  colors,
}: {
  size: RestaurantSize;
  onSelect: (s: RestaurantSize) => void;
  isDark: boolean;
  colors: any;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.sizeRow}>
      <TouchableOpacity
        style={[
          styles.sizeOption,
          {
            backgroundColor: size === 'small'
              ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)')
              : (isDark ? 'rgba(255,255,255,0.03)' : '#F9F9F9'),
            borderColor: size === 'small' ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
            borderWidth: size === 'small' ? 1.5 : 1,
          },
        ]}
        onPress={() => onSelect('small')}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 24, marginBottom: 4 }}>🏠</Text>
        <Text style={[styles.sizeLabel, { color: size === 'small' ? '#6366F1' : colors.text.secondary }]}>
          Pequeño
        </Text>
        <Text style={[styles.sizeSub, { color: colors.text.muted }]}>1-30 mesas</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.sizeOption,
          {
            backgroundColor: size === 'large'
              ? (isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)')
              : (isDark ? 'rgba(255,255,255,0.03)' : '#F9F9F9'),
            borderColor: size === 'large' ? '#8B5CF6' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
            borderWidth: size === 'large' ? 1.5 : 1,
          },
        ]}
        onPress={() => onSelect('large')}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 24, marginBottom: 4 }}>🏢</Text>
        <Text style={[styles.sizeLabel, { color: size === 'large' ? '#8B5CF6' : colors.text.secondary }]}>
          Grande
        </Text>
        <Text style={[styles.sizeSub, { color: colors.text.muted }]}>30+ mesas</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════
// FormBuilderScreen — Pantalla Principal
// ═══════════════════════════════════════════════════════════
export function FormBuilderScreen() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const router = useRouter();

  const [restaurantSize, setRestaurantSize] = useState<RestaurantSize>('small');
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BookingFormConfig>({
    requiresProfessional: false,
    requiresService: false,
    requiresGuestCount: true,
    requiresTable: true,
    requiresSpecialRequests: false,
  });

  const toggleOption = useCallback((key: keyof BookingFormConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simular guardado local (backend aún no tiene endpoint)
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    Alert.alert(
      '✅ Formulario Guardado',
      'Tu formulario de reservación ha sido actualizado. Cuando el backend esté listo, se sincronizará automáticamente.',
      [{ text: 'Perfecto', onPress: () => router.back() }]
    );
  };

  const handlePreview = () => {
    router.push({
      pathname: '/(main)/form-preview' as any,
      params: {
        config: JSON.stringify(config),
        size: restaurantSize,
        businessName: user?.businessName || user?.fullName || 'Mi Restaurante',
      },
    });
  };

  const activeCount = Object.values(config).filter(Boolean).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero ─── */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
            Personaliza tu Formulario
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]}>
            Diseña la experiencia que vivirán tus comensales al reservar. Cada
            opción que actives aparecerá en el formulario de tu cliente.
          </Text>
        </Animated.View>

        {/* ─── Selector de Tamaño ─── */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>
            Tamaño de tu Restaurante
          </Text>
        </Animated.View>
        <SizeSelector
          size={restaurantSize}
          onSelect={setRestaurantSize}
          isDark={isDark}
          colors={colors}
        />

        {/* ─── Opciones ─── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>
              Opciones del Formulario
            </Text>
            <View style={[styles.countBadge, { backgroundColor: '#6366F118' }]}>
              <Text style={styles.countBadgeText}>{activeCount} activas</Text>
            </View>
          </View>
        </Animated.View>

        {CONFIG_OPTIONS.map((opt, idx) => (
          <ConfigCard
            key={opt.key}
            option={opt}
            active={config[opt.key]}
            onToggle={() => toggleOption(opt.key)}
            index={idx}
            isDark={isDark}
            colors={colors}
            size={restaurantSize}
          />
        ))}

        {/* ─── Vista Previa en Vivo ─── */}
        <LivePreviewCard
          config={config}
          isDark={isDark}
          colors={colors}
          businessName={user?.businessName || user?.fullName || 'Mi Restaurante'}
          size={restaurantSize}
        />

        {/* Espaciado inferior para el footer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ─── Footer Fijo ─── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: isDark ? 'rgba(18,18,18,0.96)' : 'rgba(255,255,255,0.96)',
            borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        {/* Botón Vista Previa */}
        <TouchableOpacity
          style={[
            styles.previewBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
          onPress={handlePreview}
          activeOpacity={0.7}
        >
          <Feather name="eye" size={16} color={colors.text.secondary} />
          <Text style={[styles.previewBtnText, { color: colors.text.secondary }]}>
            Vista Previa
          </Text>
        </TouchableOpacity>

        {/* Botón Guardar */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={saving ? ['#737373', '#525252'] : ['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {saving ? (
              <Text style={styles.saveBtnText}>Guardando…</Text>
            ) : (
              <>
                <Feather name="check" size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Guardar Configuración</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Hero
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },

  // Section
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },

  // Size Selector
  sizeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  sizeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  sizeSub: {
    fontSize: 11,
    marginTop: 2,
  },

  // ConfigCard
  configCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  configIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  configTextBox: {
    flex: 1,
    marginRight: 8,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  configDesc: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Preview
  previewWrapper: {
    marginTop: 28,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },

  previewPhone: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewPhoneHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  previewBizName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  previewBizSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  previewBody: {
    padding: 16,
  },
  previewField: {
    marginBottom: 12,
  },
  previewFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  previewFieldInput: {
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  previewCTA: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  previewCTAText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    gap: 10,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  previewBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
