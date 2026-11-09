import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/model';
import { useAppTheme } from '@/shared/theme';

interface AdminOnlyGuardProps {
  children: React.ReactNode;
  featureName?: string;
  description?: string;
}

export const AdminOnlyGuard: React.FC<AdminOnlyGuardProps> = ({
  children,
  featureName = 'esta herramienta de administración',
  description = 'Esta sección está reservada exclusivamente para dueños y administradores del establecimiento comercial.',
}) => {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { appMode, toggleAppMode } = useAuthStore();

  if (appMode === 'BUSINESS') {
    return <>{children}</>;
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.container}>
        {/* Cabecera mínima con botón de retroceso */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: colors.border.main,
              },
            ]}
            onPress={() => router.replace('/(main)' as any)}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color={colors.text.primary} />
            <Text style={[styles.backButtonText, { color: colors.text.primary }]}>
              Volver a Citas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Restricción de Rol */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(26,26,26,0.9)' : 'rgba(255,255,255,0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <View style={styles.badgeWrapper}>
            <View style={styles.modeBadge}>
              <MaterialCommunityIcons name="account-outline" size={14} color="#10B981" />
              <Text style={styles.modeBadgeText}>MODO CLIENTE ACTIVO</Text>
            </View>
          </View>

          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-lock-outline" size={36} color="#818CF8" />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            Acceso de Administrador Requerido
          </Text>

          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Estás navegando en la vista de cliente. Para acceder a {featureName}, necesitas
            cambiar al perfil de Administrador / Dueño.
          </Text>

          <Text style={[styles.helper, { color: colors.text.muted }]}>
            {description}
          </Text>

          {/* Botón Principal para cambiar de interfaz durante las pruebas */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.action.primary }]}
            onPress={toggleAppMode}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={18}
              color={colors.action.primaryText}
            />
            <Text style={[styles.actionBtnText, { color: colors.action.primaryText }]}>
              Cambiar a Modo Administrador
            </Text>
          </TouchableOpacity>

          {/* Botón Secundario para regresar al flujo de cliente */}
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              },
            ]}
            onPress={() => router.replace('/(main)' as any)}
            activeOpacity={0.7}
          >
            <Feather name="calendar" size={16} color={colors.text.primary} />
            <Text style={[styles.secondaryBtnText, { color: colors.text.primary }]}>
              Ir a Mis Citas Programadas
            </Text>
          </TouchableOpacity>

          <View style={styles.testNoteBox}>
            <Feather name="info" size={12} color={colors.text.muted} />
            <Text style={[styles.testNoteText, { color: colors.text.muted }]}>
              Entorno de Pruebas: Puedes saltar entre interfaces cuantas veces necesites.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  topBar: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeWrapper: {
    marginBottom: 16,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  modeBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  actionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  testNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  testNoteText: {
    fontSize: 11,
    textAlign: 'center',
    flex: 1,
  },
});

