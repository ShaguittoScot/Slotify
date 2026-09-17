import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useAuthStore } from '../model';
import { useAppTheme, ThemeSettingsModal } from '@/shared/theme';
import { useSectorTemplateStore } from '@/features/sector-templates';

type SelectedRole = 'CLIENTE' | 'NEGOCIO';

export const RegisterScreen = () => {
  const router = useRouter();
  const { colors, isDark, themeMode } = useAppTheme();
  const { selectedCategory, onboardingResult } = useSectorTemplateStore();

  const register = useAuthStore((state) => state.register);
  const registerClient = useAuthStore((state) => state.registerClient);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const setAppMode = useAuthStore((state) => state.setAppMode);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  // Form State
  const [role, setRole] = useState<SelectedRole>('CLIENTE');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState(onboardingResult?.businessName || '');
  const [showThemeModal, setShowThemeModal] = useState(false);

  const isBusiness = role === 'NEGOCIO';

  const isClientValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6;

  const isBusinessValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    businessName.trim().length > 0 &&
    phone.trim().length > 0;

  const isFormValid = isBusiness ? isBusinessValid : isClientValid;

  const handleRoleChange = (newRole: SelectedRole) => {
    clearError();
    setRole(newRole);
    setAppMode(newRole === 'NEGOCIO' ? 'BUSINESS' : 'CONSUMER');
  };

  const handleRegister = async () => {
    if (!isFormValid) return;
    try {
      clearError();
      if (isBusiness) {
        await register({
          fullName,
          email,
          password,
          businessName,
          businessPhone: phone,
          sectorTemplateId: selectedCategory?.id ?? 1,
        });
      } else {
        await registerClient({
          fullName,
          email,
          password,
          phone: phone.trim() || undefined,
        });
      }
    } catch {
      // Handled in store
    }
  };

  const getThemeIcon = () => {
    if (themeMode === 'system') return 'smartphone';
    return isDark ? 'moon' : 'sun';
  };

  const generatedSlug =
    businessName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'tu-negocio';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar con botón de regreso y selector de tema */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.topBtn,
                { backgroundColor: colors.background.secondary, borderColor: colors.border.main },
              ]}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowThemeModal(true)}
              style={[
                styles.topBtn,
                { backgroundColor: colors.background.secondary, borderColor: colors.border.main },
              ]}
              activeOpacity={0.7}
            >
              <Feather
                name={getThemeIcon()}
                size={18}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Header Minimalista */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {isBusiness ? 'Crear Negocio' : 'Crear Cuenta'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              {isBusiness
                ? 'Gestiona tu agenda, clientes y reservas online.'
                : 'Agenda tus citas y descubre servicios al instante.'}
            </Text>
          </View>

          {/* ─── SELECTOR DUAL COMPACTO (SEGMENTED CONTROL) ─── */}
          <View
            style={[
              styles.segmentedContainer,
              {
                backgroundColor: colors.background.tertiary,
                borderColor: colors.border.main,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.segmentItem,
                !isBusiness && [
                  styles.segmentItemActive,
                  {
                    backgroundColor: isDark ? '#383838' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  },
                ],
              ]}
              onPress={() => handleRoleChange('CLIENTE')}
              activeOpacity={0.8}
            >
              <Feather
                name="user"
                size={15}
                color={!isBusiness ? colors.text.primary : colors.text.muted}
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: !isBusiness ? colors.text.primary : colors.text.muted,
                    fontWeight: !isBusiness ? '700' : '500',
                  },
                ]}
              >
                Soy Cliente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentItem,
                isBusiness && [
                  styles.segmentItemActive,
                  {
                    backgroundColor: isDark ? '#383838' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  },
                ],
              ]}
              onPress={() => handleRoleChange('NEGOCIO')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="storefront-outline"
                size={16}
                color={isBusiness ? colors.text.primary : colors.text.muted}
              />
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: isBusiness ? colors.text.primary : colors.text.muted,
                    fontWeight: isBusiness ? '700' : '500',
                  },
                ]}
              >
                Dueño de Negocio
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── FORMULARIO DINÁMICO ─── */}
          <View
            style={[
              styles.formContainer,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.light,
              },
            ]}
          >
            {error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.status.errorBg,
                    borderColor: colors.status.error,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>
              </View>
            ) : null}

            {/* Nombre Completo */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Nombre completo</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    borderColor: colors.border.main,
                  },
                ]}
                placeholder={isBusiness ? 'Ej. Juan Pérez (Administrador)' : 'Ej. Juan Pérez'}
                placeholderTextColor={colors.text.muted}
                value={fullName}
                onChangeText={setFullName}
                editable={!isLoading}
              />
            </View>

            {/* Correo Electrónico */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Correo electrónico</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    borderColor: colors.border.main,
                  },
                ]}
                placeholder="tu@correo.com"
                placeholderTextColor={colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                {isBusiness ? 'Teléfono del negocio' : 'Teléfono / WhatsApp'}
                {!isBusiness && <Text style={{ color: colors.text.muted, fontWeight: '400' }}> (opcional)</Text>}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    borderColor: colors.border.main,
                  },
                ]}
                placeholder="555-123-4567"
                placeholderTextColor={colors.text.muted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!isLoading}
              />
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Contraseña</Text>
              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <TextInput
                  style={[styles.passwordInput, { color: colors.text.primary }]}
                  placeholder="•••••••• (mínimo 6 caracteres)"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* ─── CAMPOS EXCLUSIVOS DE NEGOCIO (EXPANSIÓN FLUIDA) ─── */}
            {isBusiness && (
              <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOut.duration(200)}>
                <View style={[styles.sectionDivider, { borderColor: colors.border.main }]}>
                  <Text style={[styles.sectionDividerText, { color: colors.text.secondary }]}>
                    DATOS DE TU NEGOCIO
                  </Text>
                </View>

                {selectedCategory ? (
                  <TouchableOpacity
                    onPress={() => router.push('/(onboarding)/sector-selection' as any)}
                    style={[
                      styles.sectorBadge,
                      {
                        backgroundColor: colors.background.tertiary,
                        borderColor: colors.border.main,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectorBadgeLeft}>
                      <MaterialCommunityIcons
                        name="shape-outline"
                        size={16}
                        color={colors.action.primary}
                      />
                      <Text style={[styles.sectorBadgeText, { color: colors.text.primary }]}>
                        Giro: <Text style={{ fontWeight: '700' }}>{selectedCategory.name}</Text>
                      </Text>
                    </View>
                    <Text style={[styles.sectorBadgeChange, { color: colors.action.primary }]}>
                      Cambiar
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text.primary }]}>
                    Nombre comercial del negocio
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background.tertiary,
                        color: colors.text.primary,
                        borderColor: colors.border.main,
                      },
                    ]}
                    placeholder="Ej. Barbería Central o Clínica Dental"
                    placeholderTextColor={colors.text.muted}
                    value={businessName}
                    onChangeText={setBusinessName}
                    editable={!isLoading}
                  />
                  <View
                    style={[
                      styles.slugPreviewBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(99, 102, 241, 0.08)'
                          : 'rgba(99, 102, 241, 0.05)',
                        borderColor: isDark
                          ? 'rgba(99, 102, 241, 0.20)'
                          : 'rgba(99, 102, 241, 0.15)',
                      },
                    ]}
                  >
                    <Feather name="globe" size={13} color={colors.action.primary} />
                    <Text style={[styles.slugPreviewText, { color: colors.text.secondary }]}>
                      Enlace público:{' '}
                      <Text style={{ fontWeight: '700', color: colors.action.primary }}>
                        slotly.app/{generatedSlug}
                      </Text>
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Botón Principal de Envío */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.action.primary },
                (!isFormValid || isLoading) && { backgroundColor: colors.action.disabled },
              ]}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.action.primaryText} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.action.primaryText }]}>
                  {isBusiness ? 'Continuar a Configuración ➔' : 'Crear Cuenta de Cliente'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.border.main }]} />
              <Text style={[styles.dividerText, { color: colors.text.muted }]}>o</Text>
              <View style={[styles.divider, { backgroundColor: colors.border.main }]} />
            </View>

            {/* Google Signup */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                {
                  backgroundColor: colors.action.secondary,
                  borderColor: colors.action.secondaryBorder,
                },
              ]}
              onPress={loginWithGoogle}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <AntDesign name="google" size={18} color={colors.text.primary} />
              <Text style={[styles.googleButtonText, { color: colors.action.secondaryText }]}>
                Continuar con Google
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                ¿Ya tienes cuenta?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={[styles.footerLink, { color: colors.text.primary }]}>
                  Inicia Sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ThemeSettingsModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Segmented Control
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 100,
    padding: 4,
    borderWidth: 1,
    marginBottom: 20,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 100,
    gap: 6,
  },
  segmentItemActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
  },

  formContainer: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 32,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionDivider: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  slugPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  slugPreviewText: {
    fontSize: 12,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  sectorBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectorBadgeText: {
    fontSize: 13,
  },
  sectorBadgeChange: {
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 14,
    gap: 8,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
  },
});
