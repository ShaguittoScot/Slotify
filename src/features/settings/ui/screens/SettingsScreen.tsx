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

  const isBusiness = appMode === 'BUSINESS';

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

  const displayName = isBusiness
    ? user?.fullName && user.fullName !== 'Pendiente'
      ? user.fullName
      : user?.businessName || 'Administrador Slotify'
    : user?.fullName && user.fullName !== 'Pendiente'
    ? user.fullName
    : 'Cliente Slotify';

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
        {/* Cabecera Adaptable al Rol */}
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
              {isBusiness ? 'Ajustes de Negocio' : 'Mi Perfil'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.muted }]}>
              {isBusiness
                ? 'Administración operativa y servicios de tu establecimiento'
                : 'Tus preferencias, datos personales y reservas'}
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
            <Feather
              name={isBusiness ? 'settings' : 'user'}
              size={20}
              color={colors.text.primary}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta de Perfil */}
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
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: isBusiness ? '#6366F1' : '#10B981' },
              ]}
            >
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.text.primary }]} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>

              <Text style={[styles.profileEmail, { color: colors.text.muted }]} numberOfLines={1}>
                {user?.email || (isBusiness ? 'admin@slotify.com' : 'cliente@slotify.com')}
              </Text>

              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: isBusiness
                        ? 'rgba(99, 102, 241, 0.16)'
                        : 'rgba(16, 185, 129, 0.16)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      {
                        color: isBusiness ? '#818CF8' : '#34D399',
                      },
                    ]}
                  >
                    {isBusiness ? 'ADMINISTRADOR / PROPIETARIO' : 'CLIENTE'}
                  </Text>
                </View>

                {isBusiness && user?.businessName ? (
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

          {/* Tarjeta de Cambio de Modo (Mantenida prominentemente para pruebas de desarrollo) */}
          <TouchableOpacity
            style={[
              styles.modeSwitcherCard,
              {
                backgroundColor: isBusiness
                  ? isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)'
                  : isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                borderColor: isBusiness
                  ? isDark ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.20)'
                  : isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.20)',
              },
            ]}
            onPress={toggleAppMode}
            activeOpacity={0.8}
          >
            <View style={styles.modeSwitcherLeft}>
              <View
                style={[
                  styles.modeIconCircle,
                  {
                    backgroundColor: isBusiness ? colors.action.primary : '#10B981',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    isBusiness
                      ? 'storefront-outline'
                      : 'account-outline'
                  }
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.modePillRow}>
                  <Text style={[styles.modeSwitcherTitle, { color: colors.text.primary }]}>
                    {isBusiness ? 'Modo Administrador Activo' : 'Modo Cliente Activo'}
                  </Text>
                  <View style={[styles.testBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[styles.testBadgeText, { color: colors.text.muted }]}>PRUEBA</Text>
                  </View>
                </View>
                <Text style={[styles.modeSwitcherSubtitle, { color: colors.text.secondary }]}>
                  {isBusiness
                    ? 'Toca para saltar a la interfaz de Cliente (Explorar y Reservar)'
                    : 'Toca para saltar a la interfaz de Administrador (Gestionar Negocio)'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.modeSwitchAction,
                { backgroundColor: isBusiness ? colors.action.primary : '#10B981' },
              ]}
            >
              <Text style={[styles.modeSwitchActionText, { color: '#FFFFFF' }]}>
                {isBusiness ? 'Saltar a Cliente' : 'Saltar a Admin'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ════════════════════════════════════════════════════════════════
              SECCIÓN ESPECÍFICA: ADMINISTRADOR vs CLIENTE
          ════════════════════════════════════════════════════════════════ */}
          {isBusiness ? (
            /* SECCIÓN ADMIN: GESTIÓN DE NEGOCIO */
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
                GESTIÓN DE NEGOCIO & SERVICIOS
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

              {/* Constructor de Formulario de Reservas & Identidad de Marca */}
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
                    name="palette-swatch-outline"
                    size={18}
                    color="#10B981"
                  />
                </View>
                <View style={styles.settingTextContent}>
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                    Formulario & Marca Corporativa
                  </Text>
                  <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                    Personalizar logotipo, colores y campos de reservación
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

              {/* Directorio de Clientes */}
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
                onPress={() => router.push('/(main)/clients' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.14)' }]}>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={18}
                    color="#3B82F6"
                  />
                </View>
                <View style={styles.settingTextContent}>
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                    Directorio de Clientes
                  </Text>
                  <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                    Consulta la cartera de clientes, historial y notas
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          ) : (
            /* SECCIÓN CLIENTE: ACTIVIDAD & RESERVAS */
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: colors.text.muted }]}>
                MI ACTIVIDAD & RESERVAS
              </Text>

              {/* Mis Citas Agendadas */}
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
                onPress={() => router.push('/(main)' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                  <Feather name="calendar" size={18} color="#10B981" />
                </View>
                <View style={styles.settingTextContent}>
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                    Mis Citas Programadas
                  </Text>
                  <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                    Revisa horarios, direcciones y estado de tus citas
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.text.muted} />
              </TouchableOpacity>

              {/* Explorar Establecimientos */}
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
                onPress={() => router.push('/(main)/explore' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.14)' }]}>
                  <Feather name="compass" size={18} color="#818CF8" />
                </View>
                <View style={styles.settingTextContent}>
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                    Explorar Servicios y Establecimientos
                  </Text>
                  <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                    Descubre barberías, spas, consultorios y reserva citas
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.text.muted} />
              </TouchableOpacity>

              {/* Mis Datos de Contacto */}
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
                onPress={() => setShowProfileModal(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                  <Feather name="user-check" size={18} color="#F59E0B" />
                </View>
                <View style={styles.settingTextContent}>
                  <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                    Mis Datos Personales
                  </Text>
                  <Text style={[styles.settingValue, { color: colors.text.muted }]}>
                    Nombre y datos usados al agendar tus citas
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Sección: APARIENCIA & SISTEMA (Compartida) */}
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
                  {isBusiness
                    ? 'Recordatorios de agenda, nuevas reservas y cancelaciones'
                    : 'Recordatorios de tus citas y confirmaciones de horario'}
                </Text>
              </View>
              <FluidToggleSwitch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                activeColor={isBusiness ? '#818CF8' : '#10B981'}
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

          {/* Sección: SOPORTE & SEGURIDAD (Compartida) */}
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
                  isBusiness
                    ? 'Para dudas o soporte técnico escribe a soporte@slotify.app o contacta a tu asesor de implementación.'
                    : 'Para dudas sobre reservas escribe a soporte@slotify.app.'
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

          {/* Botón Destructivo: Cerrar Sesión con margen holgado */}
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
              {isBusiness
                ? 'Slotify v1.0.0 (Build 402) • Business Owner Edition'
                : 'Slotify v1.0.0 (Build 402) • Consumer Client Edition'}
            </Text>
          </View>
        </ScrollView>

        {/* Modales de Configuración */}
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
    maxWidth: 270,
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
    paddingBottom: 160,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
  modePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  modeSwitcherTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  testBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  testBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
