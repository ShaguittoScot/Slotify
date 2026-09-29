import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/model';
import { useAppTheme, ThemeSettingsModal } from '@/shared/theme';
import { FluidToggleSwitch } from '@/components/ui/FluidToggleSwitch';
import { TemplateMigrationModal } from '@/features/dashboard/ui/components/TemplateMigrationModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { BusinessInfoModal } from '../components/BusinessInfoModal';

export function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, themeMode } = useAppTheme();
  const { user, logout, appMode, toggleAppMode } = useAuthStore();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBusinessInfoModal, setShowBusinessInfoModal] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta de Slotify?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getThemeModeLabel = () => {
    if (themeMode === 'system') return 'Automático (Dispositivo)';
    if (themeMode === 'light') return 'Modo Claro';
    return 'Modo Oscuro (Neutral Black)';
  };

  const displayName =
    user?.fullName && user.fullName !== 'Pendiente'
      ? user.fullName
      : user?.businessName || 'Ricardo Alcantar';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background.secondary }]}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Cabecera Estilizada */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark
                ? 'rgba(26, 26, 26, 0.92)'
                : 'rgba(255, 255, 255, 0.95)',
              borderBottomColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <View>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Ajustes
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.muted }]}>
              Configuración general de tu cuenta y negocio
            </Text>
          </View>
          <View
            style={[
              styles.headerBadgeIcon,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            ]}
          >
            <Feather name="settings" size={20} color={colors.text.primary} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta de Perfil y Negocio Activo */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: isDark
                  ? 'rgba(26, 26, 26, 0.85)'
                  : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.text.primary }]} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>

              <Text style={[styles.profileEmail, { color: colors.text.muted }]} numberOfLines={1}>
                {user?.email || 'richialcantar68428@gmail.com'}
              </Text>

              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        appMode === 'BUSINESS'
                          ? 'rgba(99, 102, 241, 0.16)'
                          : 'rgba(16, 185, 129, 0.16)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      {
                        color: appMode === 'BUSINESS' ? '#818CF8' : '#34D399',
                      },
                    ]}
                  >
                    {appMode === 'BUSINESS' ? 'PROPIETARIO / ADMIN' : 'CLIENTE / EXPLORADOR'}
                  </Text>
                </View>

                {user?.businessName ? (
                  <View style={styles.businessBadge}>
                    <Text style={[styles.businessBadgeText, { color: colors.text.muted }]} numberOfLines={1}>
                      {user.businessName}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.editProfileBtn,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                },
              ]}
              onPress={() => setShowProfileModal(true)}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={16} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Tarjeta de Cambio Rápido de Modo (B2B / B2C) */}
          <TouchableOpacity
            style={[
              styles.modeSwitcherCard,
              {
                backgroundColor: isDark
                  ? 'rgba(99, 102, 241, 0.12)'
                  : 'rgba(99, 102, 241, 0.08)',
                borderColor: isDark
                  ? 'rgba(99, 102, 241, 0.28)'
                  : 'rgba(99, 102, 241, 0.20)',
              },
            ]}
            onPress={toggleAppMode}
            activeOpacity={0.8}
          >
            <View style={styles.modeSwitcherLeft}>
              <View
                style={[
                  styles.modeIconCircle,
                  { backgroundColor: colors.action.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    appMode === 'BUSINESS'
                      ? 'storefront-outline'
                      : 'ticket-confirmation-outline'
                  }
                  size={20}
                  color={colors.action.primaryText}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeSwitcherTitle, { color: colors.text.primary }]}>
                  {appMode === 'BUSINESS' ? 'Modo Proveedor Activo' : 'Modo Cliente Activo'}
                </Text>
                <Text style={[styles.modeSwitcherSubtitle, { color: colors.text.secondary }]}>
                  {appMode === 'BUSINESS'
                    ? 'Toca para cambiar a explorar y agendar citas'
                    : 'Toca para cambiar a administrar tu negocio'}
                </Text>
              </View>
            </View>
            <View style={[styles.modeSwitchAction, { backgroundColor: colors.action.primary }]}>
              <Text style={[styles.modeSwitchActionText, { color: colors.action.primaryText }]}>
                Cambiar
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sección: GESTIÓN DE NEGOCIO */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
              GESTIÓN DE NEGOCIO
            </Text>

            {/* Giro Comercial y Plantillas */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              onPress={() => setShowMigrationModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <MaterialCommunityIcons
                  name="shape-outline"
                  size={18}
                  color="#818CF8"
                />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Giro Comercial y Módulos
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Cambiar sector comercial y capacidades del negocio
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </TouchableOpacity>

            {/* Catálogo y Plantilla de Barbería / Servicios */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/(onboarding)/templates' as any,
                  params: {
                    sectorId: '5',
                    sectorKey: 'barberia',
                    isMigration: 'true',
                  },
                })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(224, 122, 95, 0.15)' }]}>
                <MaterialCommunityIcons
                  name="content-cut"
                  size={18}
                  color="#E07A5F"
                />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Servicios y Catálogo Base
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Ajustar precios, duraciones, adicionales y sillones
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </TouchableOpacity>

            {/* Constructor de Formulario de Reservas */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              onPress={() => router.push('/(main)/form-builder' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                <MaterialCommunityIcons
                  name="form-select"
                  size={18}
                  color="#10B981"
                />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Formulario de Reservación
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Configurar campos dinámicos, comensales y preguntas
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </TouchableOpacity>

            {/* Información del Negocio y Enlace de Reserva */}
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              onPress={() => setShowBusinessInfoModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                <MaterialCommunityIcons
                  name="store-outline"
                  size={18}
                  color="#EC4899"
                />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Información del Negocio
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Horarios, sucursal y enlace de reserva compartible
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Sección: APARIENCIA & SISTEMA */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
              APARIENCIA & SISTEMA
            </Text>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              onPress={() => setShowThemeModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconWrapper}>
                <Feather
                  name={themeMode === 'system' ? 'smartphone' : isDark ? 'moon' : 'sun'}
                  size={18}
                  color={colors.text.primary}
                />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Tema Visual
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  {getThemeModeLabel()}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </TouchableOpacity>

            <View
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View style={styles.settingIconWrapper}>
                <Feather name="bell" size={18} color={colors.text.primary} />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Notificaciones de Citas
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Recordatorios de agenda, avisos y cancelaciones
                </Text>
              </View>
              <FluidToggleSwitch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                activeColor="#818CF8"
              />
            </View>

            <View
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View style={styles.settingIconWrapper}>
                <Feather name="activity" size={18} color={colors.text.primary} />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Respuesta Háptica
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Vibración táctil al interactuar y confirmar citas
                </Text>
              </View>
              <FluidToggleSwitch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                activeColor="#10B981"
              />
            </View>
          </View>

          {/* Sección: SOPORTE & CUENTA */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
              SOPORTE & SEGURIDAD
            </Text>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              onPress={() =>
                Alert.alert(
                  'Centro de Ayuda',
                  'Para dudas o soporte técnico escribe a soporte@slotify.app o contacta a tu asesor de implementación.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.settingIconWrapper}>
                <Feather name="help-circle" size={18} color={colors.text.primary} />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Centro de Ayuda
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Guías de uso, preguntas frecuentes y asistencia
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: isDark
                    ? 'rgba(26, 26, 26, 0.75)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              onPress={() =>
                Alert.alert(
                  'Términos y Privacidad',
                  'Slotify cumple con estándares de cifrado de grado bancario para la protección de tus datos comerciales y clientes.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.settingIconWrapper}>
                <Feather name="shield" size={18} color={colors.text.primary} />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Términos y Privacidad
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Políticas de servicio y seguridad de datos
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Botón Destructivo: Cerrar Sesión con margen holgado para la barra flotante */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(239, 68, 68, 0.08)',
                  borderColor: isDark
                    ? 'rgba(239, 68, 68, 0.30)'
                    : 'rgba(239, 68, 68, 0.20)',
                },
              ]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <Text style={[styles.appVersionText, { color: colors.text.muted }]}>
              Slotify v1.0.0 (Build 402) • Enterprise Suite
            </Text>
          </View>
        </ScrollView>

        {/* Modales de Configuración */}
        <ThemeSettingsModal
          visible={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />

        <TemplateMigrationModal
          visible={showMigrationModal}
          onClose={() => setShowMigrationModal(false)}
        />

        <EditProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />

        <BusinessInfoModal
          visible={showBusinessInfoModal}
          onClose={() => setShowBusinessInfoModal(false)}
          onOpenMigration={() => setShowMigrationModal(true)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 160, // Margen holgado para que la barra flotante NUNCA tape el botón
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  businessBadge: {
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  businessBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modeSwitcherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  modeSwitcherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitcherTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  modeSwitcherSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  modeSwitchAction: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  modeSwitchActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContent: {
    flex: 1,
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  logoutSection: {
    marginTop: 10,
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  appVersionText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
