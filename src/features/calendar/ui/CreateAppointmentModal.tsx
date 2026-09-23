import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useSectorTemplateStore } from '@/features/sector-templates';
import { CANONICAL_SECTOR_CATEGORIES } from '@/features/sector-templates/constants';

interface CreateAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (appointmentData: {
    title: string;
    clientName: string;
    clientPhone?: string;
    servicePrice?: string;
    startTime: string;
    endTime: string;
    employeeName?: string;
  }) => void;
  initialDate?: Date;
  initialHour?: string;
}

const PRESET_SERVICES = [
  { id: 's1', name: 'Corte Clásico', price: '$200 MXN', priceNum: 200, duration: 30, icon: 'scissors-cutting' },
  { id: 's2', name: 'Corte + Barba', price: '$320 MXN', priceNum: 320, duration: 45, icon: 'face-man-shimmer' },
  { id: 's3', name: 'Perfilado de Barba', price: '$150 MXN', priceNum: 150, duration: 30, icon: 'face-man-shimmer' },
  { id: 's4', name: 'Afeitado Tradicional', price: '$220 MXN', priceNum: 220, duration: 45, icon: 'content-cut' },
  { id: 's5', name: 'Ritual Toalla Caliente', price: '$420 MXN', priceNum: 420, duration: 60, icon: 'spa' },
];

