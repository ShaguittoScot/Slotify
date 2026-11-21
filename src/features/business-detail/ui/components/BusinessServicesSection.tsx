import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailServiceDto } from '../../types';
import type { SectorConfig } from '../../model/sector';
import { BusinessServiceCard } from './BusinessServiceCard';
import { createBusinessServiceStyles } from '../styles/businessService.styles';

interface BusinessServicesSectionProps {
  services: BusinessDetailServiceDto[];
  sector: SectorConfig;
  accentColor: string;
}

export function BusinessServicesSection({
  services,
  sector,
  accentColor,
}: BusinessServicesSectionProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessServiceStyles(colors, accentColor);

  // Filtrar exclusivamente servicios activos
  const activeServices = (services || []).filter((s) => s.isActive !== false);

  const getUnitLabel = (count: number) => {
    if (sector.type === 'restaurant') {
      return count === 1 ? 'opción' : 'opciones';
    }
    if (sector.type === 'health_clinic') {
      return count === 1 ? 'especialidad' : 'especialidades';
    }
    return count === 1 ? 'servicio' : 'servicios';
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{sector.catalogTitle}</Text>
          {activeServices.length > 0 && (
            <View style={styles.serviceCountBadge}>
              <Text style={styles.serviceCountText}>
                {activeServices.length} {getUnitLabel(activeServices.length)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.sectionSubtitle}>
          {sector.catalogSubtitle}
        </Text>
      </View>

      {activeServices.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Feather name="inbox" size={20} color={colors.text.muted} />
          </View>
          <Text style={styles.emptyTitle}>Sin opciones activas</Text>
          <Text style={styles.emptyDescription}>
            Este establecimiento aún no tiene opciones disponibles para agendar.
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
