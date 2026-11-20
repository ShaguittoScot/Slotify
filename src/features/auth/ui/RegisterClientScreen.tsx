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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../model';
import { useAppTheme, ThemeSettingsModal } from '@/shared/theme';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormFieldError } from '@/components/ui/FormFieldError';
import type { NormalizedError } from '@/shared/lib/errorUtils';

type FormStatus = 'idle' | 'submitting' | 'error' | 'success';

export const RegisterClientScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Estados de control de formulario
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<NormalizedError | string | null>(null);

  const { colors, isDark, themeMode } = useAppTheme();
  const registerClient = useAuthStore((state) => state.registerClient);
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

    if (!validateFields()) return;

    try {
      setFormStatus('submitting');
      clearError();
      setLocalError(null);

      const sanitizedPhone = phone.trim() ? phone.trim() : undefined;
      const cleanFirstName = firstName.trim();
      const cleanLastName = lastName.trim();
      const cleanEmail = email.trim().toLowerCase();

      await registerClient({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        fullName: `${cleanFirstName} ${cleanLastName}`.trim(),
        email: cleanEmail,
        password,
        phone: sanitizedPhone,
      });

      setFormStatus('success');
      router.replace('/(onboarding)/consumer' as any);
    } catch (err: any) {
      setFormStatus('error');
      const errObj: NormalizedError =
        err && typeof err === 'object' && 'message' in err
          ? err
          : {
              title: 'No se pudo guardar la información',
              message: err?.message || 'Error durante el registro de cliente.',
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
          {/* Top Bar con regreso y tema */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color={colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowThemeModal(true)}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
              activeOpacity={0.7}
            >
              <Feather name={getThemeIcon()} size={16} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.roleBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <MaterialCommunityIcons name="account-outline" size={14} color="#10B981" />
              <Text style={styles.roleBadgeText}>Cuenta de Cliente</Text>
            </View>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Crear Cuenta
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Agenda citas en tus establecimientos favoritos en segundos.
            </Text>
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

            {/* Nombre y Apellido (Campos Separados) */}
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
                  placeholder="Ej. Carlos"
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
                  placeholder="Ej. Mendoza"
                  placeholderTextColor={colors.text.muted}
                  value={lastName}
                  onChangeText={setLastName}
                  editable={formStatus !== 'submitting' && !isLoading}
                />
              </View>
            </View>

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
                placeholder="carlos@correo.com"
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
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text.primary }]}>
                  Teléfono / WhatsApp
                </Text>
                <Text style={[styles.optionalBadge, { color: colors.text.muted }]}>
                  (Para recordatorios)
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.tertiary,
                    color: colors.text.primary,
                    borderColor: colors.border.main,
                  },
                ]}
                placeholder="555-987-6543"
                placeholderTextColor={colors.text.muted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={formStatus !== 'submitting' && !isLoading}
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
                    borderColor: fieldErrors.password ? colors.status.error : colors.border.main,
                  },
                ]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.text.muted}
                secureTextEntry
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  clearFieldError('password');
                }}
                editable={formStatus !== 'submitting' && !isLoading}
              />
              <FormFieldError error={fieldErrors.password} />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: '#10B981' },
                (formStatus === 'submitting' || isLoading) && { opacity: 0.6 },
              ]}
              onPress={handleRegister}
              disabled={formStatus === 'submitting' || isLoading}
              activeOpacity={0.8}
            >
              {formStatus === 'submitting' || isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                ¿Ya tienes una cuenta?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={[styles.footerLink, { color: colors.action.primary }]}>
                  Iniciar sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <ThemeSettingsModal
          visible={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  header: {
    marginBottom: 20,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 10,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  formContainer: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  optionalBadge: {
    fontSize: 11,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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