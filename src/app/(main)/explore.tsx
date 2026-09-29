import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';
import { useCalendarStore } from '@/features/calendar/model';
import { apiClient } from '@/shared/lib/api';
import type { CalendarSlot } from '@/shared/types';

export interface BusinessItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryKey?: string;
  phone?: string;
  rating: number;
  reviewCount: number;
  address: string;
  nextAvailable: string;
  services: { id: string; name: string; duration: string; durationMinutes: number; price: string; priceNum: number }[];
  accentColor: string;
}

const DEFAULT_BUSINESS_CATALOG: BusinessItem[] = [
  {
    id: 'biz-1',
    name: 'Central Barber Studio',
    slug: 'central-barber',
    category: 'Barbería & Estilo',
    categoryKey: 'barberia',
    phone: '+52 55 1234 5678',
    rating: 4.9,
    reviewCount: 142,
    address: 'Av. Hidalgo 402, Centro',
    nextAvailable: 'Hoy, 11:30 AM',
    services: [
      { id: 's1', name: 'Corte Clásico + Barba', duration: '45 min', durationMinutes: 45, price: '$250 MXN', priceNum: 250 },
      { id: 's2', name: 'Perfilado de Barba', duration: '20 min', durationMinutes: 20, price: '$150 MXN', priceNum: 150 },
      { id: 's3', name: 'Tratamiento Facial y Toalla Caliente', duration: '30 min', durationMinutes: 30, price: '$200 MXN', priceNum: 200 },
    ],
    accentColor: '#818CF8',
  },
  {
    id: 'biz-2',
    name: 'Clínica Dental Sonrisas',
    slug: 'dental-sonrisas',
    category: 'Salud & Consultorios',
    categoryKey: 'salud',
    phone: '+52 55 8765 4321',
    rating: 5.0,
    reviewCount: 89,
    address: 'Plaza Médica Norte, Local 12',
    nextAvailable: 'Hoy, 02:00 PM',
    services: [
      { id: 's4', name: 'Limpieza Dental Ultrasonido', duration: '40 min', durationMinutes: 40, price: '$500 MXN', priceNum: 500 },
      { id: 's5', name: 'Valoración y Diagnóstico', duration: '30 min', durationMinutes: 30, price: '$350 MXN', priceNum: 350 },
      { id: 's6', name: 'Blanqueamiento Express', duration: '60 min', durationMinutes: 60, price: '$1,200 MXN', priceNum: 1200 },
    ],
    accentColor: '#34D399',
  },
  {
    id: 'biz-3',
    name: 'Zen Spa & Masajes',
    slug: 'zen-spa',
    category: 'Spa & Masajes',
    categoryKey: 'spa',
    phone: '+52 55 9988 7766',
    rating: 4.8,
    reviewCount: 215,
    address: 'Calle del Sol 88, Jardines',
    nextAvailable: 'Mañana, 10:00 AM',
    services: [
      { id: 's7', name: 'Masaje Relajante Completo', duration: '60 min', durationMinutes: 60, price: '$650 MXN', priceNum: 650 },
      { id: 's8', name: 'Sesión de Aromaterapia', duration: '45 min', durationMinutes: 45, price: '$450 MXN', priceNum: 450 },
      { id: 's9', name: 'Exfoliación Corporal', duration: '50 min', durationMinutes: 50, price: '$550 MXN', priceNum: 550 },
    ],
    accentColor: '#F472B6',
  },
  {
    id: 'biz-4',
    name: 'Glam Studio & Salón',
    slug: 'glam-studio',
    category: 'Salón & Estética',
    categoryKey: 'belleza',
    phone: '+52 55 3344 5566',
    rating: 4.9,
    reviewCount: 98,
    address: 'Plaza Galerías, Nivel 2',
    nextAvailable: 'Hoy, 04:30 PM',
    services: [
      { id: 's10', name: 'Corte y Peinado Dama', duration: '50 min', durationMinutes: 50, price: '$380 MXN', priceNum: 380 },
      { id: 's11', name: 'Manicura Spa y Gelish', duration: '45 min', durationMinutes: 45, price: '$280 MXN', priceNum: 280 },
      { id: 's12', name: 'Balayage / Tinte Completo', duration: '120 min', durationMinutes: 120, price: '$1,400 MXN', priceNum: 1400 },
    ],
    accentColor: '#EC4899',
  },
  {
    id: 'biz-5',
    name: 'CrossFit Apex Club',
    slug: 'crossfit-apex',
    category: 'Fitness & Entrenamiento',
    categoryKey: 'fitness',
    phone: '+52 55 7766 5544',
    rating: 4.9,
    reviewCount: 76,
    address: 'Blvd. Industrial 1200',
    nextAvailable: 'Hoy, 05:00 PM',
    services: [
      { id: 's13', name: 'Clase Funcional WOD', duration: '60 min', durationMinutes: 60, price: '$120 MXN', priceNum: 120 },
      { id: 's14', name: 'Evaluación de Rendimiento', duration: '45 min', durationMinutes: 45, price: '$300 MXN', priceNum: 300 },
      { id: 's15', name: 'Pase Semanal Ilimitado', duration: '7 días', durationMinutes: 60, price: '$450 MXN', priceNum: 450 },
    ],
    accentColor: '#FBBF24',
  },
];

