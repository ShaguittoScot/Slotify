import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../model';
import { useAppTheme, ThemeSettingsModal } from '@/shared/theme';

export const RoleSelectionScreen = () => {
  const router = useRouter();
  const { colors, isDark, themeMode } = useAppTheme();
  const { setAppMode } = useAuthStore();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleSelectBusiness = () => {
    setAppMode('BUSINESS');
    router.push('/(auth)/register');
  };

  const handleSelectConsumer = () => {
    setAppMode('CONSUMER');
    router.push('/(auth)/register-client' as any);
  };

  const getThemeIcon = () => {
    if (themeMode === 'system') return 'smartphone';
    return isDark ? 'moon' : 'sun';
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.container}>
        {/* Barra superior con botón de regreso y selector de tema */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.main,
              },
            ]}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <View style={[styles.miniLogo, { backgroundColor: colors.action.primary }]}>
              <Text style={[styles.miniLogoText, { color: colors.action.primaryText }]}>S</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text.primary }]}>Slotify</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowThemeModal(true)}
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.main,
              },
            ]}
            activeOpacity={0.7}
          >
            <Feather name={getThemeIcon()} size={16} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Hero */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.heroSection}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              ¿Cómo deseas ingresar?
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Selecciona tu perfil para continuar.
            </Text>
          </Animated.View>

          {/* Tarjetas de Selección Dual Ultralimpias */}
          <View style={styles.cardsContainer}>
            {/* Opción A: Soy Dueño de Negocio */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <TouchableOpacity
                style={[
                  styles.splitCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleSelectBusiness}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'rgba(99, 102, 241, 0.10)',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={24}
                    color={colors.action.primary}
                  />
                </View>

                <View style={styles.cardTextCol}>
                  <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                    Soy Dueño de Negocio
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.text.secondary }]}>
                    Gestiona tu agenda y citas
                  </Text>
                </View>

                <Feather name="chevron-right" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            </Animated.View>

            {/* Opción B: Soy Cliente */}
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <TouchableOpacity
                style={[
                  styles.splitCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleSelectConsumer}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(16, 185, 129, 0.10)',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="ticket-confirmation-outline"
                    size={24}
                    color="#10B981"
                  />
                </View>

                <View style={styles.cardTextCol}>
                  <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                    Soy Cliente
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.text.secondary }]}>
                    Agenda y busca servicios
                  </Text>
                </View>

                <Feather name="chevron-right" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Footer: Iniciar Sesión para cuentas existentes */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.footerSection}>
            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: colors.text.secondary }]}>
                ¿Ya tienes cuenta?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.loginLink, { color: colors.action.primary }]}>
                  Inicia sesión
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>

        <ThemeSettingsModal
          visible={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLogoText: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  splitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  footerSection: {
    alignItems: 'center',
    gap: 14,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
