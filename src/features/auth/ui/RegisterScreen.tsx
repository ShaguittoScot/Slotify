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
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormFieldError } from '@/components/ui/FormFieldError';
import type { NormalizedError } from '@/shared/lib/errorUtils';

type SelectedRole = 'CLIENTE' | 'NEGOCIO';
type FormStatus = 'idle' | 'submitting' | 'error' | 'success';

export const RegisterScreen = () => {
  const router = useRouter();
  const { colors, isDark, themeMode } = useAppTheme();

  const register = useAuthStore((state) => state.register);
  const registerClient = useAuthStore((state) => state.registerClient);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const setAppMode = useAuthStore((state) => state.setAppMode);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const storeFormError = useAuthStore((state) => state.formError);
  const clearError = useAuthStore((state) => state.clearError);

  // Form State
  const [role, setRole] = useState<SelectedRole>('CLIENTE');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Estados de control y validación de formulario
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<NormalizedError | string | null>(null);

  const isBusiness = role === 'NEGOCIO';

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

  const handleRoleChange = (newRole: SelectedRole) => {
    clearError();
    setLocalError(null);
    setFieldErrors({});
    setFormStatus('idle');
    setRole(newRole);
    setAppMode(newRole === 'NEGOCIO' ? 'BUSINESS' : 'CONSUMER');
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanFirstName = firstName.trim();
    if (!cleanFirstName) {
      errors.firstName = 'El nombre es obligatorio.';
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        errors.email = 'Ingresa un correo electrónico con formato válido.';
      }
    }

    if (!password) {
      errors.password = 'La contraseña es obligatoria.';
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setLocalError({
        title: 'Verifica los datos requeridos',
        message: 'Por favor completa o corrige los campos señalados antes de continuar.',
        category: 'VALIDATION',
        fieldErrors: errors,
      });
      setFormStatus('error');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (formStatus === 'submitting' || isLoading) return;

    if (!validateFields()) {
      return;
    }

    try {
      setFormStatus('submitting');
      clearError();
      setLocalError(null);

      const sanitizedPhone = phone.trim() || undefined;
      const cleanFirstName = firstName.trim();
      const cleanLastName = lastName.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (isBusiness) {
        await register({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          fullName: `${cleanFirstName} ${cleanLastName}`.trim(),
          email: cleanEmail,
          password,
          phone: sanitizedPhone,
        });
      } else {
        await registerClient({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          fullName: `${cleanFirstName} ${cleanLastName}`.trim(),
          email: cleanEmail,
          password,
          phone: sanitizedPhone,
        });
      }

      setFormStatus('success');
    } catch (err: any) {
      setFormStatus('error');
      const errObj: NormalizedError =
        err && typeof err === 'object' && 'message' in err
          ? err
          : {
              title: 'No se pudo guardar la información',
              message: err?.message || 'Ocurrió un error al procesar el registro.',
              category: 'UNKNOWN',
            };

      setLocalError(errObj);
      if (errObj.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...errObj.fieldErrors }));
      }
    }
  };

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
          {/* Top Bar con botón de regreso y selector de tema */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.topBtn,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.topBtn,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
              onPress={() => setShowThemeModal(true)}
              activeOpacity={0.7}
            >
              <Feather name={getThemeIcon()} size={16} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Crea tu cuenta</Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              {isBusiness
                ? 'Regístrate para comenzar a configurar tu negocio en Slotify.'
                : 'Encuentra y agenda tus servicios favoritos en segundos.'}
            </Text>
          </View>

          {/* Segmented Control */}
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

          {/* Formulario */}
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
              onRetry={handleRegister}
            />

            {/* Nombre y Apellido */}
            <View style={styles.nameRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Nombre</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background.tertiary,
                      color: colors.text.primary,
                      borderColor: fieldErrors.firstName ? colors.status.error : colors.border.main,
                    },
                  ]}
                  placeholder="Ej. Juan"
                  placeholderTextColor={colors.text.muted}
                  value={firstName}
                  onChangeText={(val) => {
                    setFirstName(val);
                    clearFieldError('firstName');
                  }}
                  editable={formStatus !== 'submitting' && !isLoading}
                />
                <FormFieldError error={fieldErrors.firstName} />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Apellido</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background.tertiary,
                      color: colors.text.primary,
                      borderColor: colors.border.main,
                    },
                  ]}
                  placeholder="Ej. Pérez"
                  placeholderTextColor={colors.text.muted}
                  value={lastName}
                  onChangeText={setLastName}
                  editable={formStatus !== 'submitting' && !isLoading}
                />
              </View>
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

            {/* Teléfono Personal */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Teléfono
                <Text style={{ color: colors.text.muted, fontWeight: '400' }}> (opcional)</Text>
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
                editable={formStatus !== 'submitting' && !isLoading}
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
                    borderColor: fieldErrors.password ? colors.status.error : colors.border.main,
                  },
                ]}
              >
                <TextInput
                  style={[styles.passwordInput, { color: colors.text.primary }]}
                  placeholder="Mínimo 6 caracteres"
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
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
              </View>
              <FormFieldError error={fieldErrors.password} />
            </View>

            {/* Botón Principal de Envío */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.action.primary },
                (formStatus === 'submitting' || isLoading) && { backgroundColor: colors.action.disabled },
              ]}
              onPress={handleRegister}
              disabled={formStatus === 'submitting' || isLoading}
              activeOpacity={0.8}
            >
              {formStatus === 'submitting' || isLoading ? (
                <ActivityIndicator color={colors.action.primaryText} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.action.primaryText }]}>
                  {isBusiness ? 'Continuar a Configurar Negocio' : 'Crear Cuenta de Cliente'}
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
    marginBottom: 18,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
