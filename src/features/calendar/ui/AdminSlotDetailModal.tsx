import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import type { CalendarSlot } from '@/shared/types';
import { useAppTheme } from '@/shared/theme';

interface AdminSlotDetailModalProps {
  slot: CalendarSlot | null;
  visible: boolean;
  onClose: () => void;
  onStatusChange: (resourceId: string, status: 'confirmed' | 'cancelled' | 'completed') => void;
  onDeleteBlock: (resourceId: string) => void;
  onReschedule?: (resourceId: string, newStartTime: string, newEndTime: string) => void;
}

const RESCHEDULE_HOURS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00',
];

export const AdminSlotDetailModal: React.FC<AdminSlotDetailModalProps> = ({
  slot,
  visible,
  onClose,
  onStatusChange,
  onDeleteBlock,
  onReschedule,
}) => {
  const { colors, isDark } = useAppTheme();
  const [isRescheduling, setIsRescheduling] = React.useState(false);
  const [selectedNewHour, setSelectedNewHour] = React.useState('10:00');

  React.useEffect(() => {
    if (visible && slot) {
      setIsRescheduling(false);
      const startH = new Date(slot.startTime).getHours();
      const startM = new Date(slot.startTime).getMinutes();
      const nearest = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      setSelectedNewHour(RESCHEDULE_HOURS.includes(nearest) ? nearest : '10:00');
    }
  }, [visible, slot]);

  if (!slot) return null;

  const isAppointment = slot.type === 'appointment';
  const isBlock = slot.type === 'block';

  const startDate = new Date(slot.startTime);
  const endDate = new Date(slot.endTime);

  const formatHour = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDateFull = (d: Date) => {
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CL';
    const p = name.trim().split(' ');
    if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleWhatsApp = () => {
    const rawPhone = (slot.clientPhone || '5512345678').replace(/\D/g, '');
    const client = slot.clientName || 'Cliente';
    const text = encodeURIComponent(
      `¡Hola ${client}! Te escribimos de nuestro negocio para confirmar tu cita de ${slot.title} el día ${formatDateFull(startDate)} a las ${formatHour(startDate)}.`
    );
    Linking.openURL(`https://wa.me/${rawPhone}?text=${text}`).catch(() => {
      Alert.alert('Aviso', 'No se pudo abrir WhatsApp en este dispositivo.');
    });
  };

  const handleCall = () => {
    const rawPhone = (slot.clientPhone || '5512345678').replace(/\D/g, '');
    Linking.openURL(`tel:${rawPhone}`).catch(() => {
      Alert.alert('Aviso', 'No se pudo iniciar la llamada.');
    });
  };

  const handleMarkCompleted = () => {
    onStatusChange(slot.resourceId, 'completed');
    onClose();
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancelar Cita',
      `¿Estás seguro de que deseas cancelar la cita de ${slot.clientName || 'este cliente'}? Esta acción notificará el horario liberado.`,
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar cita',
          style: 'destructive',
          onPress: () => {
            onStatusChange(slot.resourceId, 'cancelled');
            onClose();
          },
        },
      ]
    );
  };

  const handleRemoveBlock = () => {
    Alert.alert(
      'Liberar Horario',
      '¿Deseas desbloquear este espacio y volverlo a poner disponible para reservas de clientes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, desbloquear',
          style: 'default',
          onPress: () => {
            onDeleteBlock(slot.resourceId);
            onClose();
          },
        },
      ]
    );
  };

  const handleConfirmReschedule = () => {
    const durationMs = endDate.getTime() - startDate.getTime();
    const [h, m] = selectedNewHour.split(':').map(Number);
    const newStart = new Date(startDate);
    newStart.setHours(h, m, 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    onReschedule?.(slot.resourceId, newStart.toISOString(), newEnd.toISOString());
    setIsRescheduling(false);
    onClose();
  };

  const getNewEndHourFormatted = () => {
    const durationMs = endDate.getTime() - startDate.getTime();
    const [h, m] = selectedNewHour.split(':').map(Number);
    const newStart = new Date(startDate);
    newStart.setHours(h, m, 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);
    return formatHour(newEnd);
  };

  const getStatusBadge = () => {
    switch (slot.status) {
      case 'completed':
        return { label: 'Completada / Cobrada', bg: 'rgba(16, 185, 129, 0.15)', color: '#34D399', icon: 'check-circle' };
      case 'cancelled':
        return { label: 'Cancelada', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', icon: 'x-circle' };
      case 'blocked':
        return { label: 'Bloqueado', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', icon: 'slash' };
      default:
        return { label: 'Confirmada', bg: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', icon: 'calendar' };
    }
  };

  const badge = getStatusBadge();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#11131E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(0, 0, 0, 0.20)' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: badge.bg },
                ]}
              >
                <Feather name={badge.icon as any} size={13} color={badge.color} style={{ marginRight: 6 }} />
                <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Si es Cita de Cliente */}
            {isAppointment && (
              <>
                {/* Perfil del Cliente */}
                <View style={styles.clientProfileRow}>
                  <View style={[styles.avatar, { backgroundColor: 'rgba(99, 102, 241, 0.18)' }]}>
                    <Text style={[styles.avatarText, { color: '#818CF8' }]}>
                      {getInitials(slot.clientName)}
                    </Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, { color: colors.text.primary }]}>
                      {slot.clientName || 'Cliente General'}
                    </Text>
                    <Text style={[styles.clientPhone, { color: colors.text.muted }]}>
                      {slot.clientPhone || '+52 55 1234 5678'}
                    </Text>
                  </View>
                </View>

                {/* Botones de Contacto Rápido */}
                <View style={styles.contactRow}>
                  <TouchableOpacity
                    onPress={handleWhatsApp}
                    style={[styles.contactBtn, { backgroundColor: 'rgba(37, 211, 102, 0.12)', borderColor: 'rgba(37, 211, 102, 0.30)' }]}
                  >
                    <FontAwesome5 name="whatsapp" size={16} color="#25D366" style={{ marginRight: 8 }} />
                    <Text style={[styles.contactBtnText, { color: '#25D366' }]}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCall}
                    style={[
                      styles.contactBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <Feather name="phone" size={16} color={colors.text.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.contactBtnText, { color: colors.text.primary }]}>Llamar</Text>
                  </TouchableOpacity>
                </View>

                {/* Tarjeta de Servicio */}
                <View
                  style={[
                    styles.infoCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <View style={styles.infoCardRow}>
                    <View style={styles.infoCardLeft}>
                      <Text style={[styles.infoLabel, { color: colors.text.muted }]}>SERVICIO</Text>
                      <Text style={[styles.infoValue, { color: colors.text.primary }]}>{slot.title}</Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>{slot.servicePrice || '$250 MXN'}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]} />

                  <View style={styles.infoMetaGrid}>
                    <View style={styles.infoMetaItem}>
                      <Feather name="calendar" size={14} color={colors.text.muted} style={{ marginRight: 6 }} />
                      <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                        {formatDateFull(startDate)}
                      </Text>
                    </View>
                    <View style={styles.infoMetaItem}>
                      <Feather name="clock" size={14} color="#818CF8" style={{ marginRight: 6 }} />
                      <Text style={[styles.metaText, { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' }]}>
                        {formatHour(startDate)} - {formatHour(endDate)}
                      </Text>
                    </View>
                    {slot.employeeName && (
                      <View style={styles.infoMetaItem}>
                        <Feather name="user-check" size={14} color={colors.text.muted} style={{ marginRight: 6 }} />
                        <Text style={[styles.metaText, { color: colors.text.secondary }]}>
                          Atiende: {slot.employeeName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Sección de Reprogramación de Horario */}
                {isRescheduling && (
                  <View
                    style={[
                      styles.rescheduleCard,
                      {
                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                        borderColor: 'rgba(99, 102, 241, 0.25)',
                      },
                    ]}
                  >
                    <View style={styles.rescheduleHeader}>
                      <Feather name="clock" size={16} color="#818CF8" style={{ marginRight: 6 }} />
                      <Text style={[styles.rescheduleTitle, { color: colors.text.primary }]}>
                        Elige el nuevo horario de inicio:
                      </Text>
                    </View>
                    <Text style={[styles.rescheduleSubtitle, { color: colors.text.muted }]}>
                      La duración del servicio se mantendrá automáticamente.
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                      {RESCHEDULE_HOURS.map((hour) => {
                        const isSelected = selectedNewHour === hour;
                        return (
                          <TouchableOpacity
                            key={hour}
                            style={[
                              styles.hourChip,
                              {
                                backgroundColor: isSelected
                                  ? '#6366F1'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.06)'
                                  : 'rgba(0, 0, 0, 0.05)',
                                borderColor: isSelected
                                  ? '#6366F1'
                                  : isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(0, 0, 0, 0.08)',
                              },
                            ]}
                            onPress={() => setSelectedNewHour(hour)}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.hourChipText,
                                {
                                  color: isSelected ? '#FFFFFF' : colors.text.primary,
                                  fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium',
                                },
                              ]}
                            >
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <View style={styles.rescheduleSummary}>
                      <Text style={[styles.rescheduleSummaryText, { color: '#818CF8' }]}>
                        Nuevo horario: {selectedNewHour} a {getNewEndHourFormatted()}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Si es Bloqueo de Horario */}
            {isBlock && (
              <View
                style={[
                  styles.blockCard,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                    borderColor: 'rgba(239, 68, 68, 0.20)',
                  },
                ]}
              >
                <View style={styles.blockHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Feather name="slash" size={20} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.blockTitle, { color: colors.text.primary }]}>{slot.title}</Text>
                    <Text style={[styles.blockReason, { color: colors.text.muted }]}>
                      Motivo: {slot.blockReason || 'Horario no disponible para clientes'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} />

                <View style={styles.blockTimeRow}>
                  <Feather name="clock" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={[styles.blockTimeText, { color: colors.text.primary }]}>
                    {formatDateFull(startDate)} • {formatHour(startDate)} a {formatHour(endDate)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer de Acciones Administrativas */}
          <View style={styles.footer}>
            {isRescheduling ? (
              <View style={styles.rescheduleBtnGroup}>
                <TouchableOpacity
                  onPress={() => setIsRescheduling(false)}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                      flex: 1,
                    },
                  ]}
                >
                  <Text style={[styles.secondaryActionBtnText, { color: colors.text.secondary }]}>Volver</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmReschedule}
                  style={[styles.primaryActionBtn, { backgroundColor: '#6366F1', flex: 1.6 }]}
                >
                  <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryActionBtnText}>Guardar Cambio</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {isAppointment && (
                  <>
                    {slot.status !== 'completed' && slot.status !== 'cancelled' && (
                      <TouchableOpacity
                        onPress={handleMarkCompleted}
                        style={[styles.primaryActionBtn, { backgroundColor: '#10B981' }]}
                      >
                        <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryActionBtnText}>Marcar como Cobrada / Completada</Text>
                      </TouchableOpacity>
                    )}

                    {slot.status !== 'cancelled' && (
                      <View style={styles.appointmentActionRow}>
                        <TouchableOpacity
                          onPress={() => setIsRescheduling(true)}
                          style={[
                            styles.secondaryActionBtn,
                            {
                              borderColor: 'rgba(99, 102, 241, 0.35)',
                              backgroundColor: 'rgba(99, 102, 241, 0.08)',
                              flex: 1,
                            },
                          ]}
                        >
                          <Feather name="clock" size={14} color="#818CF8" style={{ marginRight: 6 }} />
                          <Text style={[styles.secondaryActionBtnText, { color: '#818CF8' }]}>Reprogramar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleCancelAppointment}
                          style={[
                            styles.secondaryActionBtn,
                            {
                              borderColor: isDark ? 'rgba(239, 68, 68, 0.30)' : 'rgba(239, 68, 68, 0.25)',
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              flex: 1,
                            },
                          ]}
                        >
                          <Feather name="trash-2" size={14} color="#EF4444" style={{ marginRight: 6 }} />
                          <Text style={[styles.secondaryActionBtnText, { color: '#EF4444' }]}>Cancelar Cita</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {isBlock && (
                  <TouchableOpacity
                    onPress={handleRemoveBlock}
                    style={[styles.primaryActionBtn, { backgroundColor: '#EF4444' }]}
                  >
                    <Feather name="unlock" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryActionBtnText}>Desbloquear Horario (Poner Disponible)</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
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
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  clientProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 22,
  },
  clientPhone: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  contactBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  infoCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoCardLeft: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceText: {
    color: '#818CF8',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  infoMetaGrid: {
    gap: 8,
  },
  infoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  blockCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  blockReason: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  blockTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockTimeText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  footer: {
    gap: 10,
    marginTop: 10,
  },
  primaryActionBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryActionBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  appointmentActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rescheduleCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  rescheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rescheduleTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  rescheduleSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  chipsRow: {
    marginBottom: 12,
  },
  hourChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  hourChipText: {
    fontSize: 12,
  },
  rescheduleSummary: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.15)',
  },
  rescheduleSummaryText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  rescheduleBtnGroup: {
    flexDirection: 'row',
    gap: 10,
  },
});
