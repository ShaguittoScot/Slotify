import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { FluidToggleSwitch } from '@/components/ui/FluidToggleSwitch';
import { useAuthStore } from '@/features/auth/model';
import { TemplateMigrationModal } from '@/features/dashboard/ui/components/TemplateMigrationModal';
import { ThemeSettingsModal, useAppTheme } from '@/shared/theme';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOwnBusinessLogoUrl } from '../../api';
import { requestAppointmentNotificationPermission } from '../../model/appointmentNotifications';
import {
  LocalNotificationsUnavailable,
  loadLocalNotificationDevice,
} from '../../model/localNotifications';
import {
  appointmentHaptic,
  settingsScope,
  useSettingsPreferences,
} from '../../model/preferences';
import { BusinessInfoModal } from '../components/BusinessInfoModal';
import { EditProfileModal } from '../components/EditProfileModal';

export function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, themeMode, visualTheme } = useAppTheme();
  const { user, logout, appMode, setAppMode, toggleAppMode } = useAuthStore();

  const isBusiness = appMode === 'BUSINESS';

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBusinessInfoModal, setShowBusinessInfoModal] = useState(false);
  const [requestingNotifications, setRequestingNotifications] = useState(false);
  const [businessLogoUrl, setBusinessLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isBusiness || !user?.businessId) {
        setBusinessLogoUrl(null);
        return;
      }
      let active = true;
      const controller = new AbortController();
      fetchOwnBusinessLogoUrl(controller.signal).then(
        (logo) => {
          if (active) {
            setBusinessLogoUrl(logo);
            setLogoError(false);
          }
        },
        () => { }
      );
      return () => {
        active = false;
        controller.abort();
      };
    }, [isBusiness, user?.businessId])
  );

  const preferences = useSettingsPreferences();
  const scope = settingsScope(user);
  const preferencesReady = preferences.ready && preferences.scope === scope;
  const isBusinessUser = Boolean(user?.businessId && !user.businessId.startsWith('demo'));
  const isClientUser = Boolean(user?.id && (user?.role === 'CLIENTE' || !isBusiness));
  const canNotify =
    Platform.OS !== 'web' &&
    Boolean(user?.id && (isBusinessUser || isClientUser));

  const changeMode = () => {
    if (isBusiness) {
      setAppMode('CONSUMER');
      router.navigate('/(main)/explore');
    } else if (user?.businessId) {
      setAppMode('BUSINESS');
      router.navigate('/(main)');
    } else {
      toggleAppMode();
    }
  };

  const changeNotifications = async (enabled: boolean) => {
    if (!scope || !canNotify || !preferencesReady || requestingNotifications)
      return;
    if (!enabled) {
      await preferences.update(scope, { notifications: false });
      return;
    }
    setRequestingNotifications(true);
    try {
      if (await requestAppointmentNotificationPermission()) {
        await preferences.update(scope, { notifications: true });
      } else {
        Alert.alert(
          'Permiso de notificaciones',
          'Permite las notificaciones en los ajustes del teléfono para activar los avisos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir ajustes',
              onPress: () => {
                void Linking.openSettings().catch(() => { });
              },
            },
          ]
        );
      }
    } catch (failure) {
      if (__DEV__)
        console.debug(
          '[Slotify] Error al activar notificaciones locales',
          failure
        );
      Alert.alert(
        'Notificaciones no disponibles',
        failure instanceof LocalNotificationsUnavailable
          ? 'Esta instalación no pudo cargar las notificaciones locales. Si estás en Expo Go, actualízalo y vuelve a abrir Slotify.'
          : 'No se pudo configurar el canal de notificaciones o solicitar el permiso. Vuelve a abrir Slotify e inténtalo de nuevo.'
      );
    } finally {
      setRequestingNotifications(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const device = loadLocalNotificationDevice();
      await device.scheduleNotificationAsync({
        content: {
          title: '🔔 Slotify: Prueba exitosa',
          body: '¡El motor de notificaciones push está activo y funcionando en tu dispositivo!',
          data: { test: true },
        },
        trigger: null,
      });
      appointmentHaptic(true);
    } catch (err: any) {
      Alert.alert('Aviso', 'Asegúrate de permitir las notificaciones en el sistema.');
    }
  };

  const changeHaptics = (enabled: boolean) => {
    if (!scope || !preferencesReady) return;
    void preferences.update(scope, { haptics: enabled });
    if (enabled) appointmentHaptic();
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas cerrar tu sesión actual en Slotify?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getThemeModeLabel = () => {
  };

  const getVisualThemeLabel = () => {
  };

  const displayName = isBusiness
    ? user?.fullName && user.fullName !== 'Pendiente'
      ? user.fullName
      : user?.businessName || 'Administrador'
    : user?.fullName && user.fullName !== 'Pendiente'
      ? user.fullName
      : 'Cliente Slotify';

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const accentColor = isBusiness ? '#818CF8' : '#10B981';

  const renderSettingRow = (
    icon: any,
    title: string,
    subtitle: string,
    onPress: () => void,
    iconTint = accentColor
  ) => (
    <AnimatedPressable
      style={[
        styles.settingItem,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.main,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.settingIconWrapper,
          {
            backgroundColor: isDark
              ? colors.background.tertiary
              : colors.background.primary,
          },
        ]}
      >
        <Feather name={icon} size={16} color={iconTint} />
      </View>
      <View style={styles.settingTextContent}>
        <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
          {title}
        </Text>
        <Text
          style={[styles.settingValue, { color: colors.text.muted }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.text.muted} />
    </AnimatedPressable>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        {/* Cabecera Minimalista */}
        <Animated.View
          entering={FadeInDown.duration(380).springify()}
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? '#1E1E24' : colors.border.main,
            },
          ]}
        >
          <View>
            <View style={styles.tagRow}>
              <View
                style={[styles.tagDot, { backgroundColor: accentColor }]}
              />
              <Text style={[styles.tagLabel, { color: colors.text.muted }]}>
                {isBusiness ? 'CONFIGURACIÓN' : 'CUENTA PERSONAL'}
              </Text>
            </View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              {isBusiness ? 'Ajustes' : 'Mi Perfil'}
            </Text>
          </View>

          <AnimatedPressable
            accessibilityRole="button"
            style={[
              styles.modeSwitchChip,
              {
                backgroundColor: isDark ? '#14141A' : '#F4F4F5',
                borderColor: `${accentColor}40`,
              },
            ]}
            onPress={changeMode}
          >
            <Feather name="repeat" size={13} color={accentColor} />
            <Text style={[styles.modeSwitchChipText, { color: accentColor }]}>
              {isBusiness ? 'Vista Cliente' : 'Vista Admin'}
            </Text>
          </AnimatedPressable>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta Ejecutiva de Perfil */}
          <Animated.View
            entering={FadeInDown.duration(420).delay(50).springify()}
          >
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
              onPress={() => setShowProfileModal(true)}
              style={[
                styles.profileCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: isDark ? '#1A1A22' : '#EEF2FF',
                    borderColor: `${accentColor}50`,
                  },
                ]}
              >
                {isBusiness && businessLogoUrl && !logoError ? (
                  <Image
                    source={{ uri: businessLogoUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Text style={[styles.avatarText, { color: accentColor }]}>
                    {getInitials(displayName)}
                  </Text>
                )}
              </View>

              <View style={styles.profileInfo}>
                <Text
                  style={[styles.profileName, { color: colors.text.primary }]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <Text
                  style={[styles.profileEmail, { color: colors.text.muted }]}
                  numberOfLines={1}
                >
                  {user?.email || 'Sin correo registrado'}
                </Text>
              </View>

              <View
                style={[
                  styles.editProfileBtn,
                  {
                    backgroundColor: isDark ? '#1A1A22' : '#F4F4F5',
                  },
                ]}
              >
                <Feather name="edit-2" size={14} color={colors.text.primary} />
              </View>
            </AnimatedPressable>
          </Animated.View>

          {/* ─── SECCIÓN PRINCIPAL SEGÚN ROL ─── */}
          <Animated.View
            entering={FadeInDown.duration(460).delay(110).springify()}
            style={styles.section}
          >
            <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
              {isBusiness ? 'OPERACIÓN Y MARCA' : 'ACCESOS RÁPIDOS'}
            </Text>

            {isBusiness ? (
              <>
                {renderSettingRow(
                  'layout',
                  'Formulario y Marca',
                  'Logotipo, colores y campos de reserva',
                  () => router.push('/(main)/form-builder' as any),
                  '#818CF8'
                )}
                {renderSettingRow(
                  'layers',
                  'Giro y Plantillas',
                  'Configuración de sector comercial',
                  () => setShowMigrationModal(true),
                  '#10B981'
                )}
                {renderSettingRow(
                  'scissors',
                  'Catálogo de Servicios',
                  'Precios, duraciones y estaciones',
                  () =>
                    router.push({
                      pathname: '/(onboarding)/templates' as any,
                      params: {
                        sectorId: '5',
                        sectorKey: 'barberia',
                        isMigration: 'true',
                      },
                    }),
                  '#A1A1AA'
                )}
                {renderSettingRow(
                  'globe',
                  'Información del Negocio',
                  'Horarios, contacto y enlace de reserva',
                  () => setShowBusinessInfoModal(true),
                  '#818CF8'
                )}
              </>
            ) : (
              <>
                {renderSettingRow(
                  'file-text',
                  'Formulario de Reserva',
                  'Llena tus datos y confirma una cita',
                  () => router.push('/(main)/form-preview' as any),
                  '#10B981'
                )}
                {renderSettingRow(
                  'compass',
                  'Explorar Establecimientos',
                  'Directorio de negocios disponibles',
                  () => router.push('/(main)/explore' as any),
                  '#818CF8'
                )}
                {renderSettingRow(
                  'calendar',
                  'Mis Citas Programadas',
                  'Consulta horarios y reservaciones',
                  () => router.push('/(main)' as any),
                  '#10B981'
                )}
              </>
            )}
          </Animated.View>

          {/* ─── APARIENCIA ─── */}
          <Animated.View
            entering={FadeInDown.duration(480).delay(140).springify()}
            style={styles.section}
          >
            <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
              APARIENCIA
            </Text>

            {renderSettingRow(
              'layers',
              'Apariencia',
              `${getVisualThemeLabel()} • ${getThemeModeLabel()}`,
              () => setShowThemeModal(true),
              visualTheme === 'obsidian' ? '#818CF8' : colors.text.primary
            )}
          </Animated.View>

          {/* ─── PREFERENCIAS Y SISTEMA ─── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(170).springify()}
            style={styles.section}
          >
            <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
              SISTEMA
            </Text>

            <View
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <View
                style={[
                  styles.settingIconWrapper,
                  {
                    backgroundColor: isDark
                      ? colors.background.tertiary
                      : colors.background.primary,
                  },
                ]}
              >
                <Feather name="bell" size={16} color={colors.text.primary} />
              </View>
              <View style={styles.settingTextContent}>
                <Text
                  style={[styles.settingLabel, { color: colors.text.primary }]}
                >
                  Notificaciones de Citas
                </Text>
                <Text
                  style={[styles.settingValue, { color: colors.text.muted }]}
                >
                  {canNotify
                    ? 'Recordatorios de citas, nuevas reservas y cancelaciones'
                    : 'Disponible en la app móvil'}
                </Text>
              </View>
              <FluidToggleSwitch
                accessibilityLabel="Notificaciones de Citas"
                value={canNotify && preferencesReady && preferences.notifications}
                onValueChange={changeNotifications}
                disabled={
                  !canNotify || !preferencesReady || requestingNotifications
                }
                inactiveColor={isDark ? '#414147' : '#D4D4D8'}
                activeColor={accentColor}
              />
            </View>

            {canNotify && preferencesReady && preferences.notifications && (
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Probar notificación inmediata"
                onPress={handleTestNotification}
                style={[
                  styles.settingItem,
                  {
                    backgroundColor: isDark ? '#14141C' : '#F0FDF4',
                    borderColor: isDark ? '#1E293B' : '#BBF7D0',
                    borderStyle: 'dashed',
                  },
                ]}
              >
                <View
                  style={[
                    styles.settingIconWrapper,
                    { backgroundColor: isDark ? '#1E293B' : '#DCFCE7' },
                  ]}
                >
                  <Feather name="send" size={15} color="#10B981" />
                </View>
                <View style={styles.settingTextContent}>
                  <Text
                    style={[styles.settingLabel, { color: isDark ? '#34D399' : '#059669', fontSize: 13.5 }]}
                  >
                    Probar Notificación Inmediata
                  </Text>
                  <Text
                    style={[styles.settingValue, { color: colors.text.muted, fontSize: 11.5 }]}
                  >
                    Toca para recibir una alerta push en este dispositivo
                  </Text>
                </View>
                <Feather name="arrow-right" size={15} color="#10B981" />
              </AnimatedPressable>
            )}

            <View
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark ? '#121216' : '#FFFFFF',
                  borderColor: isDark ? '#22222A' : '#E4E4E7',
                },
              ]}
            >
              <View
                style={[
                  styles.settingIconWrapper,
                  { backgroundColor: isDark ? '#1A1A22' : '#F4F4F5' },
                ]}
              >
                <Feather name="zap" size={16} color={colors.text.primary} />
              </View>
              <View style={styles.settingTextContent}>
                <Text
                  style={[styles.settingLabel, { color: colors.text.primary }]}
                >
                  Respuesta Háptica
                </Text>
                <Text
                  style={[styles.settingValue, { color: colors.text.muted }]}
                >
                  {Platform.OS === 'web'
                    ? 'Disponible en la app móvil'
                    : 'Vibración táctil en Agenda y Clientes'}
                </Text>
              </View>
              <FluidToggleSwitch
                accessibilityLabel="Respuesta Háptica"
                value={
                  Platform.OS !== 'web' &&
                  preferencesReady &&
                  preferences.haptics
                }
                onValueChange={changeHaptics}
                disabled={Platform.OS === 'web' || !preferencesReady}
                inactiveColor={isDark ? '#414147' : '#D4D4D8'}
                activeColor="#10B981"
              />
            </View>
          </Animated.View>

          {/* ─── CERRAR SESIÓN ─── */}
          <Animated.View
            entering={FadeInDown.duration(520).delay(220).springify()}
            style={styles.logoutSection}
          >
            <AnimatedPressable
              style={[
                styles.logoutButton,
                {
                  backgroundColor: isDark ? '#181114' : '#FEF2F2',
                  borderColor: isDark
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'rgba(239, 68, 68, 0.2)',
                },
              ]}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={16} color="#EF4444" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </AnimatedPressable>
          </Animated.View>
        </ScrollView>

        <ThemeSettingsModal
          visible={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />

        {isBusiness && (
          <>
            <TemplateMigrationModal
              visible={showMigrationModal}
              onClose={() => setShowMigrationModal(false)}
            />
            <BusinessInfoModal
              visible={showBusinessInfoModal}
              onClose={() => setShowBusinessInfoModal(false)}
              onOpenMigration={() => setShowMigrationModal(true)}
            />
          </>
        )}

        <EditProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  modeSwitchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeSwitchChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 18,
    marginBottom: 22,
    borderWidth: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 12.5,
  },
  editProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextContent: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  settingValue: {
    fontSize: 12,
  },
  logoutSection: {
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
