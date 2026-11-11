import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { DEFAULT_BUSINESS_TIME_ZONE } from '@/features/calendar/model/businessTime';
import type { BusinessClient, ClientAppointmentStatus, ClientManagementAction } from '../../types';
import { formatShortDate, getClientInitials } from './ClientCard';

interface ClientDetailModalProps {
  visible: boolean;
  timeZone?: string;
  client: BusinessClient | null;
  onClose: () => void;
  onEditClient: (client: BusinessClient) => void;
  onSaveNote: (client: BusinessClient, note: string) => Promise<void> | void;
  onScheduleAppointment: (client: BusinessClient) => void;
  onManageClient: (client: BusinessClient, action: ClientManagementAction) => Promise<void>;
}

const managementLabels = {
  archive: 'Archivar cliente',
  restore: 'Restaurar cliente',
  delete: 'Eliminar ficha',
} as const;

const managementDescription = {
  archive: 'La ficha pasará a Archivados. Sus citas seguirán en la agenda y podrás restaurarla cuando quieras.',
  restore: 'La ficha volverá a aparecer en la cartera activa.',
  delete: 'Se eliminarán la ficha y sus notas de la cartera de tu negocio. Esta acción es permanente.',
} as const;

function getStatusBadge(status: ClientAppointmentStatus, isDark: boolean) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completada',
        bg: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
        color: isDark ? '#34D399' : '#059669',
      };
    case 'cancelled':
    case 'no_show':
      return {
        label: status === 'no_show' ? 'Inasistencia' : 'Cancelada',
        bg: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
        color: isDark ? '#F87171' : '#DC2626',
      };
    case 'pending':
      return {
        label: 'Pendiente',
        bg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FFFBEB',
        color: isDark ? '#FBBF24' : '#D97706',
      };
    default:
      return {
        label: 'Confirmada',
        bg: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
        color: isDark ? '#818CF8' : '#4F46E5',
      };
  }
}

