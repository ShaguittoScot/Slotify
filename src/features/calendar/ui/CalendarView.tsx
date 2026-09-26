import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCalendarStore } from '../model';
import { CalendarHeader } from './CalendarHeader';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { AdminSlotDetailModal } from './AdminSlotDetailModal';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { QuickSearchModal } from './QuickSearchModal';
import { JumpToDateModal } from './JumpToDateModal';
import { BlockSlotModal } from '@/features/schedule-blocks';
import { ToastNotification, type ToastType } from '@/components/ui/ToastNotification';
import type { CalendarSlot } from '@/shared/types';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';

export const CalendarView: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  const { appMode } = useAuthStore();
  const isBusiness = appMode === 'BUSINESS';

  const {
    viewMode,
    selectedDate,
    slots,
    isLoading,
    setViewMode,
    setSelectedDate,
    goToToday,
    navigateForward,
    navigateBackward,
    loadSlots,
    updateSlotStatus,
    addSlot,
    removeSlot,
    rescheduleSlot,
  } = useCalendarStore();

  // Estados de modales administrativos
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<CalendarSlot | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedHourForCreate, setSelectedHourForCreate] = useState<string | undefined>(undefined);

  // Estados para mejoras intuitivas (Recomendaciones 1 y 3)
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showJumpDateModal, setShowJumpDateModal] = useState(false);

  // Estado de notificaciones Toast (Recomendación C)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const triggerToast = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  // Cálculo reactivo de métricas del día seleccionado
  const { appointmentCount, blockCount, completedCount } = useMemo(() => {
    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const daySlots = slots.filter((s) => isSameDay(new Date(s.startTime), selectedDate));

    const appointments = daySlots.filter((s) => s.type === 'appointment' && s.status !== 'cancelled').length;
    const completed = daySlots.filter((s) => s.type === 'appointment' && s.status === 'completed').length;
    const blocks = daySlots.filter((s) => s.type === 'block').length;

    return {
      appointmentCount: appointments,
      completedCount: completed,
      blockCount: blocks,
    };
  }, [slots, selectedDate]);

  // Manejo al pulsar un slot del calendario
  const handleSlotPress = (slot: CalendarSlot) => {
    setSelectedSlotForDetail(slot);
    setShowDetailModal(true);
  };

  // Manejo de Tap-to-Book en hora vacía (Recomendación A)
  const handleEmptyHourPress = (hour: number) => {
    const formatted = `${String(hour).padStart(2, '0')}:00`;
    setSelectedHourForCreate(formatted);
    setShowActionSheet(true);
  };

  // Cambio de estado de cita con feedback Toast (Recomendación C)
  const handleStatusChange = (resourceId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    updateSlotStatus(resourceId, status);
    if (status === 'completed') {
      triggerToast('¡Cita cobrada con éxito! 💰', 'success');
    } else if (status === 'cancelled') {
      triggerToast('Cita cancelada y espacio liberado', 'info');
    }
  };

  // Eliminación / desbloqueo de horario con feedback Toast
  const handleDeleteBlock = (resourceId: string) => {
    removeSlot(resourceId);
    triggerToast('Horario desbloqueado y disponible 🔓', 'success');
  };

  // Manejo de Selección de Cita desde Búsqueda Rápida (Recomendación 1)
  const handleSelectSlotFromSearch = (slot: CalendarSlot) => {
    const slotDate = new Date(slot.startTime);
    setSelectedDate(slotDate);
    setSelectedSlotForDetail(slot);
    setShowDetailModal(true);
    triggerToast(`Cita de ${slot.clientName || 'cliente'} seleccionada 📍`, 'info');
  };

  // Manejo de Selección de Fecha desde Modal Saltar a Fecha (Recomendación 3)
  const handleSelectDateFromJump = (date: Date) => {
    setSelectedDate(date);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    triggerToast(`Navegando al ${day} de ${month} 📅`, 'info');
  };

  // Reprogramación de Cita (Recomendación B)
  const handleReschedule = (resourceId: string, newStartTime: string, newEndTime: string) => {
    rescheduleSlot(resourceId, newStartTime, newEndTime);
    const startHourStr = new Date(newStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    triggerToast(`Cita reprogramada a las ${startHourStr} ⏰`, 'info');
  };

  // Guardado de Cita Manual (Walk-in)
  const handleSaveAppointment = (data: {
    title: string;
    clientName: string;
    clientPhone?: string;
    servicePrice?: string;
    startTime: string;
    endTime: string;
    employeeName?: string;
  }) => {
    const newSlot: CalendarSlot = {
      type: 'appointment',
      resourceId: `apt-walkin-${Date.now()}`,
      title: data.title,
      status: 'confirmed',
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      servicePrice: data.servicePrice,
      startTime: data.startTime,
      endTime: data.endTime,
      employeeName: data.employeeName,
    };
    addSlot(newSlot);
    setSelectedHourForCreate(undefined);
    triggerToast(`Cita agendada para ${data.clientName} 📅`, 'success');
  };

  // Guardado de Bloqueo de Horario (US-008)
  const handleSaveBlock = (data: {
    title: string;
    reason: string;
    startTime: string;
    endTime: string;
  }) => {
    const newBlockSlot: CalendarSlot = {
      type: 'block',
      resourceId: `blk-manual-${Date.now()}`,
      title: data.title,
      status: 'blocked',
      blockReason: data.reason,
      startTime: data.startTime,
      endTime: data.endTime,
      employeeName: 'Todo el personal',
    };
    addSlot(newBlockSlot);
    setSelectedHourForCreate(undefined);
    triggerToast(`Horario bloqueado: ${data.reason} 🔒`, 'warning');
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background.secondary }]}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Encabezado del calendario con controles multiformato y métricas */}
        <CalendarHeader
          selectedDate={selectedDate}
          viewMode={viewMode}
          onPrev={navigateBackward}
          onNext={navigateForward}
          onToday={goToToday}
          onSelectMode={setViewMode}
          onAddPress={isBusiness ? () => setShowActionSheet(true) : undefined}
          onSearchPress={() => setShowSearchModal(true)}
          onTitleDatePress={() => setShowJumpDateModal(true)}
          appointmentCount={isBusiness ? appointmentCount : undefined}
          blockCount={isBusiness ? blockCount : undefined}
          completedCount={isBusiness ? completedCount : undefined}
        />

        {/* Indicador de carga */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.action.primary} />
          </View>
        ) : (
          <View style={styles.viewContainer}>
            {viewMode === 'day' && (
              <DayView
                selectedDate={selectedDate}
                slots={slots}
                onSelectSlot={handleSlotPress}
                onEmptySlotPress={isBusiness ? handleEmptyHourPress : undefined}
              />
            )}

            {viewMode === 'week' && (
              <WeekView
                selectedDate={selectedDate}
                slots={slots}
                onSelectDate={setSelectedDate}
                onSelectSlot={handleSlotPress}
              />
            )}

            {viewMode === 'month' && (
              <MonthView
                selectedDate={selectedDate}
                slots={slots}
                onSelectDate={setSelectedDate}
                onSelectSlot={handleSlotPress}
              />
            )}
          </View>
        )}

        {/* Modal de Detalle y Acciones Administrativas */}
        <AdminSlotDetailModal
          slot={selectedSlotForDetail}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSlotForDetail(null);
          }}
          onStatusChange={handleStatusChange}
          onDeleteBlock={handleDeleteBlock}
          onReschedule={handleReschedule}
        />

        {/* Action Sheet Selector: ¿Nueva Cita o Bloquear Horario? */}
        <Modal
          visible={showActionSheet}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowActionSheet(false);
            setSelectedHourForCreate(undefined);
          }}
        >
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowActionSheet(false);
              setSelectedHourForCreate(undefined);
            }}
          >
            <View
              style={[
                styles.actionSheetContainer,
                {
                  backgroundColor: isDark ? '#11131E' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <View style={styles.actionSheetHandle} />
              <Text style={[styles.actionSheetTitle, { color: colors.text.primary }]}>
                {selectedHourForCreate ? `Acciones a las ${selectedHourForCreate}` : 'Acciones de Agenda'}
              </Text>
              <Text style={[styles.actionSheetSubtitle, { color: colors.text.muted }]}>
                {selectedHourForCreate
                  ? `Elige qué deseas programar para las ${selectedHourForCreate}`
                  : 'Elige la acción que deseas realizar en el calendario'}
              </Text>

              <View style={styles.actionSheetOptions}>
                {/* Opción 1: Registrar Cita Manual */}
                <TouchableOpacity
                  style={[
                    styles.actionOptionItem,
                    {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                      borderColor: 'rgba(99, 102, 241, 0.22)',
                    },
                  ]}
                  onPress={() => {
                    setShowActionSheet(false);
                    setTimeout(() => setShowCreateModal(true), 250);
                  }}
                >
                  <View style={[styles.optionIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                    <Feather name="calendar" size={20} color="#818CF8" />
                  </View>
                  <View style={styles.optionTextBox}>
                    <Text style={[styles.optionTitle, { color: colors.text.primary }]}>
                      Nueva Cita Manual
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.text.muted }]}>
                      {selectedHourForCreate
                        ? `Registrar cliente walk-in a las ${selectedHourForCreate}`
                        : 'Para clientes en el local (walk-in) o llamadas'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.text.muted} />
                </TouchableOpacity>

                {/* Opción 2: Bloquear Horario */}
                <TouchableOpacity
                  style={[
                    styles.actionOptionItem,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                      borderColor: 'rgba(239, 68, 68, 0.22)',
                    },
                  ]}
                  onPress={() => {
                    setShowActionSheet(false);
                    setTimeout(() => setShowBlockModal(true), 250);
                  }}
                >
                  <View style={[styles.optionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Feather name="slash" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.optionTextBox}>
                    <Text style={[styles.optionTitle, { color: colors.text.primary }]}>
                      Bloquear Horario
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.text.muted }]}>
                      {selectedHourForCreate
                        ? `Inhabilitar espacio desde las ${selectedHourForCreate}`
                        : 'Almuerzo, descansos o juntas del personal'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal para Crear Cita Manual */}
        <CreateAppointmentModal
          visible={showCreateModal}
          initialDate={selectedDate}
          initialHour={selectedHourForCreate}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedHourForCreate(undefined);
          }}
          onSave={handleSaveAppointment}
        />

        {/* Modal para Bloquear Horario (US-008) */}
        <BlockSlotModal
          visible={showBlockModal}
          initialDate={selectedDate}
          initialHour={selectedHourForCreate}
          onClose={() => {
            setShowBlockModal(false);
            setSelectedHourForCreate(undefined);
          }}
          onSave={handleSaveBlock}
        />

        {/* Modal de Búsqueda Rápida de Clientes (Recomendación 1) */}
        <QuickSearchModal
          visible={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          slots={slots}
          onSelectSlot={handleSelectSlotFromSearch}
        />

        {/* Modal para Saltar Directamente a una Fecha (Recomendación 3) */}
        <JumpToDateModal
          visible={showJumpDateModal}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDateFromJump}
          onClose={() => setShowJumpDateModal(false)}
        />

        {/* Notificación Flotante Toast (Recomendación C) */}
        <ToastNotification
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onDismiss={() => setToastVisible(false)}
        />
      </View>
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
  viewContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    width: '100%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 10,
  },
  actionSheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  actionSheetSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  actionSheetOptions: {
    gap: 12,
  },
  actionOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
