import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { BookingFormConfig, BookingFormData } from '../../model/types';

interface Props {
  config: BookingFormConfig;
  data: BookingFormData;
  onChange: (data: BookingFormData) => void;
}

export function DynamicBookingForm({ config, data, onChange }: Props) {
  const { colors, isDark } = useAppTheme();

  const updateData = (updates: Partial<BookingFormData>) => {
    onChange({ ...data, ...updates });
  };

  return (
    <View style={s.container}>
      {/* ── SERVICIOS ── */}
      {config.requiresService && (
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.text.primary }]}>Servicio a agendar</Text>
          <TouchableOpacity style={[s.dropdown, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
            <Text style={{ color: data.serviceId ? colors.text.primary : colors.text.secondary }}>
              {data.serviceId ? 'Servicio Seleccionado' : 'Seleccionar Servicio...'}
            </Text>
            <Feather name="chevron-down" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── PROFESIONALES / DOCTORES ── */}
      {config.requiresProfessional && (
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.text.primary }]}>
            {config.requiresPatientDetails ? 'Doctor/Especialista' : 'Profesional / Staff'}
          </Text>
          <TouchableOpacity style={[s.dropdown, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
            <Text style={{ color: data.professionalId ? colors.text.primary : colors.text.secondary }}>
              {data.professionalId ? 'Profesional Seleccionado' : 'Seleccionar Profesional...'}
            </Text>
            <Feather name="chevron-down" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── RESTAURANTES: INVITADOS ── */}
      {config.requiresGuestCount && (
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.text.primary }]}>Número de personas</Text>
          <View style={s.counterRow}>
            <TouchableOpacity 
              style={[s.counterBtn, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}
              onPress={() => updateData({ guestCount: Math.max(1, (data.guestCount || 1) - 1) })}
            >
              <Feather name="minus" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            
            <Text style={[s.counterText, { color: colors.text.primary }]}>
              {data.guestCount || 1}
            </Text>
            
            <TouchableOpacity 
              style={[s.counterBtn, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}
              onPress={() => updateData({ guestCount: (data.guestCount || 1) + 1 })}
            >
              <Feather name="plus" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── RESTAURANTES: PREFERENCIA DE MESA ── */}
      {config.requiresTable && (
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.text.primary }]}>Preferencia de Mesa (Opcional)</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.background.secondary, borderColor: colors.border.main, color: colors.text.primary }]}
            placeholder="Ej: Terraza, Cerca de la ventana..."
            placeholderTextColor={colors.text.secondary}
            value={data.tablePreference}
            onChangeText={(text) => updateData({ tablePreference: text })}
          />
        </View>
      )}

      {/* ── SALUD: DETALLES DEL PACIENTE ── */}
      {config.requiresPatientDetails && (
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.text.primary }]}>Motivo de Consulta / Notas Médicas</Text>
          <TextInput
            style={[s.input, s.textArea, { backgroundColor: colors.background.secondary, borderColor: colors.border.main, color: colors.text.primary }]}
            placeholder="Describe brevemente tus síntomas o motivo de visita..."
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
            value={data.patientNotes}
            onChangeText={(text) => updateData({ patientNotes: text })}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: '100%' },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top'
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  counterText: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center'
  }
});
