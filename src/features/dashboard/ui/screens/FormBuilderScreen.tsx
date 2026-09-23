import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '@/shared/lib';

export interface BookingFormConfig {
  requiresProfessional: boolean;
  requiresService: boolean;
  requiresGuestCount: boolean;
  requiresTable: boolean;
  requiresPatientDetails: boolean;
}

export function FormBuilderScreen() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BookingFormConfig>({
    requiresProfessional: false,
    requiresService: false,
    requiresGuestCount: false,
    requiresTable: false,
    requiresPatientDetails: false,
  });

  useEffect(() => {
    if (user?.businessId) {
      fetchCurrentConfig(user.businessId);
    }
  }, [user]);

  const fetchCurrentConfig = async (businessId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/businesses/${businessId}/booking-config`);
      setConfig(res.data?.data || res.data);
    } catch (error) {
      console.warn('Error fetching config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.businessId) return;
    try {
      setSaving(true);
      await apiClient.put(`/businesses/${user.businessId}/booking-config`, {
        formConfig: config
      });
      
      Alert.alert('Éxito', 'Formulario actualizado correctamente.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.warn('Error saving config', error);
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSwitch = (key: keyof BookingFormConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView contentContainerStyle={s.content}>
        
        <Text style={[s.title, { color: colors.text.primary }]}>Construye tu Formulario</Text>
        <Text style={[s.subtitle, { color: colors.text.secondary }]}>
          Activa o desactiva las opciones que quieres pedirle a tus clientes cuando hagan una reservación.
        </Text>

        <View style={s.controlsContainer}>
          <SettingSwitch 
            label="Pedir Especialista / Mesero" 
            desc="Permite al cliente elegir con quién agendar."
            value={config.requiresProfessional} 
            onValueChange={() => toggleSwitch('requiresProfessional')} 
            colors={colors} 
          />
          <SettingSwitch 
            label="Seleccionar Servicio" 
            desc="Muestra la lista de servicios o tratamientos."
            value={config.requiresService} 
            onValueChange={() => toggleSwitch('requiresService')} 
            colors={colors} 
          />
          <SettingSwitch 
            label="Pedir Número de Personas" 
            desc="Ideal para restaurantes o eventos grupales."
            value={config.requiresGuestCount} 
            onValueChange={() => toggleSwitch('requiresGuestCount')} 
            colors={colors} 
          />
          <SettingSwitch 
            label="Preferencia de Mesa/Zona" 
            desc="Permite al cliente elegir zona libre, terraza, etc."
            value={config.requiresTable} 
            onValueChange={() => toggleSwitch('requiresTable')} 
            colors={colors} 
          />
          <SettingSwitch 
            label="Notas Adicionales / Expediente" 
            desc="Muestra un campo para notas médicas o peticiones especiales."
            value={config.requiresPatientDetails} 
            onValueChange={() => toggleSwitch('requiresPatientDetails')} 
            colors={colors} 
          />
        </View>

        <View style={s.previewWrapper}>
          <Text style={[s.previewHeader, { color: colors.text.primary }]}>Vista Previa en Vivo 👀</Text>
          <View style={[s.previewBox, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
            
            <View style={s.previewFormGroup}>
              <Text style={[s.previewLabel, { color: colors.text.primary }]}>📅 Fecha y Hora de Cita</Text>
              <View style={[s.previewInput, { backgroundColor: colors.background.tertiary }]}><Text style={{ color: colors.text.secondary }}>Seleccionada por el cliente</Text></View>
            </View>

            {config.requiresService && (
              <View style={s.previewFormGroup}>
                <Text style={[s.previewLabel, { color: colors.text.primary }]}>💇‍♀️ Servicio deseado</Text>
                <View style={[s.previewInput, { backgroundColor: colors.background.tertiary }]}><Text style={{ color: colors.text.secondary }}>Ej. Corte Clásico</Text></View>
              </View>
            )}

            {config.requiresProfessional && (
              <View style={s.previewFormGroup}>
                <Text style={[s.previewLabel, { color: colors.text.primary }]}>🧑‍💼 Seleccionar Profesional</Text>
                <View style={[s.previewInput, { backgroundColor: colors.background.tertiary }]}><Text style={{ color: colors.text.secondary }}>Ej. Carlos Mendoza</Text></View>
              </View>
            )}

            {(config.requiresGuestCount || config.requiresTable) && (
              <View style={s.previewRow}>
                {config.requiresGuestCount && (
                  <View style={[s.previewFormGroup, { flex: 1 }]}>
                    <Text style={[s.previewLabel, { color: colors.text.primary }]}>👥 Personas</Text>
                    <View style={[s.previewInput, { backgroundColor: colors.background.tertiary }]}><Text style={{ color: colors.text.secondary }}>2</Text></View>
                  </View>
                )}
                {config.requiresTable && (
                  <View style={[s.previewFormGroup, { flex: 1 }]}>
                    <Text style={[s.previewLabel, { color: colors.text.primary }]}>🪑 Preferencia</Text>
                    <View style={[s.previewInput, { backgroundColor: colors.background.tertiary }]}><Text style={{ color: colors.text.secondary }}>Terraza</Text></View>
                  </View>
                )}
              </View>
            )}

            {config.requiresPatientDetails && (
              <View style={s.previewFormGroup}>
                <Text style={[s.previewLabel, { color: colors.text.primary }]}>📝 Notas Adicionales</Text>
                <View style={[s.previewInput, { backgroundColor: colors.background.tertiary, height: 60 }]} />
              </View>
            )}

            <View style={[s.previewSubmitBtn, { backgroundColor: colors.action.primary }]}>
              <Text style={{ color: colors.action.primaryText, fontWeight: '700' }}>Confirmar Reservación</Text>
            </View>

          </View>
        </View>

      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.background.primary, borderTopColor: colors.border.main }]}>
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: colors.action.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={[s.saveBtnText, { color: colors.action.primaryText }]}>Guardar Configuración</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SettingSwitch({ label, desc, value, onValueChange, colors }: any) {
  return (
    <View style={[s.switchRow, { borderBottomColor: colors.border.main }]}>
      <View style={s.switchText}>
        <Text style={[s.switchLabel, { color: colors.text.primary }]}>{label}</Text>
        <Text style={[s.switchDesc, { color: colors.text.secondary }]}>{desc}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange} 
        trackColor={{ true: colors.action.primary, false: '#737373' }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  controlsContainer: { marginBottom: 30 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  switchText: { flex: 1, paddingRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  switchDesc: { fontSize: 13, lineHeight: 18 },
  
  previewWrapper: { marginTop: 10 },
  previewHeader: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  previewBox: { borderWidth: 1, borderRadius: 20, padding: 20, overflow: 'hidden' },
  previewFormGroup: { marginBottom: 14 },
  previewLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  previewInput: { height: 44, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 },
  previewRow: { flexDirection: 'row', gap: 12 },
  previewSubmitBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 }
  ,
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
  saveBtn: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700' }
});
