import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/shared/theme';
import { DynamicBookingForm } from '../components/DynamicBookingForm';
import { BookingFormConfig, BookingFormData } from '../../model/types';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormViewer } from '@/features/dashboard/ui/components/FormViewer';
import type { FormSchema } from '@/features/dashboard/ui/screens/FormBuilderScreen';
import { loadFormSchemaLocally } from '@/features/dashboard/model/formBranding';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5272/api';

export function BookingScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<BookingFormConfig | null>(null);
  const [customSchema, setCustomSchema] = useState<FormSchema | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({});

  useEffect(() => {
    fetchBookingConfig();
  }, [slug]);

  const fetchBookingConfig = async () => {
    try {
      setLoading(true);
      const localSchema = await loadFormSchemaLocally();
      if (localSchema && Array.isArray(localSchema.fields)) {
        setCustomSchema(localSchema);
      }

      if (slug) {
        const res = await fetch(`${API_URL}/businesses/${slug}/booking-config`);
        if (res.ok) {
          const data = await res.json();
          if (data?.formConfig && Array.isArray(data.formConfig.fields)) {
            setCustomSchema(data.formConfig);
          } else if (Array.isArray(data?.fields)) {
            setCustomSchema(data);
          } else {
            setConfig(data);
          }
        }
      }
    } catch (error) {
      console.warn('Error fetching booking config, using local schema fallback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () => {
    Alert.alert(
      'Reserva Confirmada',
      'Tu solicitud de reserva ha sido registrada exitosamente.'
    );
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator
          size="large"
          color={customSchema?.accentColor || colors.action.primary}
        />
      </View>
    );
  }

  // Si el negocio configuró su formulario dinámico con identidad de marca, renderizar FormViewer
  if (customSchema) {
    return (
      <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
        <SafeAreaView style={s.safeArea} edges={['top']}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Feather name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[s.title, { color: colors.text.primary }]} numberOfLines={1}>
              {customSchema.businessName || 'Agendar Cita'}
            </Text>
            <View style={s.backBtn} />
          </View>

          <FormViewer
            schema={customSchema}
            onSubmit={() => {
              Alert.alert(
                '¡Reserva Recibida!',
                `Tu reservación en ${customSchema.businessName || 'el establecimiento'} ha sido enviada.`
              );
            }}
          />
        </SafeAreaView>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={[s.center, { backgroundColor: colors.background.primary }]}>
        <Text style={{ color: colors.text.secondary }}>
          No se pudo cargar la configuración de reservas.
        </Text>
      </View>
    );
  }

  const primaryBrandColor = config.accentColor || colors.action.primary;
  const secondaryBrandColor = config.secondaryColor || primaryBrandColor;

  return (
    <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text.primary }]}>
            {config.businessName || 'Agendar Cita'}
          </Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
          {/* Cabecera corporativa si existe logotipo o colores definidos */}
          {(config.logoUrl || config.accentColor) && (
            <LinearGradient
              colors={[primaryBrandColor, secondaryBrandColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.brandCard}
            >
              {config.logoUrl ? (
                <Image source={{ uri: config.logoUrl }} style={s.brandLogo} />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={s.brandTitle}>
                  {config.businessName || 'Portal de Reservas'}
                </Text>
                <Text style={s.brandSubtitle}>
                  Completa los siguientes datos para realizar tu reserva.
                </Text>
              </View>
            </LinearGradient>
          )}

          {!config.logoUrl && !config.accentColor && (
            <Text style={[s.subtitle, { color: colors.text.secondary }]}>
              Completa los siguientes datos para realizar tu reserva.
            </Text>
          )}

          <DynamicBookingForm
            config={config}
            data={formData}
            onChange={setFormData}
          />

          {/* SIMULACIÓN DE FECHA Y HORA */}
          <View style={s.dateTimeBox}>
            <Text style={[s.label, { color: colors.text.primary }]}>
              Fecha y Hora
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[
                  s.dtBtn,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <Feather name="calendar" size={18} color={primaryBrandColor} />
                <Text style={{ color: colors.text.secondary, marginLeft: 8 }}>
                  Seleccionar Día
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.dtBtn,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <Feather name="clock" size={18} color={primaryBrandColor} />
                <Text style={{ color: colors.text.secondary, marginLeft: 8 }}>
                  Hora
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: primaryBrandColor }]}
            onPress={handleBook}
          >
            <Text style={[s.submitText, { color: '#FFFFFF' }]}>
              Confirmar Reserva
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  dateTimeBox: { marginTop: 20, marginBottom: 40 },
  dtBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '700' },
});
