import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/model';
import { authRequestMessage } from '@/features/auth/api';
import { useAppTheme } from '@/shared/theme';
import { fetchOwnBusinessInfo, saveOwnProfile } from '../../api';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: Props) {
  const { colors, isDark } = useAppTheme();
  const { user, updateUser } = useAuthStore();
  const canRename = user?.role === 'DUENO' && Boolean(user.businessId && !user.businessId.startsWith('demo'));
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState<string>();
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!visible || !user) return;
    setFirstName(user.firstName || user.fullName.split(' ')[0] || '');
    setLastName(user.lastName || '');
    setBusinessName(undefined);
    setError(undefined);
    if (!canRename) return;
    const controller = new AbortController();
    setLoadingBusiness(true);
    fetchOwnBusinessInfo(controller.signal).then(
      (info) => { if (!controller.signal.aborted) setBusinessName(info.name); },
      () => {},
    ).finally(() => { if (!controller.signal.aborted) setLoadingBusiness(false); });
    return () => controller.abort();
  }, [visible, user, canRename]);

  const save = async () => {
    if (!user || saving || !firstName.trim() || (businessName !== undefined && !businessName.trim())) return;
    setSaving(true);
    setError(undefined);
    try {
      const saved = await saveOwnProfile(user, firstName.trim(), lastName.trim(), businessName?.trim());
      if (useAuthStore.getState().user?.id !== user.id) return;
      updateUser(saved);
      onClose();
    } catch (failure) {
      setError(authRequestMessage(failure, 'No se pudo guardar tu perfil.'));
    } finally {
      setSaving(false);
    }
  };
  const close = () => { if (!saving) onClose(); };
  const fields = [
    { label: 'Nombre', value: firstName, change: setFirstName, maxLength: 100, icon: 'user' as const },
    { label: 'Apellidos', value: lastName, change: setLastName, maxLength: 100, icon: 'user' as const },
    ...(businessName !== undefined ? [{
      label: 'Nombre del negocio', value: businessName, change: setBusinessName, maxLength: 150, icon: 'briefcase' as const,
    }] : []),
  ];
  const disabled = saving || !firstName.trim() || (businessName !== undefined && !businessName.trim());

  const inputColors = {
    backgroundColor: isDark ? '#262628' : '#F4F4F6',
    borderColor: isDark ? '#38383A' : '#E5E5EA',
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessible={false} />
        <View style={[styles.modalCard, {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {user?.businessId ? 'Editar Perfil de Administrador' : 'Editar Datos Personales'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.text.muted }]}>
                {canRename ? 'Actualiza tu nombre y negocio activo' : 'Actualiza tu información personal'}
              </Text>
            </View>
            <TouchableOpacity onPress={close} disabled={saving} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.fields} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {fields.map(({ label, value, change, maxLength, icon }) => (
              <View key={label} style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>{label}</Text>
                <View style={[styles.inputWrapper, inputColors]}>
                  <Feather name={icon} size={16} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput accessibilityLabel={label} style={[styles.input, { color: colors.text.primary }]}
                    value={value} onChangeText={change} maxLength={maxLength} editable={!saving} />
                </View>
              </View>
            ))}
            {canRename && businessName === undefined && (
              <Text style={[styles.formGroup, { color: colors.text.muted }]}>
                {loadingBusiness ? 'Consultando nombre del negocio…' : 'El nombre del negocio no está disponible. Puedes guardar tus datos personales.'}
              </Text>
            )}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Correo Electrónico</Text>
              <View style={[styles.inputWrapper, inputColors, { opacity: 0.7 }]}>
                <Feather name="mail" size={16} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput accessibilityLabel="Correo de la cuenta" style={[styles.input, { color: colors.text.muted }]}
                  value={user?.email ?? ''} editable={false} />
              </View>
            </View>
            {error && <Text accessibilityRole="alert" style={{ color: colors.status.error }}>{error}</Text>}
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={close}
              style={[styles.cancelBtn, { backgroundColor: isDark ? '#2A2A2E' : '#EFEFF4' }]}>
              <Text style={[styles.cancelBtnText, { color: colors.text.primary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={save}
              style={[styles.saveBtn, { backgroundColor: colors.action.primary, opacity: disabled ? 0.65 : 1 }]}>
              {saving ? <ActivityIndicator color={colors.action.primaryText} /> : (
                <Text style={[styles.saveBtnText, { color: colors.action.primaryText }]}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  fields: { flexShrink: 1 },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
