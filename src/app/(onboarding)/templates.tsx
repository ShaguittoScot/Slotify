/**
 * US-002 / US-006 / SCRUM-105: Catalogo de Plantillas por Sector
 *
 * Pantalla interactiva del Onboarding y Administracion de Plantillas.
 * Disenada siguiendo estrictamente el sistema de diseno unificado de Slotify:
 * - Soporte nativo para Modo Claro y Modo Oscuro mediante useAppTheme
 * - Tipografia legible, tarjetas redondeadas limpias y ergonomia movil
 * - Personalizacion de servicios (precio, duracion, creacion y eliminacion)
 * - Seleccion de complementos / adicionales (addons) y visualizacion de sillones
 * - Modulos recomendados con interruptores fluidos
 * - Cero animaciones invasivas y cero emojis
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { FluidToggleSwitch } from '@/components/ui/FluidToggleSwitch';
import { useSectorTemplateStore } from '@/features/sector-templates';
import { CANONICAL_SECTOR_CATEGORIES } from '@/features/sector-templates/constants';
import type { SuggestedServiceDto, ServiceAddon, BarberStation } from '@/features/sector-templates/types';

// Metadatos descriptivos de los modulos del sistema
interface ModuleMeta {
  id: string;
  name: string;
  desc: string;
  required?: boolean;
}

const MODULE_REGISTRY: Record<string, ModuleMeta> = {
  citas: {
    id: 'citas',
    name: 'Agenda y Calendario de Citas',
    desc: 'Gestion de horarios, reservaciones en linea y disponibilidad.',
    required: true,
  },
  sillones: {
    id: 'sillones',
    name: 'Sillones y Puestos de Atencion',
    desc: 'Control de estaciones fisicas y asignacion de especialistas.',
  },
  servicios_adicionales: {
    id: 'servicios_adicionales',
    name: 'Servicios Adicionales y Extras',
    desc: 'Venta sugerida de complementos y rituales al agendar.',
  },
  empleados: {
    id: 'empleados',
    name: 'Equipo y Colaboradores',
    desc: 'Turnos independientes, especialistas y agendas individuales.',
  },
  comisiones: {
    id: 'comisiones',
    name: 'Calculo de Comisiones',
    desc: 'Control de porcentajes y propinas para el personal.',
  },
  recordatorios_sms: {
    id: 'recordatorios_sms',
    name: 'Recordatorios Automaticos',
    desc: 'Avisos por WhatsApp y SMS para reducir inasistencias.',
  },
  galeria_trabajos: {
    id: 'galeria_trabajos',
    name: 'Galeria de Trabajos y Peinados',
    desc: 'Muestrario de cortes y peinados para reserva directa.',
  },
  servicios: {
    id: 'servicios',
    name: 'Catalogo de Servicios',
    desc: 'Precios, tiempos de atencion y especificaciones tecnicas.',
  },
  citas_grupales: {
    id: 'citas_grupales',
    name: 'Clases Grupales y Aforos',
    desc: 'Control de cupos para sesiones con multiples asistentes.',
  },
  pagos_linea: {
    id: 'pagos_linea',
    name: 'Pagos y Anticipos en Linea',
    desc: 'Cobro de senas con tarjeta para asegurar reservaciones.',
  },
};

// Tarjeta de Servicio Sugerido (con seleccion y boton de edicion)
interface ServiceCardItemProps {
  service: SuggestedServiceDto;
  isSelected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  isDark: boolean;
  colors: any;
}

const ServiceCardItem: React.FC<ServiceCardItemProps> = ({
  service,
  isSelected,
  onToggle,
  onEdit,
  isDark,
  colors,
}) => {
  return (
    <Pressable
      testID={`service-card-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
      onPress={onToggle}
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(38, 38, 38, 0.95)'
              : '#FFFFFF'
            : isDark
              ? 'rgba(26, 26, 26, 0.50)'
              : '#F9FAFB',
          borderColor: isSelected
            ? '#E07A5F'
            : isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)',
          opacity: isSelected ? 1 : 0.65,
        },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: isSelected ? 'rgba(224, 122, 95, 0.12)' : 'rgba(150, 150, 150, 0.1)' }]}>
        <MaterialCommunityIcons
          name="content-cut"
          size={18}
          color={isSelected ? '#E07A5F' : colors.text.muted}
        />
      </View>

      <View style={styles.cardContent}>
        <Text
          style={[
            styles.cardTitle,
            { color: isSelected ? colors.text.primary : colors.text.muted, lineHeight: 19 },
          ]}
          numberOfLines={2}
        >
          {service.name}
        </Text>

        <View style={styles.badgeRow}>
          <View style={[styles.tagBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
            <Feather name="clock" size={11} color={colors.text.muted} />
            <Text style={[styles.tagBadgeText, { color: colors.text.muted }]}>
              {service.durationMinutes} min
            </Text>
          </View>

          {service.price ? (
            <View style={[styles.tagBadge, { backgroundColor: 'rgba(224, 122, 95, 0.10)' }]}>
              <Text style={[styles.tagBadgeText, { color: '#E07A5F', fontWeight: '700' }]}>
                ${service.price} MXN
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardActionsRight}>
        {onEdit && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={[
              styles.editPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
              },
            ]}
          >
            <Feather name="edit-2" size={12} color={colors.text.primary} />
            <Text style={[styles.editPillText, { color: colors.text.primary }]}>Editar</Text>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.checkCircle,
            {
              backgroundColor: isSelected ? '#E07A5F' : 'transparent',
              borderColor: isSelected ? '#E07A5F' : isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB',
            },
          ]}
        >
          {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
        </View>
      </View>
    </Pressable>
  );
};

// Tarjeta de Servicio Adicional / Addon
interface AddonCardItemProps {
  addon: ServiceAddon;
  isSelected: boolean;
  onToggle: () => void;
  isDark: boolean;
  colors: any;
}

const AddonCardItem: React.FC<AddonCardItemProps> = ({
  addon,
  isSelected,
  onToggle,
  isDark,
  colors,
}) => {
  return (
    <Pressable
      testID={`addon-card-${addon.id}`}
      onPress={onToggle}
      style={[
        styles.card,
        {
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(38, 38, 38, 0.95)'
              : '#FFFFFF'
            : isDark
              ? 'rgba(26, 26, 26, 0.50)'
              : '#F9FAFB',
          borderColor: isSelected
            ? '#E07A5F'
            : isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)',
          opacity: isSelected ? 1 : 0.65,
        },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: isSelected ? 'rgba(224, 122, 95, 0.12)' : 'rgba(150, 150, 150, 0.1)' }]}>
        <Feather
          name="plus-circle"
          size={18}
          color={isSelected ? '#E07A5F' : colors.text.muted}
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.titleWithBadge}>
          <Text
            style={[
              styles.cardTitle,
              { color: isSelected ? colors.text.primary : colors.text.muted },
            ]}
          >
            {addon.name}
          </Text>
          {addon.isPopular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>POPULAR</Text>
            </View>
          )}
        </View>

        {addon.description ? (
          <Text style={[styles.cardSubtitle, { color: colors.text.muted }]} numberOfLines={1}>
            {addon.description}
          </Text>
        ) : null}

        <View style={[styles.badgeRow, { marginTop: 4 }]}>
          <View style={[styles.tagBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
            <Text style={[styles.tagBadgeText, { color: colors.text.muted }]}>
              +{addon.durationMinutes} min
            </Text>
          </View>
          <View style={[styles.tagBadge, { backgroundColor: 'rgba(224, 122, 95, 0.10)' }]}>
            <Text style={[styles.tagBadgeText, { color: '#E07A5F', fontWeight: '700' }]}>
              +${addon.price} MXN
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.checkCircle,
          {
            backgroundColor: isSelected ? '#E07A5F' : 'transparent',
            borderColor: isSelected ? '#E07A5F' : isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB',
          },
        ]}
      >
        {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
};

// Tarjeta de Sillon de Atencion
interface StationCardItemProps {
  station: BarberStation;
  isDark: boolean;
  colors: any;
}

const StationCardItem: React.FC<StationCardItemProps> = ({ station, isDark, colors }) => {
  return (
    <View
      style={[
        styles.stationCard,
        {
          backgroundColor: isDark ? 'rgba(26, 26, 26, 0.85)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <View style={[styles.stationIconCircle, { backgroundColor: 'rgba(224, 122, 95, 0.12)' }]}>
        <MaterialCommunityIcons name="seat-passenger" size={16} color="#E07A5F" />
      </View>
      <View style={styles.stationContent}>
        <Text style={[styles.stationName, { color: colors.text.primary }]}>{station.name}</Text>
        <Text style={[styles.stationStaff, { color: colors.text.muted }]}>
          {station.assignedStaffName || 'Especialista asignado'}
        </Text>
      </View>
    </View>
  );
};

// Componente Principal de Plantillas
export default function SectorTemplatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sectorId?: string;
    sectorKey?: string;
    isCustom?: string;
  }>();

  const { colors, isDark } = useAppTheme();

  const {
    categories,
    selectedCategory,
    isCustomCanvas,
    saveOnboardingResult,
  } = useSectorTemplateStore();

  const isCustomMode = params.isCustom === 'true' || isCustomCanvas || params.sectorKey === 'otro-general';

  // Resolucion canonica de categoria
  const currentCategory = useMemo(() => {
    if (selectedCategory) return selectedCategory;
    if (params.sectorId) {
      const match = categories.find((c) => c.id.toString() === params.sectorId);
      if (match) return match;
    }
    if (params.sectorKey) {
      const match = categories.find((c) => c.key === params.sectorKey);
      if (match) return match;
    }
    const barber = categories.find((c) => c.key === 'barberia');
    if (barber) return barber;
    return categories[0] || CANONICAL_SECTOR_CATEGORIES[0];
  }, [selectedCategory, params.sectorId, params.sectorKey, categories]);

  // Lista de servicios de la categoria
  const categoryServices = useMemo(() => {
    return currentCategory?.suggestedServices ?? [];
  }, [currentCategory]);

  // Estado de servicios editables
  const [editableServices, setEditableServices] = useState<SuggestedServiceDto[]>(() =>
    categoryServices.map((s) => ({ ...s }))
  );

  // Lista de addons y seleccionados
  const categoryAddons = useMemo(() => {
    return currentCategory?.suggestedAddons ?? [];
  }, [currentCategory]);

  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(() =>
    (currentCategory?.suggestedAddons ?? [])
      .filter((a) => a.isPopular)
      .map((a) => a.id)
  );

  // Sillones
  const categoryStations = useMemo(() => {
    return currentCategory?.suggestedStations ?? [];
  }, [currentCategory]);

  // Servicios seleccionados
  const [selectedServices, setSelectedServices] = useState<string[]>(() =>
    categoryServices.map((s) => s.name)
  );

  // Modulos activos
  const categoryModuleKeys = useMemo(() => {
    if (isCustomMode) {
      return ['citas', 'servicios', 'empleados', 'recordatorios_sms', 'pagos_linea'];
    }
    return currentCategory?.defaultModules ?? ['citas', 'servicios'];
  }, [isCustomMode, currentCategory]);

  const [activeModules, setActiveModules] = useState<string[]>(() => {
    if (isCustomMode) {
      return ['citas', 'servicios'];
    }
    return currentCategory?.defaultModules ?? ['citas', 'servicios'];
  });

  // Modal de edicion de servicio existente
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [editServiceName, setEditServiceName] = useState<string>('');
  const [editServiceDuration, setEditServiceDuration] = useState<string>('30');
  const [editServicePrice, setEditServicePrice] = useState<string>('');

  // Modal para agregar nuevo servicio
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceDuration, setNewServiceDuration] = useState<string>('30');
  const [newServicePrice, setNewServicePrice] = useState<string>('200');
  const [showModulesDetail, setShowModulesDetail] = useState<boolean>(false);

  // Acciones de seleccion
  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((name) => name !== serviceName)
        : [...prev, serviceName]
    );
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const toggleModule = (moduleId: string) => {
    if (MODULE_REGISTRY[moduleId]?.required) return;
    setActiveModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Edicion de servicio
  const handleOpenEditModal = (index: number) => {
    const svc = editableServices[index];
    if (!svc) return;
    setEditingServiceIndex(index);
    setEditServiceName(svc.name);
    setEditServiceDuration(String(svc.durationMinutes));
    setEditServicePrice(svc.price ? String(svc.price) : '');
  };

  const handleSaveEditedService = () => {
    if (editingServiceIndex === null) return;
    const name = editServiceName.trim();
    if (!name) return;
    const dur = parseInt(editServiceDuration, 10) || 30;
    const pr = editServicePrice ? parseFloat(editServicePrice) : null;

    const oldName = editableServices[editingServiceIndex].name;
    const next = [...editableServices];
    next[editingServiceIndex] = {
      name,
      durationMinutes: dur,
      price: pr,
    };
    setEditableServices(next);

    if (oldName !== name && selectedServices.includes(oldName)) {
      setSelectedServices((prev) => prev.map((n) => (n === oldName ? name : n)));
    }
    setEditingServiceIndex(null);
  };

  const handleRemoveEditedService = () => {
    if (editingServiceIndex === null) return;
    const oldName = editableServices[editingServiceIndex].name;
    setEditableServices((prev) => prev.filter((_, i) => i !== editingServiceIndex));
    setSelectedServices((prev) => prev.filter((n) => n !== oldName));
    setEditingServiceIndex(null);
  };

  // Agregar nuevo servicio
  const handleAddNewService = () => {
    const name = newServiceName.trim();
    if (!name) return;
    const dur = parseInt(newServiceDuration, 10) || 30;
    const pr = newServicePrice ? parseFloat(newServicePrice) : 200;

    const newService: SuggestedServiceDto = {
      name,
      durationMinutes: dur,
      price: pr,
    };

    setEditableServices((prev) => [...prev, newService]);
    setSelectedServices((prev) => [...prev, name]);

    setNewServiceName('');
    setNewServiceDuration('30');
    setNewServicePrice('200');
    setShowAddModal(false);
  };

  // Finalizar y guardar plantilla
  const handleFinish = () => {
    const finalServices = editableServices.filter((s) => selectedServices.includes(s.name));
    const finalAddons = categoryAddons.filter((a) => selectedAddonIds.includes(a.id));

    saveOnboardingResult({
      businessName: currentCategory.name,
      selectedCategoryId: currentCategory.id,
      selectedCategoryKey: currentCategory.key,
      activeModules,
      finalServices,
      selectedAddons: finalAddons,
      stations: categoryStations,
      isCustomCanvas: isCustomMode,
    });

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)');
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background.secondary }]}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Cabecera limpia y profesional estilo Slotify */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? 'rgba(26, 26, 26, 0.92)' : 'rgba(255, 255, 255, 0.95)',
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)')}
              style={[
                styles.backButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="chevron-left" size={20} color={colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.sectorBadge}>
              <Text style={styles.sectorBadgeText}>BARBERIA Y CUIDADO PERSONAL</Text>
            </View>

            <View style={{ width: 38 }} />
          </View>

          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Plantilla de Barberia
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.muted }]}>
            Servicios, precios y complementos preconfigurados para tu negocio
          </Text>

          {/* Chips de resumen superior */}
          <View style={styles.summaryChipsRow}>
            <View style={[styles.summaryChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
              <Feather name="check-circle" size={12} color="#E07A5F" />
              <Text style={[styles.summaryChipText, { color: colors.text.primary }]}>
                {selectedServices.length} de {editableServices.length} servicios
              </Text>
            </View>

            <View style={[styles.summaryChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
              <Feather name="plus-circle" size={12} color="#E07A5F" />
              <Text style={[styles.summaryChipText, { color: colors.text.primary }]}>
                {selectedAddonIds.length} extras
              </Text>
            </View>

            <View style={[styles.summaryChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
              <Feather name="sliders" size={12} color="#10B981" />
              <Text style={[styles.summaryChipText, { color: colors.text.primary }]}>
                {activeModules.length} modulos
              </Text>
            </View>
          </View>
        </View>

        {/* Contenido scrolleable holgado */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Seccion 1: Servicios Principales */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Servicios Principales
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.text.muted }]}>
                Toca para activar o pulsa Editar para cambiar precio y duracion
              </Text>
            </View>
          </View>

          <View style={styles.listGap}>
            {editableServices.map((service, index) => (
              <ServiceCardItem
                key={`${service.name}-${index}`}
                service={service}
                isSelected={selectedServices.includes(service.name)}
                onToggle={() => toggleService(service.name)}
                onEdit={() => handleOpenEditModal(index)}
                isDark={isDark}
                colors={colors}
              />
            ))}
          </View>

          {/* Boton para agregar nuevo servicio */}
          <TouchableOpacity
            testID="add-template-service-button"
            onPress={() => setShowAddModal(true)}
            style={[
              styles.addServiceButton,
              {
                backgroundColor: isDark ? 'rgba(224, 122, 95, 0.08)' : 'rgba(224, 122, 95, 0.06)',
                borderColor: '#E07A5F',
              },
            ]}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color="#E07A5F" />
            <Text style={styles.addServiceButtonText}>
              Agregar otro servicio a la plantilla
            </Text>
          </TouchableOpacity>

          {/* Seccion 2: Servicios Adicionales / Extras */}
          {categoryAddons.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Servicios Adicionales y Extras
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.text.muted }]}>
                    Complementos recomendados para venta cruzada al agendar
                  </Text>
                </View>
              </View>

              <View style={styles.listGap}>
                {categoryAddons.map((addon) => (
                  <AddonCardItem
                    key={addon.id}
                    addon={addon}
                    isSelected={selectedAddonIds.includes(addon.id)}
                    onToggle={() => toggleAddon(addon.id)}
                    isDark={isDark}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Seccion 3: Modulos Incluidos (Resumen Colapsable Inteligente) */}
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? 'rgba(26, 26, 26, 0.85)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  padding: 16,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Feather name="sliders" size={18} color="#10B981" />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                    Modulos Incluidos en la Plantilla
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.text.muted }]}>
                    {activeModules.length} herramientas activas para tu barberia
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowModulesDetail(!showModulesDetail)}
                  style={[
                    styles.editPill,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.editPillText, { color: colors.text.primary }]}>
                    {showModulesDetail ? 'Ocultar' : 'Personalizar'}
                  </Text>
                  <Feather
                    name={showModulesDetail ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={colors.text.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* Lista expandible de modulos con interruptores */}
              {showModulesDetail && (
                <View style={[styles.listGap, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                  {categoryModuleKeys.map((key) => {
                    const mod = MODULE_REGISTRY[key] ?? {
                      id: key,
                      name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                      desc: 'Modulo sectorial para optimizar tu operacion.',
                    };
                    const isEnabled = activeModules.includes(mod.id);

                    return (
                      <View
                        key={mod.id}
                        style={[
                          styles.card,
                          {
                            backgroundColor: isDark ? 'rgba(38, 38, 38, 0.7)' : '#F9FAFB',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                            padding: 12,
                          },
                        ]}
                      >
                        <View style={styles.cardContent}>
                          <View style={styles.titleWithBadge}>
                            <Text style={[styles.cardTitle, { color: colors.text.primary, fontSize: 13.5 }]}>
                              {mod.name}
                            </Text>
                            {mod.required && (
                              <View style={[styles.tagBadge, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                                <Text style={[styles.tagBadgeText, { color: '#818CF8', fontWeight: '700' }]}>
                                  NUCLEO
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.cardSubtitle, { color: colors.text.muted }]}>
                            {mod.desc}
                          </Text>
                        </View>

                        <FluidToggleSwitch
                          value={isEnabled}
                          disabled={mod.required}
                          activeColor="#E07A5F"
                          onValueChange={() => toggleModule(mod.id)}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Barra inferior fija y despejada */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: isDark ? 'rgba(18, 18, 18, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <TouchableOpacity
            testID="apply-template-button"
            onPress={handleFinish}
            style={styles.primaryActionButton}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>
              Aplicar Plantilla ({selectedServices.length} serv • {selectedAddonIds.length} extras • {activeModules.length} mod)
            </Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Modal Interactivo de Edicion de Servicio */}
        <Modal
          visible={editingServiceIndex !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setEditingServiceIndex(null)}
        >
          <View style={styles.editModalOverlay}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Personalizar Servicio
                </Text>
                <TouchableOpacity onPress={() => setEditingServiceIndex(null)}>
                  <Feather name="x" size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text.muted }]}>
                NOMBRE DEL SERVICIO
              </Text>
              <TextInput
                testID="edit-service-name-input"
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                    color: colors.text.primary,
                  },
                ]}
                value={editServiceName}
                onChangeText={setEditServiceName}
                placeholder="Nombre del servicio"
                placeholderTextColor={colors.text.muted}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14, color: colors.text.muted }]}>
                DURACION (MINUTOS)
              </Text>
              <View style={styles.presetButtonsRow}>
                {[15, 30, 45, 60, 90].map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    onPress={() => setEditServiceDuration(String(dur))}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          editServiceDuration === String(dur)
                            ? 'rgba(224, 122, 95, 0.15)'
                            : isDark
                              ? 'rgba(255,255,255,0.06)'
                              : '#F3F4F6',
                        borderColor:
                          editServiceDuration === String(dur)
                            ? '#E07A5F'
                            : isDark
                              ? 'rgba(255,255,255,0.1)'
                              : '#E5E7EB',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        {
                          color:
                            editServiceDuration === String(dur)
                              ? '#E07A5F'
                              : colors.text.primary,
                          fontWeight: editServiceDuration === String(dur) ? '700' : '500',
                        },
                      ]}
                    >
                      {dur}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                testID="edit-service-duration-input"
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                    color: colors.text.primary,
                  },
                ]}
                value={editServiceDuration}
                onChangeText={setEditServiceDuration}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.text.muted}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14, color: colors.text.muted }]}>
                PRECIO SUGERIDO (MXN)
              </Text>
              <TextInput
                testID="edit-service-price-input"
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                    color: colors.text.primary,
                  },
                ]}
                value={editServicePrice}
                onChangeText={setEditServicePrice}
                keyboardType="decimal-pad"
                placeholder="200"
                placeholderTextColor={colors.text.muted}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={handleRemoveEditedService}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                  onPress={() => setEditingServiceIndex(null)}
                  style={[
                    styles.cancelBtn,
                    {
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D1D5DB',
                    },
                  ]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text.muted }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveEditedService}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para Agregar Nuevo Servicio */}
        <Modal
          visible={showAddModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.editModalOverlay}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Nuevo Servicio
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Feather name="x" size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text.muted }]}>
                NOMBRE DEL SERVICIO
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                    color: colors.text.primary,
                  },
                ]}
                value={newServiceName}
                onChangeText={setNewServiceName}
                placeholder="Ej. Tinte de Barba, Masaje Capilar"
                placeholderTextColor={colors.text.muted}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14, color: colors.text.muted }]}>
                DURACION (MINUTOS)
              </Text>
              <View style={styles.presetButtonsRow}>
                {[15, 30, 45, 60, 90].map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    onPress={() => setNewServiceDuration(String(dur))}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor:
                          newServiceDuration === String(dur)
                            ? 'rgba(224, 122, 95, 0.15)'
                            : isDark
                              ? 'rgba(255,255,255,0.06)'
                              : '#F3F4F6',
                        borderColor:
                          newServiceDuration === String(dur)
                            ? '#E07A5F'
                            : isDark
                              ? 'rgba(255,255,255,0.1)'
                              : '#E5E7EB',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        {
                          color:
                            newServiceDuration === String(dur)
                              ? '#E07A5F'
                              : colors.text.primary,
                          fontWeight: newServiceDuration === String(dur) ? '700' : '500',
                        },
                      ]}
                    >
                      {dur}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    marginTop: 8,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                    color: colors.text.primary,
                  },
                ]}
                value={newServiceDuration}
                onChangeText={setNewServiceDuration}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.text.muted}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14, color: colors.text.muted }]}>
                PRECIO SUGERIDO (MXN)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                    color: colors.text.primary,
                  },
                ]}
                value={newServicePrice}
                onChangeText={setNewServicePrice}
                keyboardType="decimal-pad"
                placeholder="200"
                placeholderTextColor={colors.text.muted}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={[
                    styles.cancelBtn,
                    {
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D1D5DB',
                    },
                  ]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text.muted }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddNewService}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveBtnText}>Agregar a Plantilla</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectorBadge: {
    backgroundColor: 'rgba(224, 122, 95, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  sectorBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#E07A5F',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  summaryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  summaryChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 130, // Margen holgado para el boton fijo inferior
  },
  sectionContainer: {
    marginTop: 22,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listGap: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  popularBadge: {
    backgroundColor: 'rgba(224, 122, 95, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#E07A5F',
    letterSpacing: 0.5,
  },
  cardActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  editPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 10,
    gap: 8,
  },
  addServiceButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E07A5F',
  },
  stationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  stationIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationContent: {
    flex: 1,
  },
  stationName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  stationStaff: {
    fontSize: 11.5,
    marginTop: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 28, default: 16 }),
    borderTopWidth: 1,
  },
  primaryActionButton: {
    backgroundColor: '#E07A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: 11.5,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#E07A5F',
  },
  saveBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
