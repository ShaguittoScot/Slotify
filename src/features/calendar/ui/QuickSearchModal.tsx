import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CalendarSlot } from '@/shared/types';
import { useAppTheme } from '@/shared/theme';

interface QuickSearchModalProps {
  visible: boolean;
  onClose: () => void;
  slots: CalendarSlot[];
  onSelectSlot: (slot: CalendarSlot) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  confirmed: {
    label: 'Confirmada',
    bg: 'rgba(99, 102, 241, 0.12)',
    text: '#818CF8',
    dot: '#818CF8',
  },
  pending: {
    label: 'Pendiente',
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#F59E0B',
    dot: '#F59E0B',
  },
  completed: {
    label: 'Cobrada',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#10B981',
    dot: '#10B981',
  },
  cancelled: {
    label: 'Cancelada',
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#EF4444',
    dot: '#EF4444',
  },
};

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  visible,
  onClose,
  slots,
  onSelectSlot,
}) => {
  const { colors, isDark } = useAppTheme();
  const [query, setQuery] = useState('');

  // Filtrado de citas basado en el texto de búsqueda
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const appointments = slots.filter((s) => s.type === 'appointment');

    if (!q) {
      // Si no hay búsqueda, mostramos las citas ordenadas cronológicamente
      return appointments.slice(0, 10);
    }

    return appointments.filter((s) => {
      const matchClient = s.clientName?.toLowerCase().includes(q);
      const matchTitle = s.title?.toLowerCase().includes(q);
      const matchNotes = s.notes?.toLowerCase().includes(q);
      return matchClient || matchTitle || matchNotes;
    });
  }, [slots, query]);

  const handleSelect = (slot: CalendarSlot) => {
    onSelectSlot(slot);
    onClose();
    setQuery('');
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const formatSlotDate = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const day = start.getDate();
    const month = start.toLocaleDateString('es-ES', { month: 'short' });
    const timeStart = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeEnd = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} • ${timeStart} - ${timeEnd}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header con Barra de Búsqueda */}
          <View style={styles.searchHeader}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Feather name="search" size={17} color={colors.text.muted} style={styles.searchIcon} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder="Buscar cliente, servicio o nota..."
                placeholderTextColor={colors.text.muted}
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                  <Feather name="x" size={15} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={[styles.cancelText, { color: colors.text.muted }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* Subtítulo o contador de resultados */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.text.muted }]}>
              {query.trim()
                ? `${results.length} ${results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`
                : 'Citas recientes y próximas'}
            </Text>
          </View>

          {/* Lista de Resultados */}
          <FlatList
            data={results}
            keyExtractor={(item) => item.resourceId}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const statusCfg = STATUS_CONFIG[item.status || 'confirmed'] || STATUS_CONFIG.confirmed;

              return (
                <TouchableOpacity
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  {/* Avatar o icono de cliente */}
                  <View
                    style={[
                      styles.avatarBadge,
                      {
                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.10)',
                      },
                    ]}
                  >
                    <Feather name="user" size={15} color="#818CF8" />
                  </View>

                  {/* Datos de la cita */}
                  <View style={styles.infoCol}>
                    <Text
                      style={[styles.clientName, { color: colors.text.primary }]}
                      numberOfLines={1}
                    >
                      {item.clientName || 'Cliente sin nombre'}
                    </Text>
                    <Text
                      style={[styles.serviceTitle, { color: colors.text.secondary }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.timeText, { color: colors.text.muted }]}>
                      {formatSlotDate(item.startTime, item.endTime)}
                    </Text>
                  </View>

                  {/* Estado y chevron */}
                  <View style={styles.rightCol}>
                    <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                      <Text style={[styles.statusLabel, { color: statusCfg.text }]}>
                        {statusCfg.label}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.text.muted} style={{ marginTop: 6 }} />
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather
                  name={query ? 'search' : 'calendar'}
                  size={36}
                  color={colors.text.muted}
                  style={{ opacity: 0.5, marginBottom: 12 }}
                />
                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                  {query ? 'Sin resultados' : 'No hay citas registradas'}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.text.muted }]}>
                  {query
                    ? `No encontramos citas asociadas a "${query}". Verifica el nombre o el servicio.`
                    : 'Cuando agendes citas en tu calendario aparecerán aquí para acceso rápido.'}
                </Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    maxHeight: '82%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  metaRow: {
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  listContent: {
    paddingBottom: 16,
    gap: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  serviceTitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
});
