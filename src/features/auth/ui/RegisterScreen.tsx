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
import { useAuthStore } from '../model';
import { useAppTheme, ThemeSettingsModal } from '@/shared/theme';
import { useSectorTemplateStore } from '@/features/sector-templates';

export const RegisterScreen = () => {
  const { selectedCategory, onboardingResult } = useSectorTemplateStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState(onboardingResult?.businessName || '');
  const [businessPhone, setBusinessPhone] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);

  const { colors, isDark, themeMode } = useAppTheme();
  const register = useAuthStore((state) => state.register);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const router = useRouter();

  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    businessName.trim().length > 0 &&
    businessPhone.trim().length > 0;

  const handleRegister = async () => {
    if (!isFormValid) return;
    try {
      clearError();
      await register({
        fullName,
        email,
        password,
        businessName,
        businessPhone,
        sectorTemplateId: selectedCategory?.id ?? 1,
      });
    } catch {
      // Error is handled in store
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
                styles.themeToggleBtn,
                { backgroundColor: colors.background.secondary, borderColor: colors.border.main },
              ]}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowThemeModal(true)}
              style={[
                styles.themeToggleBtn,
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

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Crear Negocio</Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Ingresa tus datos para comenzar tu agenda.
            </Text>
          </View>

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

            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>TUS DATOS</Text>

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
                placeholder="Juan Pérez"
                placeholderTextColor={colors.text.muted}
                value={fullName}
                onChangeText={setFullName}
                editable={!isLoading}
              />
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Contraseña</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    borderColor: colors.border.main,
                  },
                ]}
                placeholder="•••••••• (mínimo 6 caracteres)"
                placeholderTextColor={colors.text.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: 14 }]}>
              NEGOCIO
            </Text>

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
              <Text style={[styles.label, { color: colors.text.primary }]}>Nombre del negocio</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    borderColor: colors.border.main,
                  },
                ]}
                placeholder="Ej. Barbería Central"
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

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Teléfono del negocio</Text>
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
                value={businessPhone}
                onChangeText={setBusinessPhone}
                editable={!isLoading}
              />
            </View>

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
                  Continuar ➔
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.border.main }]} />
              <Text style={[styles.dividerText, { color: colors.text.muted }]}>o</Text>
              <View style={[styles.divider, { backgroundColor: colors.border.main }]} />
            </View>

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
              <AntDesign name="google" size={20} color={colors.text.primary} />
              <Text style={[styles.googleButtonText, { color: colors.action.secondaryText }]}>
                Regístrate con Google
              </Text>
            </TouchableOpacity>

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
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  roleBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 10,
  },
  roleBadgeTopText: {
    fontSize: 12,
    fontWeight: '700',
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
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
  button: {
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
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
});