const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate = new Date(),
  initialHour,
}) => {
  const { colors, isDark } = useAppTheme();
  const { onboardingResult, selectedCategory } = useSectorTemplateStore();

  // Resuelve dinámicamente los servicios de la plantilla activa o canónica
  const activeServices = useMemo(() => {
    if (onboardingResult?.finalServices && onboardingResult.finalServices.length > 0) {
      return onboardingResult.finalServices.map((s, idx) => ({
        id: `svc-${idx}`,
        name: s.name,
        price: s.price ? `$${s.price} MXN` : '$200 MXN',
        priceNum: s.price ?? 200,
        duration: s.durationMinutes,
        icon: s.name.toLowerCase().includes('barba') ? 'face-man-shimmer' : 'scissors-cutting',
      }));
    }
    const barberCat = CANONICAL_SECTOR_CATEGORIES.find((c) => c.key === 'barberia');
    if (barberCat?.suggestedServices) {
      return barberCat.suggestedServices.map((s, idx) => ({
        id: `barber-${idx}`,
        name: s.name,
        price: `$${s.price ?? 200} MXN`,
        priceNum: s.price ?? 200,
        duration: s.durationMinutes,
        icon: s.name.toLowerCase().includes('barba') ? 'face-man-shimmer' : 'scissors-cutting',
      }));
    }
    return PRESET_SERVICES;
  }, [onboardingResult, selectedCategory]);

  // Resuelve los servicios adicionales (Add-ons) disponibles
  const availableAddons = useMemo(() => {
    if (onboardingResult?.selectedAddons && onboardingResult.selectedAddons.length > 0) {
      return onboardingResult.selectedAddons;
    }
    const barberCat = CANONICAL_SECTOR_CATEGORIES.find((c) => c.key === 'barberia');
    return barberCat?.suggestedAddons ?? [];
  }, [onboardingResult, selectedCategory]);

  // Resuelve los puestos de atención / sillones disponibles
  const availableStations = useMemo(() => {
    if (onboardingResult?.stations && onboardingResult.stations.length > 0) {
      return onboardingResult.stations;
    }
    const barberCat = CANONICAL_SECTOR_CATEGORIES.find((c) => c.key === 'barberia');
    return barberCat?.suggestedStations ?? [];
  }, [onboardingResult, selectedCategory]);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedService, setSelectedService] = useState(activeServices[0] || PRESET_SERVICES[0]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedStationName, setSelectedStationName] = useState<string>(
    availableStations[0]?.name || 'Sillón 1 (Principal)'
  );
  const [customServiceName, setCustomServiceName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [startHour, setStartHour] = useState('10:00');
  const [baseDurationMinutes, setBaseDurationMinutes] = useState(30);

  useEffect(() => {
    if (visible) {
      setClientName('');
      setClientPhone('');
      const firstSvc = activeServices[0] || PRESET_SERVICES[0];
      setSelectedService(firstSvc);
      setSelectedAddonIds([]);
      setSelectedStationName(availableStations[0]?.name || 'Sillón 1 (Principal)');
      setCustomServiceName('');
      setCustomPrice('');
      setBaseDurationMinutes(firstSvc.duration);
      if (initialHour && TIME_OPTIONS.includes(initialHour)) {
        setStartHour(initialHour);
      } else {
        const h = String(initialDate.getHours()).padStart(2, '0');
        const nearest = TIME_OPTIONS.find((t) => t.startsWith(h)) || '10:00';
        setStartHour(nearest);
      }
    }
  }, [visible, initialDate, initialHour, activeServices, availableStations]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Cálculo acumulativo de duración (servicio base + minutos adicionales de extras)
  const totalDuration = useMemo(() => {
    const base = customServiceName.trim() ? baseDurationMinutes : selectedService.duration;
    const extrasDuration = availableAddons
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((acc, a) => acc + a.durationMinutes, 0);
    return base + extrasDuration;
  }, [customServiceName, baseDurationMinutes, selectedService, availableAddons, selectedAddonIds]);

  // Cálculo acumulativo de precio (precio base + costo de extras)
  const totalPriceFormatted = useMemo(() => {
    if (customPrice.trim()) {
      return `$${customPrice.replace('$', '')} MXN`;
    }
    const basePrice = selectedService.priceNum ?? 200;
    const extrasPrice = availableAddons
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((acc, a) => acc + a.price, 0);
    return `$${basePrice + extrasPrice} MXN`;
  }, [customPrice, selectedService, availableAddons, selectedAddonIds]);

  const endHourFormatted = () => {
    const [h, m] = startHour.split(':').map(Number);
    const totalMinutes = h * 60 + m + totalDuration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!clientName.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresa el nombre del cliente.');
      return;
    }

    const d = new Date(initialDate);
    const [hours, minutes] = startHour.split(':').map(Number);
    d.setHours(hours, minutes, 0, 0);

    const end = new Date(d.getTime() + totalDuration * 60 * 1000);

    const extraNames = availableAddons
      .filter((a) => selectedAddonIds.includes(a.id))
      .map((a) => a.name);

    const baseTitle = customServiceName.trim() ? customServiceName.trim() : selectedService.name;
    const title = extraNames.length > 0 ? `${baseTitle} (+ ${extraNames.join(', ')})` : baseTitle;

    onSave({
      title,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      servicePrice: totalPriceFormatted,
      startTime: d.toISOString(),
      endTime: end.toISOString(),
      employeeName: selectedStationName,
    });
    onClose();
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
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <Feather name="calendar" size={18} color="#818CF8" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text.primary }]}>
                  Agendar Cita Manual
                </Text>
                <Text style={[styles.subtitle, { color: colors.text.muted }]}>
                  Para clientes en local (walk-in) o vía telefónica
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Cliente Info Inputs */}
            <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
              Datos del Cliente
            </Text>
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <Feather name="user" size={16} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder="Nombre completo *"
                  placeholderTextColor={colors.text.muted}
                  style={[styles.input, { color: colors.text.primary }]}
                />
              </View>

              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                    marginTop: 8,
                  },
                ]}
              >
                <Feather name="phone" size={16} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  placeholder="Teléfono / WhatsApp (opcional)"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="phone-pad"
                  style={[styles.input, { color: colors.text.primary }]}
                />
              </View>
            </View>

            {/* Servicio Selector */}
            <Text style={[styles.sectionLabel, { color: colors.text.secondary, marginTop: 14 }]}>
              Servicio de Barbería / Atención
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceScroll}>
              {activeServices.map((srv) => {
                const isSelected = selectedService.id === srv.id && !customServiceName;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    onPress={() => {
                      setSelectedService(srv);
                      setCustomServiceName('');
                      setCustomPrice('');
                      setBaseDurationMinutes(srv.duration);
                    }}
                    style={[
                      styles.serviceChip,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(224, 122, 95, 0.18)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? '#E07A5F'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={srv.icon as any}
                      size={18}
                      color={isSelected ? '#E07A5F' : colors.text.muted}
                      style={{ marginRight: 8 }}
                    />
                    <View>
                      <Text
                        style={[
                          styles.serviceChipName,
                          {
                            color: isSelected ? '#E07A5F' : colors.text.primary,
                            fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_500Medium',
                          },
                        ]}
                      >
                        {srv.name}
                      </Text>
                      <Text style={[styles.serviceChipPrice, { color: colors.text.muted }]}>
                        {srv.price} • {srv.duration} min
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selector de Servicios Adicionales (Add-ons de Barbería) */}
            {availableAddons.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.text.secondary, marginTop: 14 }]}>
                  Servicios Adicionales / Extras
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceScroll}>
                  {availableAddons.map((addon) => {
                    const isSelected = selectedAddonIds.includes(addon.id);
                    return (
                      <TouchableOpacity
                        key={addon.id}
                        onPress={() => toggleAddon(addon.id)}
                        style={[
                          styles.serviceChip,
                          {
                            backgroundColor: isSelected
                              ? 'rgba(224, 122, 95, 0.20)'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.04)'
                              : 'rgba(0, 0, 0, 0.03)',
                            borderColor: isSelected
                              ? '#E07A5F'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="star-four-points"
                          size={16}
                          color={isSelected ? '#E07A5F' : colors.text.muted}
                          style={{ marginRight: 6 }}
                        />
                        <View>
                          <Text
                            style={[
                              styles.serviceChipName,
                              {
                                color: isSelected ? '#E07A5F' : colors.text.primary,
                                fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_500Medium',
                              },
                            ]}
                          >
                            {addon.name}
                          </Text>
                          <Text style={[styles.serviceChipPrice, { color: colors.text.muted }]}>
                            +${addon.price} MXN • +{addon.durationMinutes}m
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Asignación de Sillón / Barbero */}
            {availableStations.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.text.secondary, marginTop: 14 }]}>
                  Sillón / Barbero Asignado
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceScroll}>
                  {availableStations.map((station) => {
                    const isSelected = selectedStationName === station.name;
                    return (
                      <TouchableOpacity
                        key={station.id}
                        onPress={() => setSelectedStationName(station.name)}
                        style={[
                          styles.serviceChip,
                          {
                            backgroundColor: isSelected
                              ? 'rgba(224, 122, 95, 0.20)'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.04)'
                              : 'rgba(0, 0, 0, 0.03)',
                            borderColor: isSelected
                              ? '#E07A5F'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="chair-rolling"
                          size={16}
                          color={isSelected ? '#E07A5F' : colors.text.muted}
                          style={{ marginRight: 6 }}
                        />
                        <View>
                          <Text
                            style={[
                              styles.serviceChipName,
                              {
                                color: isSelected ? '#E07A5F' : colors.text.primary,
                                fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_500Medium',
                              },
                            ]}
                          >
                            {station.name}
                          </Text>
                          <Text style={[styles.serviceChipPrice, { color: colors.text.muted }]}>
                            {station.assignedStaffName || 'Atención general'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Hora y Duración */}
            <Text style={[styles.sectionLabel, { color: colors.text.secondary, marginTop: 14 }]}>
              Horario de Inicio
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
                          ? '#E07A5F'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? '#E07A5F'
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
              Duración Base
            </Text>
            <View style={styles.durationRow}>
              {[30, 45, 60, 90, 120].map((mins) => {
                const isSelected = baseDurationMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setBaseDurationMinutes(mins)}
                    style={[
                      styles.durationBtn,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(224, 122, 95, 0.18)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? '#E07A5F'
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
                          color: isSelected ? '#E07A5F' : colors.text.secondary,
                          fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        },
                      ]}
                    >
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Resumen del Horario */}
            <View
              style={[
                styles.rangeSummary,
                {
                  backgroundColor: isDark ? 'rgba(224, 122, 95, 0.08)' : 'rgba(224, 122, 95, 0.05)',
                  borderColor: 'rgba(224, 122, 95, 0.25)',
                },
              ]}
            >
              <Feather name="clock" size={15} color="#E07A5F" style={{ marginRight: 8 }} />
              <Text style={[styles.rangeSummaryText, { color: colors.text.primary }]}>
                Cita de <Text style={{ fontFamily: 'Inter_700Bold', color: '#E07A5F' }}>{startHour}</Text> a{' '}
                <Text style={{ fontFamily: 'Inter_700Bold', color: '#E07A5F' }}>{endHourFormatted()}</Text> ({totalDuration} min) • {totalPriceFormatted}
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
              style={[styles.saveBtn, { backgroundColor: '#6366F1' }]}
            >
              <Feather name="calendar" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Guardar Cita</Text>
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
  inputGroup: {
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  serviceScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceChipName: {
    fontSize: 13,
  },
  serviceChipPrice: {
    fontSize: 11,
    marginTop: 1,
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
