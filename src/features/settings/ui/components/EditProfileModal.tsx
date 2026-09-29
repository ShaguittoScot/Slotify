import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: Props) {
  const { colors, isDark } = useAppTheme();
  const { user, updateUser } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    if (visible && user) {
      setFullName(user.fullName || '');
      setBusinessName(user.businessName || '');
    }
  }, [visible, user]);

  const handleSave = () => {
    if (!fullName.trim()) return;
    updateUser({
      fullName: fullName.trim(),
      businessName: businessName.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                    Editar Perfil
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.text.muted }]}>
                    Actualiza tu nombre y negocio activo
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                  Nombre Completo
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? '#262628' : '#F4F4F6',
                      borderColor: isDark ? '#38383A' : '#E5E5EA',
                    },
                  ]}
                >
                  <Feather name="user" size={16} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text.primary }]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Tu nombre completo"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                  Nombre del Negocio
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? '#262628' : '#F4F4F6',
                      borderColor: isDark ? '#38383A' : '#E5E5EA',
                    },
                  ]}
                >
                  <Feather name="briefcase" size={16} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text.primary }]}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Ej. Barbería Don Ricardo"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
                  Correo Electrónico (No modificable)
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? '#1F1F21' : '#EBEBEF',
                      borderColor: isDark ? '#2E2E30' : '#DBDBE0',
                      opacity: 0.7,
                    },
                  ]}
                >
                  <Feather name="mail" size={16} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text.muted }]}
                    value={user?.email || 'usuario@slotify.com'}
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    {
                      backgroundColor: isDark ? '#2A2A2E' : '#EFEFF4',
                    },
                  ]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text.primary }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { backgroundColor: colors.action.primary },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={[styles.saveBtnText, { color: colors.action.primaryText }]}>
                    Guardar Cambios
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
