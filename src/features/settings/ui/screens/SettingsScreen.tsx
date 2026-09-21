import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/model';
import { useAppTheme, ThemeSettingsModal } from '@/shared/theme';

export function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, themeMode } = useAppTheme();
  const { user, logout, appMode, toggleAppMode } = useAuthStore();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
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

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
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
        {/* Cabecera Glassmorphism */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark
                ? 'rgba(26, 26, 26, 0.90)'
                : 'rgba(255, 255, 255, 0.94)',
              borderBottomColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Ajustes
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.muted }]}>
            Configuración general de tu cuenta y negocio
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta de Perfil de Usuario */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: isDark
                  ? 'rgba(26, 26, 26, 0.85)'
                  : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text.primary }]}>
                {user?.fullName || (appMode === 'BUSINESS' ? 'Administrador' : 'Cliente Slotify')}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.text.muted }]}>
                {user?.email || 'usuario@slotify.com'}
              </Text>

              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {appMode === 'BUSINESS' ? 'PROPIETARIO / ADMIN' : 'CLIENTE / CONSUMIDOR'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tarjeta de Cambio Rápido de Modo (Seamless Switch B2B / B2C) */}
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

          {/* Sección: Preferencias de Apariencia */}
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
                  Recordatorios de agenda y avisos
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#3A3A3A', true: '#818CF8' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Sección: Negocio y Servicios */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
              GESTIÓN DE NEGOCIO
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
              onPress={() => router.push('/(onboarding)/sector-selection' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconWrapper}>
                <MaterialCommunityIcons
                  name="shape-outline"
                  size={18}
                  color={colors.text.primary}
                />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Giro Comercial y Plantillas (US-006)
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Explorar sectores y módulos preconfigurados
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
                <MaterialCommunityIcons
                  name="store-outline"
                  size={18}
                  color={colors.text.primary}
                />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                  Información del Negocio
                </Text>
                <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                  Horarios de atención y servicios
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </View>
          </View>

          {/* Botón Destructivo: Cerrar Sesión */}
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
              Slotify v1.0.0 • Gridflow Architecture
            </Text>
          </View>
        </ScrollView>

        {/* Modal de Configuración de Apariencia */}
        <ThemeSettingsModal
          visible={showThemeModal}
          onClose={() => setShowThemeModal(false)}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110, // Margen holgado para la barra flotante inferior
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
    backgroundColor: '#818CF8',
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
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 1,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 0.5,
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
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 12,
    marginTop: 1,
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
