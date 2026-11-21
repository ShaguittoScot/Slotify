import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailDto } from '../../types';
import type { SectorConfig } from '../../model/sector';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

interface BusinessLocationHoursSectionProps {
  business: BusinessDetailDto;
  sector: SectorConfig;
  accentColor: string;
}

const DEFAULT_SCHEDULE = [
  { day: 'Lunes a Viernes', hours: '09:00 - 20:00' },
  { day: 'Sábado', hours: '09:00 - 18:00' },
  { day: 'Domingo', hours: 'Previa reservación' },
];

export function BusinessLocationHoursSection({
  business,
  sector,
  accentColor,
}: BusinessLocationHoursSectionProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessDetailStyles(colors, accentColor);

  const hasPhone = Boolean(business.phone && business.phone.trim().length > 0);
  const address = business.address?.trim() || business.city?.trim() || 'Dirección disponible al reservar';
  const hasMinAdvance = typeof business.minAdvanceHours === 'number' && business.minAdvanceHours > 0;
  const hasMaxAdvance = typeof business.maxAdvanceDays === 'number' && business.maxAdvanceDays > 0;

  const handleOpenMaps = () => {
    const query = encodeURIComponent(`${business.name} ${address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      });
    }
  };

  const handleCall = () => {
    if (business.phone) {
      const cleanPhone = business.phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
    }
  };

  return (
    <View style={styles.sectionCard}>
      {/* ── UBICACIÓN ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ubicación y Contacto</Text>
        <Text style={styles.sectionSubtitle}>
          Dirección física, horarios de servicio y medios de contacto
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
        <Feather name="map-pin" size={16} color={accentColor} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text.primary }}>
            {business.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 18 }}>
            {address}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.locationActionBtn}
        onPress={handleOpenMaps}
        activeOpacity={0.7}
      >
        <Feather name="navigation" size={14} color={colors.isDark ? '#A5B4FC' : accentColor} />
        <Text style={styles.locationActionBtnText}>Cómo llegar en mapas</Text>
      </TouchableOpacity>

      {/* ── HORARIOS ── */}
      <View style={styles.scheduleContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text.primary }}>
            {sector.hoursTitle}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#10B981' }}>
              Abierto hoy
            </Text>
          </View>
        </View>

        {DEFAULT_SCHEDULE.map((item, idx) => (
          <View key={idx} style={styles.scheduleRow}>
            <Text style={styles.scheduleDayText}>{item.day}</Text>
            <Text style={styles.scheduleHoursText}>{item.hours}</Text>
          </View>
        ))}
      </View>

      {/* ── POLÍTICAS DE RESERVA ── */}
      {(hasMinAdvance || hasMaxAdvance) && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border.light, gap: 6 }}>
          {hasMinAdvance && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="clock" size={13} color={colors.text.muted} />
              <Text style={{ fontSize: 12.5, color: colors.text.muted }}>
                Anticipación mínima:{' '}
                <Text style={{ fontWeight: '700', color: colors.text.secondary }}>
                  {business.minAdvanceHours} {business.minAdvanceHours === 1 ? 'hora antes' : 'horas antes'}
                </Text>
              </Text>
            </View>
          )}

          {hasMaxAdvance && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="calendar" size={13} color={colors.text.muted} />
              <Text style={{ fontSize: 12.5, color: colors.text.muted }}>
                Agenda abierta:{' '}
                <Text style={{ fontWeight: '700', color: colors.text.secondary }}>
                  Hasta {business.maxAdvanceDays} días de anticipación
                </Text>
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── CONTACTO TELEFÓNICO ── */}
      {hasPhone && (
        <View style={styles.contactRow}>
          <View style={styles.contactInfoCol}>
            <Text style={styles.contactLabel}>Teléfono de atención</Text>
            <Text style={styles.contactPhone}>{business.phone}</Text>
          </View>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Feather name="phone-call" size={13} color="#10B981" />
            <Text style={styles.callBtnText}>Llamar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
