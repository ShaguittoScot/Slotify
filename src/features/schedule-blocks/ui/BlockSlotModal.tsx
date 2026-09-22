import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

interface BlockSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (blockData: {
    title: string;
    reason: string;
    startTime: string;
    endTime: string;
  }) => void;
  initialDate?: Date;
  initialHour?: string;
}

const PRESET_REASONS = [
  { id: 'lunch', label: 'Horario de Comida', icon: 'silverware-fork-knife', defaultDuration: 60 },
  { id: 'break', label: 'Descanso / Pausa', icon: 'coffee', defaultDuration: 30 },
  { id: 'meeting', label: 'Junta de Personal', icon: 'account-group', defaultDuration: 45 },
  { id: 'maintenance', label: 'Limpieza / Taller', icon: 'broom', defaultDuration: 60 },
  { id: 'personal', label: 'Asunto Personal', icon: 'briefcase', defaultDuration: 120 },
];

const TIME_OPTIONS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export const BlockSlotModal: React.FC<BlockSlotModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate = new Date(),
  initialHour,
}) => {
  const { colors, isDark } = useAppTheme();

  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [startHour, setStartHour] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(60);

  useEffect(() => {
    if (visible) {
      if (initialHour) {
        const matching = TIME_OPTIONS.find((t) => t.startsWith(initialHour.slice(0, 2))) || initialHour;
        setStartHour(matching);
      } else {
        const h = String(initialDate.getHours()).padStart(2, '0');
        const nearest = TIME_OPTIONS.find((t) => t.startsWith(h)) || '14:00';
        setStartHour(nearest);
      }
      setSelectedReason(PRESET_REASONS[0]);
      setCustomReason('');
      setDurationMinutes(60);
    }
  }, [visible, initialDate, initialHour]);

  const handleSave = () => {
    const d = new Date(initialDate);
    const [hours, minutes] = startHour.split(':').map(Number);
    d.setHours(hours, minutes, 0, 0);

    const end = new Date(d.getTime() + durationMinutes * 60 * 1000);

    const reasonText = customReason.trim() ? customReason.trim() : selectedReason.label;

    onSave({
      title: `Bloqueo: ${reasonText}`,
      reason: reasonText,
      startTime: d.toISOString(),
      endTime: end.toISOString(),
    });
    onClose();
  };

  const endHourFormatted = () => {
    const [h, m] = startHour.split(':').map(Number);
    const totalMinutes = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#11131E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Feather name="slash" size={18} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                  Bloquear Horario
                </Text>
                <Text style={[styles.subtitle, { color: colors.text.muted }]}>
                  Define tiempo no disponible en tu agenda
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Motivo Selector */}
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
              Motivo del Bloqueo
            </Text>
            <View style={styles.reasonsGrid}>
              {PRESET_REASONS.map((preset) => {
                const isSelected = selectedReason.id === preset.id && !customReason;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => {
                      setSelectedReason(preset);
                      setCustomReason('');
                      setDurationMinutes(preset.defaultDuration);
                    }}
                    style={[
                      styles.reasonChip,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(239, 68, 68, 0.14)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? '#EF4444'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={preset.icon as any}
                      size={16}
                      color={isSelected ? '#EF4444' : colors.text.muted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.reasonText,
                        {
                          color: isSelected ? '#EF4444' : colors.text.primary,
                          fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Reason Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="O escribe otro motivo específico..."
                placeholderTextColor={colors.text.muted}
                style={[
                  styles.customInput,
                  {
                    color: colors.text.primary,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: customReason ? '#EF4444' : isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
                  },
                ]}
              />
            </View>

            {/* Hora de Inicio */}
            <Text style={[styles.sectionLabel, { color: colors.text.secondary, marginTop: 14 }]}>
              Hora de Inicio
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
              {TIME_OPTIONS.map((time) => {
                const isSelected = startHour === time;
                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setStartHour(time)}
                    style={[
                      styles.timePill,
                      {
                        backgroundColor: isSelected
                          ? '#6366F1'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? '#6366F1'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timePillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text.secondary,
                          fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        },
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Duración */}
            <Text style={[styles.sectionLabel, { color: colors.text.secondary, marginTop: 14 }]}>
              Duración
            </Text>
            <View style={styles.durationRow}>
              {[30, 45, 60, 90, 120].map((mins) => {
                const isSelected = durationMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setDurationMinutes(mins)}
                    style={[
                      styles.durationBtn,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(99, 102, 241, 0.15)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? '#6366F1'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationBtnText,
                        {
                          color: isSelected ? '#818CF8' : colors.text.secondary,
                          fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        },
                      ]}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Rango Calculado */}
            <View
              style={[
                styles.rangeSummary,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: 'rgba(239, 68, 68, 0.20)',
                },
              ]}
            >
              <Feather name="clock" size={15} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.rangeSummaryText, { color: colors.text.primary }]}>
                Bloqueado de <Text style={{ fontFamily: 'Inter_700Bold', color: '#EF4444' }}>{startHour}</Text> a{' '}
                <Text style={{ fontFamily: 'Inter_700Bold', color: '#EF4444' }}>{endHourFormatted()}</Text> ({durationMinutes} min)
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.cancelBtn,
                {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                },
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text.secondary }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: '#EF4444' }]}
            >
              <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Confirmar Bloqueo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 12,
  },
  inputWrapper: {
    marginTop: 6,
  },
  customInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  timeScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 13,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  durationBtnText: {
    fontSize: 13,
  },
  rangeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
  },
  rangeSummaryText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  saveBtn: {
    flex: 1.6,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