export function ClientDetailModal({
  visible,
  timeZone = DEFAULT_BUSINESS_TIME_ZONE,
  client,
  onClose,
  onEditClient,
  onSaveNote,
  onScheduleAppointment,
  onManageClient,
}: ClientDetailModalProps) {
  const { colors, isDark } = useAppTheme();
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [pendingAction, setPendingAction] = useState<ClientManagementAction | null>(null);
  const [managementError, setManagementError] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    if (client) {
      setNoteDraft(client.notes ?? '');
      setNoteSavedFeedback(false);
      setNoteError(null);
    }
  }, [client]);

  useEffect(() => {
    setPendingAction(null);
    setManagementError(null);
  }, [client?.id, visible]);

  if (!client) return null;

  const isArchived = Boolean(client.archivedAt);
  const canDelete = Boolean(client.isRegistered && client.appointments.length === 0);
  const canArchive = Boolean(client.isRegistered || client.appointments.length > 0);
  const actionBusy = savingNote || managing;
  const accent = isDark ? '#A5B4FC' : '#4F46E5';
  const danger = isDark ? '#FCA5A5' : '#B91C1C';

  const handleCall = () => {
    if (!client.phone) return;
    const clean = client.phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    if (!client.phone) return;
    const digits = client.phone.replace(/\D+/g, '');
    Linking.openURL(`https://wa.me/${digits}`).catch(() => {});
  };

  const handleEmail = () => {
    if (!client.email) return;
    Linking.openURL(`mailto:${client.email}`).catch(() => {});
  };

  const handleSaveNotePress = async () => {
    setNoteError(null);
    setNoteSavedFeedback(false);
    setSavingNote(true);
    try {
      await onSaveNote(client, noteDraft);
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 2200);
    } catch (err: any) {
      setNoteError(
        err?.message || 'No se pudo guardar la nota en el servidor.'
      );
    } finally {
      setSavingNote(false);
    }
  };

  const beginManagement = (action: ClientManagementAction) => {
    setPendingAction(action);
    setManagementError(null);
  };

  const confirmManagement = async () => {
    if (!pendingAction || actionBusy) return;
    setManaging(true);
    setManagementError(null);
    try {
      await onManageClient(client, pendingAction);
      setPendingAction(null);
    } catch (err: unknown) {
      setManagementError(err instanceof Error ? err.message : 'No se pudo actualizar la ficha.');
    } finally {
      setManaging(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={managing ? () => {} : onClose}
    >
      <View style={s.overlay}>
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

          {/* Encabezado de perfil */}
          <View style={s.headerRow}>
            <View
              style={[
                s.avatarLarge,
                {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.18)'
                    : '#EEF2FF',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : '#C7D2FE',
                },
              ]}
            >
              <Text
                style={[
                  s.avatarLargeText,
                  { color: isDark ? '#818CF8' : '#4F46E5' },
                ]}
              >
                {getClientInitials(client.fullName)}
              </Text>
            </View>

            <View style={s.headerInfo}>
              <Text
                style={[s.clientName, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {client.fullName}
              </Text>
              <Text style={[s.clientSince, { color: colors.text.muted }]}>
                {isArchived ? 'Cliente archivado' : `Cliente desde ${formatShortDate(client.createdAt, timeZone)}`}
              </Text>
            </View>

            {!isArchived && <TouchableOpacity
              testID="btn-edit-client-detail"
              disabled={actionBusy}
              onPress={() => onEditClient(client)}
              style={[
                s.iconCircleBtn,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <Feather name="edit-2" size={16} color={colors.text.primary} />
            </TouchableOpacity>}

            <TouchableOpacity
              testID="btn-close-client-detail"
              disabled={managing}
              onPress={onClose}
              style={[
                s.iconCircleBtn,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <Feather name="x" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scrollContent}
          >
            {/* Acciones rápidas de contacto */}
            <View style={s.quickActionsRow}>
              <TouchableOpacity
                disabled={!client.phone}
                onPress={handleCall}
                style={[
                  s.quickActionBtn,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                    opacity: client.phone ? 1 : 0.45,
                  },
                ]}
              >
                <Feather name="phone-call" size={16} color="#6366F1" />
                <Text
                  style={[s.quickActionLabel, { color: colors.text.primary }]}
                >
                  Llamar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!client.phone}
                onPress={handleWhatsApp}
                style={[
                  s.quickActionBtn,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                    opacity: client.phone ? 1 : 0.45,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="whatsapp"
                  size={18}
                  color="#10B981"
                />
                <Text
                  style={[s.quickActionLabel, { color: colors.text.primary }]}
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!client.email}
                onPress={handleEmail}
                style={[
                  s.quickActionBtn,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                    opacity: client.email ? 1 : 0.45,
                  },
                ]}
              >
                <Feather name="mail" size={16} color="#F59E0B" />
                <Text
                  style={[s.quickActionLabel, { color: colors.text.primary }]}
                >
                  Correo
                </Text>
              </TouchableOpacity>

              {!isArchived && <TouchableOpacity
                testID="btn-schedule-from-client"
                disabled={actionBusy}
                onPress={() => onScheduleAppointment(client)}
                style={[
                  s.quickActionBtn,
                  {
                    backgroundColor: 'rgba(99, 102, 241, 0.16)',
                    borderColor: 'rgba(99, 102, 241, 0.35)',
                  },
                ]}
              >
                <Feather name="calendar" size={16} color="#818CF8" />
                <Text style={[s.quickActionLabel, { color: '#818CF8' }]}>
                  Agendar
                </Text>
              </TouchableOpacity>}
            </View>

            {/* Tarjetas de métricas del cliente */}
            <View style={s.kpiGrid}>
              <View
                style={[
                  s.kpiBox,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <Text style={[s.kpiValue, { color: '#6366F1' }]}>
                  {client.totalVisits}
                </Text>
                <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                  Visitas
                </Text>
              </View>

              <View
                style={[
                  s.kpiBox,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <Text style={[s.kpiValue, { color: '#10B981' }]}>
                  ${client.totalSpent.toLocaleString('es-MX')}
                </Text>
                <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                  Pactado en completadas
                </Text>
              </View>

              <View
                style={[
                  s.kpiBox,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <Text style={[s.kpiValue, { color: colors.text.primary }]}>
                  {client.completedVisits}
                </Text>
                <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                  Completadas
                </Text>
              </View>
            </View>

            {/* Datos de contacto */}
            <View
              style={[
                s.sectionCard,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
                Datos de Contacto
              </Text>

              <View style={s.infoRow}>
                <Feather name="phone" size={14} color={colors.text.muted} />
                <Text style={[s.infoLabel, { color: colors.text.muted }]}>
                  Teléfono:
                </Text>
                <Text style={[s.infoValue, { color: colors.text.primary }]}>
                  {client.phone || 'No registrado'}
                </Text>
              </View>

              <View style={s.infoRow}>
                <Feather name="mail" size={14} color={colors.text.muted} />
                <Text style={[s.infoLabel, { color: colors.text.muted }]}>
                  Correo:
                </Text>
                <Text style={[s.infoValue, { color: colors.text.primary }]}>
                  {client.email || 'No registrado'}
                </Text>
              </View>

              <View style={s.infoRow}>
                <Feather name="clock" size={14} color={colors.text.muted} />
                <Text style={[s.infoLabel, { color: colors.text.muted }]}>
                  Última visita:
                </Text>
                <Text style={[s.infoValue, { color: colors.text.primary }]}>
                  {formatShortDate(client.lastVisitAt, timeZone)}
                </Text>
              </View>
            </View>

            {/* Notas del negocio */}
            <View
              style={[
                s.sectionCard,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <View style={s.noteHeaderRow}>
                <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
                  Notas Internas del Negocio
                </Text>
                {noteSavedFeedback ? (
                  <Text style={s.savedBadgeText}>Guardado</Text>
                ) : null}
              </View>

              {noteError ? (
                <Text
                  style={{
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}
                >
                  {noteError}
                </Text>
              ) : null}

              <TextInput
                testID="input-detail-client-note"
                value={noteDraft}
                onChangeText={setNoteDraft}
                editable={!isArchived && !actionBusy}
                multiline
                placeholder="Agrega notas sobre preferencias, servicios frecuentes o indicaciones especiales..."
                placeholderTextColor={colors.text.muted}
                style={[
                  s.noteInput,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                    color: colors.text.primary,
                  },
                ]}
              />

              {!isArchived && <TouchableOpacity
                testID="btn-save-client-note"
                disabled={actionBusy}
                onPress={handleSaveNotePress}
                style={s.saveNoteBtn}
              >
                <Feather name="save" size={14} color="#FFFFFF" />
                <Text style={s.saveNoteBtnText}>Guardar Nota</Text>
              </TouchableOpacity>}
            </View>

            {canArchive && (
              <View style={[s.sectionCard, { backgroundColor: colors.background.primary, borderColor: colors.border.main }]}>
                {pendingAction ? (
                  <>
                    <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
                      ¿{managementLabels[pendingAction]}?
                    </Text>
                    <Text style={[s.managementCopy, { color: colors.text.secondary }]}>
                      {managementDescription[pendingAction]}
                    </Text>
                    {managementError && (
                      <Text accessibilityRole="alert" style={[s.managementCopy, { color: danger }]}>
                        {managementError}
                      </Text>
                    )}
                    <View style={s.managementRow}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={managing}
                        onPress={() => setPendingAction(null)}
                        style={[s.managementButton, { borderColor: colors.border.main }]}
                      >
                        <Text style={[s.managementButtonText, { color: colors.text.primary }]}>Volver</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityState={{ busy: managing, disabled: actionBusy }}
                        disabled={actionBusy}
                        onPress={confirmManagement}
                        testID={`confirm-client-${pendingAction}`}
                        style={[
                          s.managementButton,
                          { backgroundColor: pendingAction === 'delete' ? '#B91C1C' : '#4F46E5', borderColor: 'transparent' },
                        ]}
                      >
                        {managing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={[s.managementButtonText, { color: '#FFFFFF' }]}>
                            {managementLabels[pendingAction]}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={s.managementRow}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      disabled={actionBusy}
                      onPress={() => beginManagement(isArchived ? 'restore' : 'archive')}
                      testID={isArchived ? 'btn-restore-client' : 'btn-archive-client'}
                      style={[s.managementButton, { borderColor: colors.border.main }]}
                    >
                      <Feather name={isArchived ? 'rotate-ccw' : 'archive'} size={15} color={accent} />
                      <Text style={[s.managementButtonText, { color: accent }]}>
                        {managementLabels[isArchived ? 'restore' : 'archive']}
                      </Text>
                    </TouchableOpacity>
                    {canDelete && (
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={actionBusy}
                        onPress={() => beginManagement('delete')}
                        testID="btn-delete-client"
                        style={[s.managementButton, { borderColor: colors.border.main }]}
                      >
                        <Feather name="trash-2" size={15} color={danger} />
                        <Text style={[s.managementButtonText, { color: danger }]}>Eliminar ficha</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Historial de citas */}
            <View style={s.historySection}>
              <View style={s.historyHeaderRow}>
                <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
                  Historial de Citas ({client.appointments.length})
                </Text>
              </View>

              {client.appointments.length === 0 ? (
                <View
                  style={[
                    s.emptyHistoryBox,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.main,
                    },
                  ]}
                >
                  <Feather
                    name="calendar"
                    size={22}
                    color={colors.text.muted}
                  />
                  <Text
                    style={[
                      s.emptyHistoryTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    Sin citas registradas aún
                  </Text>
                  <Text
                    style={[
                      s.emptyHistorySubtitle,
                      { color: colors.text.muted },
                    ]}
                  >
                    Cuando este cliente agende o le registres una cita en la
                    Agenda, su historial aparecerá aquí automáticamente.
                  </Text>
                </View>
              ) : (
                client.appointments.map((apt) => {
                  const statusStyle = getStatusBadge(apt.status, isDark);
                  const startObj = new Date(apt.startTime);
                  const dateLabel = startObj.toLocaleDateString('es-MX', {
                    timeZone,
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeLabel = startObj.toLocaleTimeString('es-MX', {
                    timeZone,
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View
                      key={apt.id}
                      style={[
                        s.appointmentItem,
                        {
                          backgroundColor: colors.background.primary,
                          borderColor: colors.border.main,
                        },
                      ]}
                    >
                      <View style={s.appointmentTop}>
                        <Text
                          style={[
                            s.appointmentTitle,
                            { color: colors.text.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {apt.title || 'Cita'}
                        </Text>

                        <View
                          style={[
                            s.statusPill,
                            { backgroundColor: statusStyle.bg },
                          ]}
                        >
                          <Text
                            style={[
                              s.statusPillText,
                              { color: statusStyle.color },
                            ]}
                          >
                            {statusStyle.label}
                          </Text>
                        </View>
                      </View>

                      <View style={s.appointmentMetaRow}>
                        <View style={s.appointmentMetaItem}>
                          <Feather
                            name="calendar"
                            size={12}
                            color={colors.text.muted}
                          />
                          <Text
                            style={[
                              s.appointmentMetaText,
                              { color: colors.text.secondary },
                            ]}
                          >
                            {dateLabel} • {timeLabel}
                          </Text>
                        </View>

                        {apt.agreedTotal > 0 ? (
                          <Text
                            style={[
                              s.appointmentPrice,
                              apt.status !== 'completed' && {
                                color: colors.text.secondary,
                              },
                            ]}
                          >
                            Pactado:{' '}
                            ${apt.agreedTotal.toLocaleString('es-MX')}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 26,
    maxHeight: '90%',
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
    gap: 10,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '800',
  },
  clientSince: {
    fontSize: 12,
    marginTop: 2,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 18,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  kpiBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 88,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    borderRadius: 11,
    paddingVertical: 10,
  },
  saveNoteBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  managementCopy: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  managementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  managementButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  historySection: {
    marginTop: 2,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyHistoryBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyHistorySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  appointmentItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginBottom: 9,
  },
  appointmentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  appointmentTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appointmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appointmentMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  appointmentPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
});

