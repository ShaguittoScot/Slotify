import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme';
import { searchClientOptions, type ClientOption } from '@/features/clients/api';
import { useSectorTemplateStore } from '@/features/sector-templates';
import { CANONICAL_SECTOR_CATEGORIES } from '@/features/sector-templates/constants';
import type { CalendarEmployee } from '../api';
import type { AppointmentClient } from '../model';
import { formatBusinessHour, scheduleInstant } from '../model/businessTime';

export interface ManualAppointment {
  title: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  businessClientId?: string;
  agreedTotal: number;
  startTime: string;
  endTime: string;
  employeeId?: string;
  employeeName?: string;
}

interface CreateAppointmentModalProps {
  visible: boolean;
  employees: CalendarEmployee[];
  scopeKey: string;
  timeZone: string;
  initialDate: Date;
  initialHour?: string;
  initialClient?: AppointmentClient;
  onClose: () => void;
  onSave: (appointment: ManualAppointment) => Promise<void>;
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(8 + Math.floor(index / 2)).padStart(2, '0') + (index % 2 ? ':30' : ':00'));
const DURATIONS = [15, 30, 45, 60, 90, 120];
const ACCENT = '#6366F1';
const CUSTOM_SERVICE = -1;

function appointmentPhone(value?: string | null) {
  const phone = value?.trim() ?? '';
  return phone.length <= CLIENT_PHONE_MAX_LENGTH ? phone : '';
}

type Section = 'service' | 'extras' | 'employee' | 'time' | null;

function Option({ label, detail, selected, onPress, expandable }: {
  label: string;
  detail?: string;
  selected?: boolean;
  onPress: () => void;
  expandable?: boolean;
}) {
  const { colors, isDark } = useAppTheme();
  const accent = isDark ? '#A5B4FC' : '#4F46E5';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={expandable ? { expanded: selected } : { selected }}
      onPress={onPress}
      style={[
        s.option,
        {
          backgroundColor: selected ? (isDark ? '#252347' : '#EEF2FF') : colors.background.primary,
          borderColor: selected ? ACCENT : colors.border.main,
        },
      ]}
    >
      <View style={s.optionText}>
        <Text style={[s.optionLabel, { color: colors.text.primary }]}>{label}</Text>
        {detail ? <Text style={[s.hint, { color: colors.text.secondary }]}>{detail}</Text> : null}
      </View>
      <Feather
        name={expandable ? (selected ? 'chevron-up' : 'chevron-down') : (selected ? 'check-circle' : 'chevron-right')}
        size={17}
        color={selected ? accent : colors.text.muted}
      />
    </TouchableOpacity>
  );
}