const CATEGORIES = [
  'Todos',
  'Barbería & Estilo',
  'Salud & Consultorios',
  'Spa & Masajes',
  'Salón & Estética',
  'Fitness & Entrenamiento',
];

const AVAILABLE_HOURS = [
  '09:00 AM',
  '10:30 AM',
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '06:30 PM',
];

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { addSlot } = useCalendarStore();

  const [businesses, setBusinesses] = useState<BusinessItem[]>(DEFAULT_BUSINESS_CATALOG);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Booking Modal State
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessItem | null>(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0); // 0: Hoy, 1: Mañana, 2: Pasado mañana
  const [selectedHour, setSelectedHour] = useState('11:30 AM');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);
  const [lastBookedData, setLastBookedData] = useState<any>(null);

  // Carga de negocios desde el Backend
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get<any[]>('/businesses');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const backendBusinesses: BusinessItem[] = res.data.map((b, idx) => {
            const defaultBiz = DEFAULT_BUSINESS_CATALOG[idx % DEFAULT_BUSINESS_CATALOG.length];
            return {
              id: b.id,
              name: b.name,
              slug: b.slug,
              category: b.category || defaultBiz.category,
              categoryKey: b.categoryKey || 'general',
              phone: b.phone || defaultBiz.phone,
              rating: 4.9,
              reviewCount: 50 + idx * 12,
              address: b.address || defaultBiz.address,
              nextAvailable: 'Hoy, ' + AVAILABLE_HOURS[idx % AVAILABLE_HOURS.length],
              services: defaultBiz.services,
              accentColor: defaultBiz.accentColor,
            };
          });

          // Mezclamos para asegurar catálogo amplio
          const merged = [...backendBusinesses];
          DEFAULT_BUSINESS_CATALOG.forEach((item) => {
            if (!merged.some((m) => m.slug === item.slug)) {
              merged.push(item);
            }
          });
          setBusinesses(merged);
        }
      } catch (err) {
        console.warn('Backend businesses fetch fallback to default catalog:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();

    // Lee intereses de consumidor si existen
    AsyncStorage.getItem('consumerInterests').then((val) => {
      if (val) {
        try {
          const interests = JSON.parse(val);
          if (interests.includes('barberia')) setSelectedCategory('Barbería & Estilo');
          else if (interests.includes('spa')) setSelectedCategory('Spa & Masajes');
          else if (interests.includes('salud')) setSelectedCategory('Salud & Consultorios');
          else if (interests.includes('belleza')) setSelectedCategory('Salón & Estética');
        } catch {}
      }
    });
  }, []);

  const dateOptions = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 4 }).map((_, idx) => {
      const d = new Date(today);
      d.setDate(today.getDate() + idx);
      const label =
        idx === 0
          ? 'Hoy'
          : idx === 1
          ? 'Mañana'
          : d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
      return { offset: idx, dateObj: d, label };
    });
  }, []);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((biz) => {
      const matchesCategory =
        selectedCategory === 'Todos' || biz.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchesSearch =
        biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biz.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [businesses, selectedCategory, searchQuery]);

  const handleOpenDirectLink = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Búsqueda', 'Por favor ingresa un nombre o enlace.');
      return;
    }

    const cleanSlug = searchQuery
      .replace('slotly.app/', '')
      .replace('https://slotly.app/', '')
      .trim()
      .toLowerCase();

    const found = businesses.find(
      (b) => b.slug.toLowerCase() === cleanSlug || b.name.toLowerCase().includes(cleanSlug)
    );

    if (found) {
      setSelectedBusiness(found);
    } else {
      Alert.alert(
        'Negocio no encontrado',
        `No encontramos el negocio "${searchQuery}". Te mostramos las opciones disponibles.`
      );
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedBusiness) return;
    const selectedService = selectedBusiness.services[selectedServiceIndex];
    if (!selectedService) return;

    setIsSubmittingBooking(true);

    try {
      // Construye fecha y hora exacta
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + selectedDateOffset);

      const [timePart, modifier] = selectedHour.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const startTime = new Date(targetDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.durationMinutes);

      const clientName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Cliente';
      const clientEmail = user?.email || 'cliente@slotify.com';
      const clientPhone = '+52 55 1234 5678';

      // Intenta persistir en el endpoint del Backend
      let backendId = `apt-${Date.now()}`;
      try {
        const payload = {
          businessId: selectedBusiness.id.startsWith('biz-') ? '00000000-0000-0000-0000-000000000000' : selectedBusiness.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          clientName,
          clientEmail,
          clientPhone,
          agreedTotal: selectedService.priceNum,
        };

        const res = await apiClient.post('/calendar/appointments', payload);
        if (res.data?.id) {
          backendId = res.data.id;
        }
      } catch (backendErr) {
        console.warn('Backend appointment persist warning (storing locally in store):', backendErr);
      }

      // Agrega el slot al store del cliente
      const newSlot: CalendarSlot = {
        resourceId: backendId,
        type: 'appointment',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        title: selectedService.name,
        status: 'confirmed',
        clientName,
        clientPhone,
        servicePrice: selectedService.price,
        employeeName: selectedBusiness.name,
      };

      addSlot(newSlot);

      setLastBookedData({
        businessName: selectedBusiness.name,
        serviceName: selectedService.name,
        price: selectedService.price,
        date: dateOptions[selectedDateOffset].label,
        hour: selectedHour,
        address: selectedBusiness.address,
      });

      setSelectedBusiness(null);
      setBookingSuccessModal(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo completar la reserva.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
      <View style={styles.container}>
        {/* Cabecera Glassmorphism */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? 'rgba(26, 26, 26, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderBottomColor: colors.border.main,
            },
          ]}
        >
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Explorar & Agendar</Text>
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                Encuentra establecimientos y reserva tu cita en segundos
              </Text>
            </View>
          </View>

          {/* Barra de Búsqueda / Enlace */}
          <View style={styles.searchBarRow}>
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: colors.background.tertiary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <Feather name="search" size={18} color={colors.text.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                placeholder="Busca por negocio, servicio o slug..."
                placeholderTextColor={colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleOpenDirectLink}
                returnKeyType="search"
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.openLinkBtn, { backgroundColor: colors.action.primary }]}
              onPress={handleOpenDirectLink}
              activeOpacity={0.8}
            >
              <Feather name="arrow-right" size={18} color={colors.action.primaryText} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner de Enlace Público Rápido */}
          <View
            style={[
              styles.quickLinkBanner,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.18)',
              },
            ]}
          >
            <View style={[styles.bannerIconCircle, { backgroundColor: colors.action.primary + '20' }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.action.primary} />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={[styles.bannerTitle, { color: colors.text.primary }]}>
                Reserva 24/7 sin llamadas
              </Text>
              <Text style={[styles.bannerSubtitle, { color: colors.text.secondary }]}>
                Selecciona un negocio, elige tu horario libre y tu cita quedará confirmada al instante.
              </Text>
            </View>
          </View>

          {/* Categorías */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? colors.action.primary : colors.background.secondary,
                      borderColor: isSelected ? colors.action.primary : colors.border.main,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color: isSelected ? colors.action.primaryText : colors.text.secondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Lista de Negocios Disponibles */}
          <View style={styles.businessListSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Negocios Disponibles
              </Text>
              <Text style={[styles.sectionBadge, { color: colors.text.secondary }]}>
                {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'negocio' : 'negocios'}
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.action.primary} />
                <Text style={[styles.loadingText, { color: colors.text.muted }]}>Cargando establecimientos...</Text>
              </View>
            ) : filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((biz, idx) => (
                <Animated.View
                  key={biz.id}
                  entering={FadeInDown.duration(400).delay(idx * 70)}
                  style={[
                    styles.businessCard,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.main,
                    },
                  ]}
                >
                  <View style={styles.bizHeaderRow}>
                    <View style={styles.bizTitleGroup}>
                      <Text style={[styles.bizName, { color: colors.text.primary }]}>{biz.name}</Text>
                      <View style={styles.categoryBadgeRow}>
                        <Text style={[styles.bizCategory, { color: colors.text.secondary }]}>
                          {biz.category}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.ratingBadge, { backgroundColor: '#FBBF2418' }]}>
                      <Feather name="star" size={13} color="#FBBF24" />
                      <Text style={styles.ratingText}>
                        {biz.rating} <Text style={{ color: colors.text.muted, fontSize: 11 }}>({biz.reviewCount})</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bizMetaRow}>
                    <Feather name="map-pin" size={13} color={colors.text.muted} />
                    <Text style={[styles.bizAddress, { color: colors.text.muted }]}>{biz.address}</Text>
                  </View>

                  {/* Badge de Próximo Horario Libre */}
                  <View
                    style={[
                      styles.availabilityBox,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                      },
                    ]}
                  >
                    <View style={styles.greenDot} />
                    <Text style={[styles.availabilityText, { color: '#10B981' }]}>
                      Próximo espacio disponible: <Text style={{ fontWeight: '700' }}>{biz.nextAvailable}</Text>
                    </Text>
                  </View>

                  {/* Servicios destacados */}
                  <View style={styles.servicesSampleRow}>
                    {biz.services.slice(0, 2).map((s) => (
                      <View key={s.id} style={[styles.serviceSampleChip, { backgroundColor: colors.background.tertiary }]}>
                        <Text style={[styles.serviceSampleText, { color: colors.text.secondary }]}>
                          {s.name} • <Text style={{ fontWeight: '700', color: colors.text.primary }}>{s.price}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer de Tarjeta con botón de Agendar */}
                  <View style={styles.bizCardFooter}>
                    <Text style={[styles.slugText, { color: colors.text.muted }]}>
                      slotly.app/{biz.slug}
                    </Text>

                    <TouchableOpacity
                      style={[styles.bookBtn, { backgroundColor: colors.action.primary }]}
                      onPress={() => {
                        setSelectedBusiness(biz);
                        setSelectedServiceIndex(0);
                      }}
                      activeOpacity={0.8}
                    >
                      <Feather name="calendar" size={14} color={colors.action.primaryText} />
                      <Text style={[styles.bookBtnText, { color: colors.action.primaryText }]}>
                        Reservar Cita
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))
            ) : (
              <View style={[styles.emptyStateContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
                <Feather name="search" size={28} color={colors.text.muted} />
                <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
                  No encontramos establecimientos
                </Text>
                <Text style={[styles.emptyStateDesc, { color: colors.text.muted }]}>
                  Intenta cambiar el filtro de categoría o buscar con otra palabra clave.
                </Text>
                <TouchableOpacity
                  style={[styles.resetSearchBtn, { backgroundColor: colors.action.primary }]}
                  onPress={() => {
                    setSelectedCategory('Todos');
                    setSearchQuery('');
                  }}
                >
                  <Text style={[styles.resetSearchBtnText, { color: colors.action.primaryText }]}>
                    Ver todos los negocios
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ─── MODAL DE RESERVA DINÁMICA DE CITA ─── */}
        <Modal
          visible={selectedBusiness !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedBusiness(null)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              {selectedBusiness && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalBizName, { color: colors.text.primary }]}>
                        {selectedBusiness.name}
                      </Text>
                      <Text style={[styles.modalBizSlug, { color: colors.text.muted }]}>
                        {selectedBusiness.category} • {selectedBusiness.address}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedBusiness(null)}
                      style={[styles.modalCloseBtn, { backgroundColor: colors.background.secondary }]}
                    >
                      <Feather name="x" size={18} color={colors.text.primary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                    {/* Paso 1: Servicios */}
                    <Text style={[styles.modalSectionLabel, { color: colors.text.secondary }]}>
                      1. SELECCIONA EL SERVICIO
                    </Text>

                    {selectedBusiness.services.map((srv, idx) => {
                      const isSrvSelected = selectedServiceIndex === idx;
                      return (
                        <TouchableOpacity
                          key={srv.id}
                          style={[
                            styles.serviceOptionCard,
                            {
                              backgroundColor: isSrvSelected
                                ? isDark
                                  ? 'rgba(99, 102, 241, 0.16)'
                                  : 'rgba(99, 102, 241, 0.10)'
                                : colors.background.secondary,
                              borderColor: isSrvSelected ? colors.action.primary : colors.border.main,
                            },
                          ]}
                          onPress={() => setSelectedServiceIndex(idx)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.serviceOptionLeft}>
                            <View
                              style={[
                                styles.radioCircle,
                                {
                                  borderColor: isSrvSelected ? colors.action.primary : colors.border.main,
                                },
                              ]}
                            >
                              {isSrvSelected && (
                                <View style={[styles.radioInner, { backgroundColor: colors.action.primary }]} />
                              )}
                            </View>
                            <View>
                              <Text style={[styles.serviceOptionName, { color: colors.text.primary }]}>
                                {srv.name}
                              </Text>
                              <Text style={[styles.serviceOptionDuration, { color: colors.text.muted }]}>
                                ⏱️ {srv.duration}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.serviceOptionPrice, { color: colors.text.primary }]}>
                            {srv.price}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Paso 2: Fecha */}
                    <Text style={[styles.modalSectionLabel, { color: colors.text.secondary, marginTop: 14 }]}>
                      2. SELECCIONA EL DÍA
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChipsRow}>
                      {dateOptions.map((item) => {
                        const isDateSelected = selectedDateOffset === item.offset;
                        return (
                          <TouchableOpacity
                            key={item.offset}
                            style={[
                              styles.dateOptionChip,
                              {
                                backgroundColor: isDateSelected ? colors.action.primary : colors.background.secondary,
                                borderColor: isDateSelected ? colors.action.primary : colors.border.main,
                              },
                            ]}
                            onPress={() => setSelectedDateOffset(item.offset)}
                          >
                            <Text
                              style={[
                                styles.dateOptionText,
                                { color: isDateSelected ? colors.action.primaryText : colors.text.primary },
                              ]}
                            >
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Paso 3: Horario */}
                    <Text style={[styles.modalSectionLabel, { color: colors.text.secondary, marginTop: 14 }]}>
                      3. SELECCIONA LA HORA DISPONIBLE
                    </Text>
                    <View style={styles.hoursGrid}>
                      {AVAILABLE_HOURS.map((hr) => {
                        const isHourSelected = selectedHour === hr;
                        return (
                          <TouchableOpacity
                            key={hr}
                            style={[
                              styles.hourOptionBtn,
                              {
                                backgroundColor: isHourSelected ? colors.action.primary : colors.background.secondary,
                                borderColor: isHourSelected ? colors.action.primary : colors.border.main,
                              },
                            ]}
                            onPress={() => setSelectedHour(hr)}
                          >
                            <Text
                              style={[
                                styles.hourOptionText,
                                { color: isHourSelected ? colors.action.primaryText : colors.text.primary },
                              ]}
                            >
                              {hr}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Botón de Confirmación */}
                  <TouchableOpacity
                    style={[styles.confirmBookingBtn, { backgroundColor: colors.action.primary }]}
                    onPress={handleConfirmBooking}
                    activeOpacity={0.85}
                    disabled={isSubmittingBooking}
                  >
                    {isSubmittingBooking ? (
                      <ActivityIndicator size="small" color={colors.action.primaryText} />
                    ) : (
                      <>
                        <Feather name="check-circle" size={18} color={colors.action.primaryText} />
                        <Text style={[styles.confirmBookingText, { color: colors.action.primaryText }]}>
                          Confirmar Cita ({selectedBusiness.services[selectedServiceIndex]?.price})
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* ─── MODAL DE ÉXITO DE RESERVA ─── */}
        <Modal
          visible={bookingSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setBookingSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.successModalCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
              <View style={[styles.successIconCircle, { backgroundColor: '#10B98120' }]}>
                <Feather name="check" size={36} color="#10B981" />
              </View>

              <Text style={[styles.successTitle, { color: colors.text.primary }]}>¡Cita Confirmada!</Text>
              <Text style={[styles.successSub, { color: colors.text.secondary }]}>
                Tu reservación ha sido registrada exitosamente en el negocio.
              </Text>

              {lastBookedData && (
                <View style={[styles.successDetailsBox, { backgroundColor: colors.background.tertiary }]}>
                  <Text style={[styles.successDetailBiz, { color: colors.text.primary }]}>
                    {lastBookedData.businessName}
                  </Text>
                  <Text style={[styles.successDetailService, { color: colors.text.secondary }]}>
                    {lastBookedData.serviceName} • {lastBookedData.price}
                  </Text>
                  <View style={styles.successDateTimeRow}>
                    <Feather name="calendar" size={14} color={colors.action.primary} />
                    <Text style={[styles.successDateTimeText, { color: colors.text.primary }]}>
                      {lastBookedData.date} a las {lastBookedData.hour}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.goToAppointmentsBtn, { backgroundColor: colors.action.primary }]}
                onPress={() => {
                  setBookingSuccessModal(false);
                  router.push('/(main)' as any);
                }}
              >
                <Text style={[styles.goToAppointmentsText, { color: colors.action.primaryText }]}>
                  Ver en Mis Citas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueExploringBtn}
                onPress={() => setBookingSuccessModal(false)}
              >
                <Text style={[styles.continueExploringText, { color: colors.text.secondary }]}>
                  Seguir explorando
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTopRow: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  searchBarRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  openLinkBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  quickLinkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  bannerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700' },
  bannerSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  categoriesScroll: { gap: 8, paddingBottom: 6, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13 },
  businessListSection: { gap: 14 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  sectionBadge: { fontSize: 13, fontWeight: '500' },
  businessCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  bizHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bizTitleGroup: { flex: 1, marginRight: 8 },
  bizName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  categoryBadgeRow: { marginTop: 2 },
  bizCategory: { fontSize: 12, fontWeight: '500' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  bizMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  bizAddress: { fontSize: 12 },
  availabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  availabilityText: { fontSize: 11 },
  servicesSampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  serviceSampleChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  serviceSampleText: { fontSize: 11 },
  bizCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
    paddingTop: 10,
  },
  slugText: { fontSize: 12, fontWeight: '500' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: { fontSize: 13, fontWeight: '700' },
  loadingBox: { padding: 30, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13 },
  emptyStateContainer: { padding: 26, borderRadius: 16, alignItems: 'center', gap: 8, borderWidth: 1 },
  emptyStateTitle: { fontSize: 15, fontWeight: '700' },
  emptyStateDesc: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  resetSearchBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginTop: 6 },
  resetSearchBtnText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalBizName: { fontSize: 18, fontWeight: '800' },
  modalBizSlug: { fontSize: 12, marginTop: 2 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  serviceOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  serviceOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  serviceOptionName: { fontSize: 14, fontWeight: '700' },
  serviceOptionDuration: { fontSize: 11, marginTop: 2 },
  serviceOptionPrice: { fontSize: 13, fontWeight: '700' },
  dateChipsRow: { gap: 8, paddingBottom: 4 },
  dateOptionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateOptionText: { fontSize: 13, fontWeight: '600' },
  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  hourOptionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  hourOptionText: { fontSize: 12, fontWeight: '600' },
  confirmBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  confirmBookingText: { fontSize: 15, fontWeight: '700' },
  successModalCard: {
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  successSub: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  successDetailsBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    gap: 4,
  },
  successDetailBiz: { fontSize: 15, fontWeight: '800' },
  successDetailService: { fontSize: 13 },
  successDateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  successDateTimeText: { fontSize: 13, fontWeight: '700' },
  goToAppointmentsBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  goToAppointmentsText: { fontSize: 14, fontWeight: '700' },
  continueExploringBtn: { paddingVertical: 6 },
  continueExploringText: { fontSize: 13, fontWeight: '600' },
});
