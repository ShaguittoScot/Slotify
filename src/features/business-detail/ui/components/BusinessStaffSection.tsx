import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailDto, BusinessStaffMember } from '../../types';
import type { SectorConfig } from '../../model/sector';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

interface BusinessStaffSectionProps {
  business: BusinessDetailDto;
  sector: SectorConfig;
  accentColor: string;
}

export function BusinessStaffSection({
  business,
  sector,
  accentColor,
}: BusinessStaffSectionProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessDetailStyles(colors, accentColor);

  // Determinar la lista de miembros: del backend si existen, o del modelo sectorial por defecto si el sector lo requiere
  const staffList: BusinessStaffMember[] =
    business.staff && business.staff.length > 0
      ? business.staff
      : sector.showStaffByDefault
      ? sector.defaultStaff
      : [];

  // Si no hay profesionales y el sector no los prioriza (ej. restaurante general sin chefs configurados), no renderizamos
  if (staffList.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{sector.staffTitle}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {staffList.length} {staffList.length === 1 ? 'experto' : 'expertos'}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>{sector.staffSubtitle}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.staffScrollContent}
      >
        {staffList.map((member) => {
          const initial = member.name ? member.name.charAt(0).toUpperCase() : 'P';
          return (
            <View key={member.id} style={styles.staffCard}>
              <View style={styles.staffAvatarBox}>
                {member.avatarUrl ? (
                  <Image
                    source={{ uri: member.avatarUrl }}
                    style={styles.staffAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.staffAvatarText}>{initial}</Text>
                )}
              </View>

              <Text style={styles.staffName} numberOfLines={1}>
                {member.name}
              </Text>

              {member.role ? (
                <View style={styles.staffRoleBadge}>
                  <Text style={styles.staffRoleText} numberOfLines={1}>
                    {member.role}
                  </Text>
                </View>
              ) : null}

              {member.specialty ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.text.muted,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {member.specialty}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
