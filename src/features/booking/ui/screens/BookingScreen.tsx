import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme';
import { DynamicBookingForm } from '../components/DynamicBookingForm';
import { BookingFormConfig, BookingFormData } from '../../model/types';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5272/api';

export function BookingScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useAppTheme();
  
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<BookingFormConfig | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({});

  useEffect(() => {
    if (slug) {
      fetchBookingConfig();
    }
  }, [slug]);

  const fetchBookingConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/businesses/${slug}/booking-config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.warn('Error fetching booking config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () => {
    // Aquí irá la lógica para guardar la cita en el futuro
    console.log('Reservando con datos:', formData);
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  if (!config) {
    return (
      <View style={[s.center, { backgroundColor: colors.background.primary }]}>
        <Text style={{ color: colors.text.secondary }}>No se pudo cargar la configuración de reservas.</Text>
      </View>
    );
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text.primary }]}>Agendar Cita</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
          <Text style={[s.subtitle, { color: colors.text.secondary }]}>
            Completa los siguientes datos para realizar tu reserva.
          </Text>

          <DynamicBookingForm 
            config={config} 
            data={formData} 
            onChange={setFormData} 
          />

          {/* SIMULACIÓN DE FECHA Y HORA */}
          <View style={s.dateTimeBox}>
            <Text style={[s.label, { color: colors.text.primary }]}>Fecha y Hora</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={[s.dtBtn, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
                <Feather name="calendar" size={18} color={colors.text.secondary} />
                <Text style={{ color: colors.text.secondary, marginLeft: 8 }}>Seleccionar Día</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.dtBtn, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
                <Feather name="clock" size={18} color={colors.text.secondary} />
                <Text style={{ color: colors.text.secondary, marginLeft: 8 }}>Hora</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: colors.action.primary }]}
            onPress={handleBook}
          >
            <Text style={[s.submitText, { color: colors.action.primaryText }]}>Confirmar Reserva</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  dateTimeBox: { marginTop: 20, marginBottom: 40 },
  dtBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  submitBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 16, fontWeight: '700' }
});