export function CreateAppointmentModal({
  visible, employees, scopeKey, timeZone, initialDate, initialHour, initialClient, onClose, onSave,
}: CreateAppointmentModalProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { onboardingResult, selectedCategory } = useSectorTemplateStore();
  const category = onboardingResult?.sectorCategory ?? selectedCategory ??
    CANONICAL_SECTOR_CATEGORIES.find((item) => item.key === 'barberia');
  const services = onboardingResult?.finalServices ?? category?.suggestedServices ?? [];
  const extras = onboardingResult?.selectedAddons ?? category?.suggestedAddons ?? [];
  const accent = isDark ? '#A5B4FC' : '#4F46E5';

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedClient, setSelectedClient] = useState<AppointmentClient>();
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<ClientOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [serviceIndex, setServiceIndex] = useState(CUSTOM_SERVICE);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [startHour, setStartHour] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [section, setSection] = useState<Section>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultServiceDuration = services[0]?.durationMinutes ?? 30;
  const hasServices = services.length > 0;
  useEffect(() => {
    if (!visible) return;
    setClientName(initialClient?.fullName ?? '');
    setClientPhone(appointmentPhone(initialClient?.phone));
    setSelectedClient(initialClient);
    setSearching(false);
    setServiceIndex(hasServices ? 0 : CUSTOM_SERVICE);
    setCustomName('');
    setCustomPrice('');
    setExtraIds([]);
    setEmployeeId('');
    setStartHour(initialHour ?? '10:00');
    setDuration(defaultServiceDuration);
    setSection(null);
    setError(null);
  }, [visible, scopeKey, initialClient, initialHour, defaultServiceDuration, hasServices]);

  const search = visible && searching && !selectedClient ? clientName.trim() : '';
  useEffect(() => {
    setOptions([]);
    setSearchError(false);
    setIsSearching(false);
    if (search.length < 2) return;
    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const matches = await searchClientOptions(search, controller.signal);
        if (!controller.signal.aborted) setOptions(matches);
      } catch {
        if (!controller.signal.aborted) setSearchError(true);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, scopeKey]);

  const chooseClient = (client: ClientOption) => {
    setClientName(client.fullName);
    setClientPhone(appointmentPhone(client.phone));
    setSelectedClient({ businessClientId: client.id, ...client });
    setSearching(false);
    setError(null);
    Keyboard.dismiss();
  };

  const updateClientName = (name: string) => {
    if (selectedClient && clientPhone === appointmentPhone(selectedClient.phone)) setClientPhone('');
    setSelectedClient(undefined);
    setClientName(name);
    setSearching(true);
  };

  const service = services[serviceIndex];
  const custom = !service;
  const selectedExtras = extras.filter((extra) => extraIds.includes(extra.id));
  const totalDuration = duration + selectedExtras.reduce((total, extra) => total + extra.durationMinutes, 0);
  const rawPrice = customPrice.trim();
  const basePrice = custom
    ? (/^\d+([.,]\d{1,2})?$/.test(rawPrice) ? Number(rawPrice.replace(',', '.')) : NaN)
    : service.price ?? 0;
  const agreedTotal = (Math.round(basePrice * 100) +
    selectedExtras.reduce((total, extra) => total + Math.round(extra.price * 100), 0)) / 100;
  const start = scheduleInstant(initialDate, startHour, timeZone);
  const end = start ? new Date(start.getTime() + totalDuration * 60_000) : null;
  const employee = employees.find((item) => item.id === employeeId);
  const dates = initialDate.toLocaleDateString('es-MX', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
  const amount = Number.isFinite(agreedTotal)
    ? agreedTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
    : '—';
  const times = [...new Set([...TIME_OPTIONS, startHour])].sort();
  const durations = [...new Set([...DURATIONS, duration])].sort((a, b) => a - b);

  const toggleSection = (next: Section) => {
    setSearching(false);
    Keyboard.dismiss();
    setSection((current) => current === next ? null : next);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const title = service?.name ?? customName.trim();
    if (!clientName.trim()) return setError('Escribe o selecciona el nombre del cliente.');
    if (clientPhone.trim().length > CLIENT_PHONE_MAX_LENGTH) {
      return setError(`El teléfono de la cita admite hasta ${CLIENT_PHONE_MAX_LENGTH} caracteres.`);
    }
    if (!title) return setError('Escribe el nombre del servicio.');
    if (!Number.isFinite(agreedTotal) || agreedTotal < 0 || agreedTotal > 99999999.99) {
      return setError('Ingresa un importe válido de hasta dos decimales.');
    }
    if (!start || !end) return setError('Esa hora no existe en la zona del negocio. Elige otra.');
    if (!Number.isInteger(totalDuration) || totalDuration < 1) return setError('Selecciona una duración válida.');

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        title: [title, ...selectedExtras.map((extra) => extra.name)].join(' + '),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: selectedClient?.email || undefined,
        businessClientId: selectedClient?.businessClientId,
        agreedTotal,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        employeeId: employee?.id,
        employeeName: employee?.name,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la cita.');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldStyle = [s.field, { backgroundColor: colors.background.primary, borderColor: colors.border.main, color: colors.text.primary }];
  const close = () => { if (!isSaving) onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={[s.overlay, { backgroundColor: colors.background.backdrop }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.sheet, { backgroundColor: colors.background.secondary, paddingBottom: Math.max(14, insets.bottom) }]}>
          <View style={[s.handle, { backgroundColor: colors.border.strong }]} />
          <View style={s.header}>
            <View style={[s.headerIcon, { backgroundColor: isDark ? '#252347' : '#EEF2FF' }]}>
              <Feather name="calendar" size={20} color={accent} />
            </View>
            <View style={s.headerText}>
              <Text style={[s.title, { color: colors.text.primary }]}>Agendar cita</Text>
              <Text style={[s.hint, { color: colors.text.secondary }]}>{dates} · Hora del negocio</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button" accessibilityLabel="Cerrar agenda manual" disabled={isSaving}
              onPress={close} style={[s.close, { backgroundColor: colors.background.primary, borderColor: colors.border.main }]}
            >
              <Feather name="x" size={19} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            <View style={s.section}>
              <Text style={[s.label, { color: colors.text.primary }]}>Cliente</Text>
              <TextInput
                accessibilityLabel="Nombre del cliente" testID="appointment-client-name" value={clientName}
                onChangeText={updateClientName} onFocus={() => setSearching(true)} maxLength={150}
                placeholder="Buscar cliente o escribir nombre" placeholderTextColor={colors.text.muted} style={fieldStyle}
              />
              {selectedClient?.businessClientId ? (
                <Text style={[s.hint, { color: accent }]}>Vinculado a la cartera</Text>
              ) : null}
              {isSearching ? <ActivityIndicator color={ACCENT} /> : null}
              {searchError ? <Text style={[s.hint, { color: colors.text.secondary }]}>No se pudo consultar la cartera. Puedes escribir el nombre.</Text> : null}
              {options.map((option) => (
                <Option key={option.id} label={option.fullName} detail={option.phone || option.email} onPress={() => chooseClient(option)} />
              ))}
              <TextInput
                accessibilityLabel="Teléfono del cliente" value={clientPhone} onChangeText={setClientPhone}
                onFocus={() => setSearching(false)} placeholder="Teléfono (opcional)" keyboardType="phone-pad"
                placeholderTextColor={colors.text.muted} style={fieldStyle}
              />
              {selectedClient?.businessClientId && !clientPhone &&
                (selectedClient.phone?.trim().length ?? 0) > CLIENT_PHONE_MAX_LENGTH && (
                <Text style={[s.hint, { color: colors.text.secondary }]}>
                  El teléfono de la ficha supera el límite de la cita. Puedes guardarla vinculada o escribir otro número.
                </Text>
              )}
            </View>

            <View style={s.section}>
              <Text style={[s.label, { color: colors.text.primary }]}>Servicio</Text>
              {hasServices && <Option label={service?.name ?? 'Otro servicio'} expandable selected={section === 'service'} onPress={() => toggleSection('service')} />}
              {section === 'service' && (
                <>
                  {services.map((item, index) => (
                    <Option
                      key={index} label={item.name} detail={'$' + (item.price ?? 0) + ' · ' + item.durationMinutes + ' min'}
                      selected={index === serviceIndex}
                      onPress={() => { setServiceIndex(index); setDuration(item.durationMinutes); setSection(null); }}
                    />
                  ))}
                  {hasServices && (
                    <Option label="Otro servicio" selected={custom} onPress={() => { setServiceIndex(CUSTOM_SERVICE); setSection(null); }} />
                  )}
                </>
              )}
              {custom && (
                <>
                  <TextInput accessibilityLabel="Nombre del servicio" value={customName} onChangeText={setCustomName} placeholder="Nombre del servicio" placeholderTextColor={colors.text.muted} style={fieldStyle} />
                  <TextInput accessibilityLabel="Precio base" value={customPrice} onChangeText={setCustomPrice} placeholder="Precio base" keyboardType="decimal-pad" placeholderTextColor={colors.text.muted} style={fieldStyle} />
                </>
              )}
              {extras.length > 0 && (
                <Option label={extraIds.length ? 'Extras (' + extraIds.length + ')' : 'Extras (opcional)'} expandable selected={section === 'extras'} onPress={() => toggleSection('extras')} />
              )}
              {section === 'extras' && extras.map((extra) => (
                <Option
                  key={extra.id} label={extra.name} detail={'+$' + extra.price + ' · +' + extra.durationMinutes + ' min'}
                  selected={extraIds.includes(extra.id)}
                  onPress={() => setExtraIds((ids) => ids.includes(extra.id) ? ids.filter((id) => id !== extra.id) : [...ids, extra.id])}
                />
              ))}
            </View>

            <View style={s.section}>
              <Text style={[s.label, { color: colors.text.primary }]}>Horario</Text>
              <Option label={'Inicio · ' + startHour} expandable selected={section === 'time'} onPress={() => toggleSection('time')} />
              {section === 'time' && (
                <View style={s.chips}>
                  {times.map((hour) => (
                    <TouchableOpacity key={hour} accessibilityRole="button" accessibilityState={{ selected: hour === startHour }}
                      style={[s.chip, { backgroundColor: colors.background.primary, borderColor: hour === startHour ? ACCENT : colors.border.main }]}
                      onPress={() => { setStartHour(hour); setSection(null); }}>
                      <Text style={{ color: hour === startHour ? accent : colors.text.primary }}>{hour}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={[s.hint, { color: colors.text.secondary }]}>Duración base</Text>
              <View style={s.chips}>
                {durations.map((minutes) => (
                  <TouchableOpacity key={minutes} accessibilityRole="button" accessibilityState={{ selected: minutes === duration }}
                    style={[s.chip, { backgroundColor: colors.background.primary, borderColor: minutes === duration ? ACCENT : colors.border.main }]}
                    onPress={() => setDuration(minutes)}>
                    <Text style={{ color: minutes === duration ? accent : colors.text.primary }}>{minutes} min</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {employees.length > 0 && (
                <Option label={employee?.name ?? 'Personal · Sin asignar'} expandable selected={section === 'employee'} onPress={() => toggleSection('employee')} />
              )}
              {section === 'employee' && [{ id: '', name: 'Sin asignar' }, ...employees].map((item) => (
                <Option key={item.id} label={item.name} selected={item.id === employeeId}
                  onPress={() => { setEmployeeId(item.id); setSection(null); }} />
              ))}
            </View>
          </ScrollView>

          <View style={[s.footer, { borderTopColor: colors.border.main }]}>
            <View style={s.summary}>
              <Text style={[s.hint, { color: colors.text.secondary }]}>
                {end ? startHour + '–' + formatBusinessHour(end, timeZone) + ' · ' + totalDuration + ' min' : 'Selecciona una hora válida'}
              </Text>
              <Text style={[s.label, { color: colors.text.primary }]}>{amount}</Text>
            </View>
            {error ? <Text accessibilityRole="alert" style={[s.error, { color: colors.status.error, backgroundColor: colors.status.errorBg }]}>{error}</Text> : null}
            <TouchableOpacity
              accessibilityRole="button" testID="save-manual-appointment" onPress={handleSave} disabled={isSaving}
              style={[s.save, { backgroundColor: ACCENT, opacity: isSaving ? 0.65 : 1 }]}
            >
              {isSaving ? <ActivityIndicator color="#FFF" /> : <Feather name="calendar" color="#FFF" size={18} />}
              <Text style={s.saveText}>Guardar cita</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 560, maxHeight: '94%', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 9 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 12 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 20, fontWeight: '800' },
  close: { width: 44, height: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 18, paddingBottom: 16, gap: 16 },
  section: { gap: 7 },
  label: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 17 },
  field: { minHeight: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  optionText: { flex: 1, minWidth: 0, gap: 2 },
  optionLabel: { fontSize: 14, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 40, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, borderWidth: 1, borderRadius: 10 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 18, paddingTop: 10, gap: 8 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  error: { borderRadius: 8, fontSize: 13, padding: 8 },
  save: { minHeight: 46, borderRadius: 13, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
import { CLIENT_PHONE_MAX_LENGTH } from '@/shared/lib/constants';
