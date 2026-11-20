import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailServiceDto } from '../../types';
import { BusinessServiceCard } from './BusinessServiceCard';
import { createBusinessServiceStyles } from '../styles/businessService.styles';

interface BusinessServicesSectionProps {
  services: BusinessDetailServiceDto[];
  accentColor: string;
}

export function BusinessServicesSection({
  services,
  accentColor,
}: BusinessServicesSectionProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessServiceStyles(colors, accentColor);

  // Filtrar exclusivamente los servicios activos
  const activeServices = (services || []).filter((s) => s.isActive !== false);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Servicios disponibles</Text>
          {activeServices.length > 0 && (
            <View style={styles.serviceCountBadge}>
              <Text style={styles.serviceCountText}>
                {activeServices.length}{' '}
                {activeServices.length === 1 ? 'servicio' : 'servicios'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.sectionSubtitle}>
          Consulta las opciones ofrecidas antes de iniciar tu reserva.
        </Text>
      </View>

      {activeServices.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Feather name="inbox" size={20} color={colors.text.muted} />
          </View>
          <Text style={styles.emptyTitle}>Sin servicios activos</Text>
          <Text style={styles.emptyDescription}>
            Este establecimiento aún no tiene servicios disponibles para agendar.
          </Text>
        </View>
      ) : (
        <View style={styles.servicesList}>
          {activeServices.map((service) => (
            <BusinessServiceCard
              key={service.id}
              service={service}
              accentColor={accentColor}
            />
          ))}
        </View>
      )}
    </View>
  );
}
