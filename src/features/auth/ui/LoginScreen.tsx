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
import { AntDesign, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../model';
import { useAppTheme, ThemeSettingsModal } from '@/shared/theme';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormFieldError } from '@/components/ui/FormFieldError';
import type { NormalizedError } from '@/shared/lib/errorUtils';

type FormStatus = 'idle' | 'submitting' | 'error' | 'success';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Estados de control de formulario
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<NormalizedError | string | null>(null);

  const { colors, isDark, themeMode } = useAppTheme();
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const storeFormError = useAuthStore((state) => state.formError);
  const clearError = useAuthStore((state) => state.clearError);
  const router = useRouter();

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (localError || storeError) {
      setLocalError(null);
      clearError();
      setFormStatus('idle');
    }
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        errors.email = 'Ingresa un formato de correo electrónico válido.';
      }
    }

    if (!password) {
      errors.password = 'La contraseña es obligatoria.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLocalError({
        title: 'Datos requeridos incompletos',
        message: 'Por favor ingresa tu correo y contraseña para continuar.',
        category: 'VALIDATION',
        fieldErrors: errors,
      });
      setFormStatus('error');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (formStatus === 'submitting' || isLoading) return;

    if (!validateFields()) return;

    try {
      setFormStatus('submitting');
      clearError();
      setLocalError(null);

      await login({ email: email.trim().toLowerCase(), password });
      setFormStatus('success');
    } catch (err: any) {
      setFormStatus('error');
      const errObj: NormalizedError =
        err && typeof err === 'object' && 'message' in err
          ? err
          : {
              title: 'No se pudo iniciar sesión',
              message: err?.message || 'Error al verificar tus credenciales.',
              category: 'UNKNOWN',
            };

      setLocalError(errObj);
      if (errObj.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...errObj.fieldErrors }));
      }
    }
  };

  const isFormValid = email.length > 0 && password.length > 0;

  const getThemeIcon = () => {
    if (themeMode === 'system') return 'smartphone';
    return isDark ? 'moon' : 'sun';
  };

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
          {/* Top Theme Settings Bar */}
          <View style={styles.topBar}>
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
            <Text style={[styles.title, { color: colors.text.primary }]}>Slotify</Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Inicia sesión para continuar
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
            <FormErrorBanner
              error={localError || storeFormError || storeError}
              onDismiss={() => {
                setLocalError(null);
                clearError();
                setFormStatus('idle');
              }}
              onRetry={handleLogin}
            />

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Correo electrónico</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    borderColor: fieldErrors.email ? colors.status.error : colors.border.main,
                  },
                ]}
                placeholder="tu@correo.com"
                placeholderTextColor={colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  clearFieldError('email');
                }}
                editable={formStatus !== 'submitting' && !isLoading}
              />
              <FormFieldError error={fieldErrors.email} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Contraseña</Text>
              <View
                style={[
                  styles.passwordContainer,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderColor: fieldErrors.password ? colors.status.error : colors.border.main,
                  },
                ]}
              >
                <TextInput
                  style={[styles.passwordInput, { color: colors.text.primary }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    clearFieldError('password');
                  }}
                  editable={formStatus !== 'submitting' && !isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={[styles.eyeIcon, { color: colors.text.accent }]}>
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </Text>
                </TouchableOpacity>
              </View>
              <FormFieldError error={fieldErrors.password} />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.action.primary },
                (formStatus === 'submitting' || isLoading) && { backgroundColor: colors.action.disabled },
              ]}
              onPress={handleLogin}
              disabled={formStatus === 'submitting' || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.action.primaryText} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.action.primaryText }]}>
                  Iniciar Sesión
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
                Continuar con Google
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                ¿No tienes cuenta?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={[styles.footerLink, { color: colors.text.primary }]}>
                  Regístrate aquí
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
    justifyContent: 'center',
    padding: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
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
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
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
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  eyeIcon: {
    fontWeight: '600',
    fontSize: 13,
  },
  button: {
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
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
});
