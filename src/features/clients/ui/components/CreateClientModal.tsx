import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessClient, UpsertClientPayload } from '../../types';

interface CreateClientModalProps {
  visible: boolean;
  initialClient?: BusinessClient | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (payload: UpsertClientPayload) => Promise<void> | void;
}

export function CreateClientModal({
  visible,
  initialClient,
  isSaving = false,
  onClose,
  onSave,
}: CreateClientModalProps) {
  const { colors, isDark } = useAppTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditMode = Boolean(initialClient);

  useEffect(() => {
    if (visible) {
      setFirstName(initialClient?.firstName ?? '');
      setLastName(initialClient?.lastName ?? '');
      setPhone(initialClient?.phone ?? '');
      setEmail(initialClient?.email ?? '');
      setNotes(initialClient?.notes ?? '');
      setValidationError(null);
    }
  }, [visible, initialClient]);

  const handleSubmit = async () => {
    if (isSaving) return;
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanNotes = notes.trim();

    if (!cleanFirst) {
      setValidationError('El nombre del cliente es obligatorio.');
      return;
    }

    if (!cleanPhone && !cleanEmail) {
      setValidationError(
        'Ingresa al menos un teléfono/WhatsApp o correo electrónico de contacto.'
      );
      return;
    }

    if (cleanPhone.length > CLIENT_PHONE_MAX_LENGTH &&
        !(initialClient?.isRegistered && cleanPhone === initialClient.phone?.trim())) {
      setValidationError(`El teléfono admite hasta ${CLIENT_PHONE_MAX_LENGTH} caracteres.`);
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setValidationError('El formato del correo electrónico no es válido.');
      return;
    }

    setValidationError(null);

    const resolvedClientId =
      initialClient?.clientId ??
      (initialClient?.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        initialClient.id
      )
        ? initialClient.id
        : null);

    try {
      await onSave({
        clientId: resolvedClientId,
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: cleanPhone,
        email: cleanEmail,
        notes: cleanNotes,
      });
    } catch (err: any) {
      setValidationError(
        err?.message ||
          'No se pudo guardar el cliente en el servidor. Intenta de nuevo.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => { if (!isSaving) onClose(); }}
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            s.sheet,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.main,
            },
          ]}
        >
          {/* Handle superior */}
          <View style={s.handleWrap}>
            <View
              style={[
                s.handleBar,
                { backgroundColor: isDark ? '#3A3A3A' : '#D4D4D4' },
              ]}
            />
          </View>

          {/* Encabezado */}
          <View style={s.headerRow}>
            <View style={s.headerTitleWrap}>
              <View
                style={[
                  s.headerIconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(99, 102, 241, 0.16)'
                      : '#EEF2FF',
                  },
                ]}
              >
                <Feather
                  name={isEditMode ? 'edit-3' : 'user-plus'}
                  size={18}
                  color="#6366F1"
                />
              </View>
              <View style={s.headerCopy}>
                <Text style={[s.title, { color: colors.text.primary }]}>
                  {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
                </Text>
                <Text style={[s.subtitle, { color: colors.text.muted }]}>
                  {isEditMode
                    ? 'Actualiza los datos de contacto y notas'
                    : 'Registra un cliente en la cartera de tu negocio'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Cerrar formulario de cliente"
              style={[
                s.closeBtn,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <Feather name="x" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {validationError ? (
              <View style={s.errorBanner}>
                <Feather name="alert-circle" size={15} color="#EF4444" />
                <Text style={s.errorBannerText}>{validationError}</Text>
              </View>
            ) : null}

            {/* Nombre y Apellido */}
            <View style={s.rowInputs}>
              <View style={s.halfField}>
                <Text style={[s.label, { color: colors.text.secondary }]}>
                  Nombre(s) *
                </Text>
                <TextInput
                  testID="input-client-firstname"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ej. Carlos"
                  placeholderTextColor={colors.text.muted}
                  style={[
                    s.input,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.main,
                      color: colors.text.primary,
                    },
                  ]}
                />
              </View>

              <View style={s.halfField}>
                <Text style={[s.label, { color: colors.text.secondary }]}>
                  Apellido(s)
                </Text>
                <TextInput
                  testID="input-client-lastname"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Ej. Mendoza"
                  placeholderTextColor={colors.text.muted}
                  style={[
                    s.input,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.main,
                      color: colors.text.primary,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Teléfono */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.text.secondary }]}>
                Teléfono / WhatsApp
              </Text>
              <TextInput
                testID="input-client-phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Ej. +52 442 123 4567"
                placeholderTextColor={colors.text.muted}
                style={[
                  s.input,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                    color: colors.text.primary,
                  },
                ]}
              />
            </View>

            {/* Correo electrónico */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.text.secondary }]}>
                Correo electrónico
              </Text>
              <TextInput
                testID="input-client-email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Ej. cliente@correo.com"
                placeholderTextColor={colors.text.muted}
                style={[
                  s.input,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                    color: colors.text.primary,
                  },
                ]}
              />
            </View>

            {/* Notas del negocio */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: colors.text.secondary }]}>
                Notas internas del negocio (opcional)
              </Text>
              <TextInput
                testID="input-client-notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Preferencias de servicio, alergias, observaciones..."
                placeholderTextColor={colors.text.muted}
                style={[
                  s.input,
                  s.textArea,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                    color: colors.text.primary,
                  },
                ]}
              />
            </View>

            {/* Botones de acción */}
            <View style={s.actionsRow}>
              <TouchableOpacity
                onPress={onClose}
                disabled={isSaving}
                style={[
                  s.cancelBtn,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <Text
                  style={[s.cancelBtnText, { color: colors.text.secondary }]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="btn-submit-client"
                disabled={isSaving}
                onPress={handleSubmit}
                style={[s.saveBtn, isSaving && { opacity: 0.7 }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <Text style={s.saveBtnText}>
                      {isEditMode ? 'Guardar Cambios' : 'Registrar Cliente'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    paddingBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

import { CLIENT_PHONE_MAX_LENGTH } from '@/shared/lib/constants';
