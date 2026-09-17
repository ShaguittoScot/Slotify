import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

interface MockBusiness {
  id: string;
  name: string;
  slug: string;
  category: string;
  rating: number;
  reviewCount: number;
  address: string;
  nextAvailable: string;
  services: { name: string; duration: string; price: string }[];
  accentColor: string;
}

const MOCK_BUSINESSES: MockBusiness[] = [
  {
    id: 'biz-1',
    name: 'Central Barber Studio',
    slug: 'central-barber',
    category: 'Barbería & Estilo',
    rating: 4.9,
    reviewCount: 142,
    address: 'Av. Hidalgo 402, Centro',
    nextAvailable: 'Hoy, 11:30 AM',
    services: [
      { name: 'Corte Clásico + Barba', duration: '45 min', price: '$250 MXN' },
      { name: 'Perfilado de Barba', duration: '20 min', price: '$150 MXN' },
      { name: 'Tratamiento Facial', duration: '30 min', price: '$200 MXN' },
    ],
    accentColor: '#818CF8',
  },
  {
    id: 'biz-2',
    name: 'Clínica Dental Sonrisas',
    slug: 'dental-sonrisas',
    category: 'Salud & Odontología',
    rating: 5.0,
    reviewCount: 89,
    address: 'Plaza Médica Norte, Local 12',
    nextAvailable: 'Hoy, 02:00 PM',
    services: [
      { name: 'Limpieza Dental Ultrasonido', duration: '40 min', price: '$500 MXN' },
      { name: 'Valoración y Diagnóstico', duration: '30 min', price: '$350 MXN' },
      { name: 'Blanqueamiento Express', duration: '60 min', price: '$1,200 MXN' },
    ],
    accentColor: '#34D399',
  },
  {
    id: 'biz-3',
    name: 'Zen Spa & Masajes',
    slug: 'zen-spa',
    category: 'Spa & Bienestar',
    rating: 4.8,
    reviewCount: 215,
    address: 'Calle del Sol 88, Jardines',
    nextAvailable: 'Mañana, 10:00 AM',
    services: [
      { name: 'Masaje Relajante Completo', duration: '60 min', price: '$650 MXN' },
      { name: 'Sesión de Aromaterapia', duration: '45 min', price: '$450 MXN' },
      { name: 'Exfoliación Corporal', duration: '50 min', price: '$550 MXN' },
    ],
    accentColor: '#F472B6',
  },
  {
    id: 'biz-4',
    name: 'CrossFit Apex Club',
    slug: 'crossfit-apex',
    category: 'Fitness & Entrenamiento',
    rating: 4.9,
    reviewCount: 76,
    address: 'Blvd. Industrial 1200',
    nextAvailable: 'Hoy, 05:00 PM',
    services: [
      { name: 'Clase Funcional WOD', duration: '60 min', price: '$120 MXN' },
      { name: 'Evaluación de Rendimiento', duration: '45 min', price: '$300 MXN' },
      { name: 'Pase Semanal Ilimitado', duration: '7 días', price: '$450 MXN' },
    ],
    accentColor: '#FBBF24',
  },
];

const CATEGORIES = [
  'Todos',
  'Barbería & Estilo',
  'Salud & Odontología',
  'Spa & Bienestar',
  'Fitness & Entrenamiento',
];

export default function ExploreScreen() {
  const { colors, isDark } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedBusiness, setSelectedBusiness] = useState<MockBusiness | null>(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const filteredBusinesses = MOCK_BUSINESSES.filter((biz) => {
    const matchesCategory =
      selectedCategory === 'Todos' || biz.category === selectedCategory;
    const matchesSearch =
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenDirectLink = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Enlace requerido', 'Por favor ingresa un enlace o nombre de negocio.');
      return;
    }

    const cleanSlug = searchQuery
      .replace('slotly.app/', '')
      .replace('https://slotly.app/', '')
      .trim()
      .toLowerCase();

    const found = MOCK_BUSINESSES.find(
      (b) => b.slug.toLowerCase() === cleanSlug || b.name.toLowerCase().includes(cleanSlug)
    );

    if (found) {
      setSelectedBusiness(found);
    } else {
      Alert.alert(
        'Negocio no encontrado',
        `No encontramos el negocio "${searchQuery}". Mostrando catálogo general de servicios.`
      );
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedBusiness) return;
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedBusiness(null);
      Alert.alert(
        '¡Cita Agendada con Éxito!',
        `Tu cita para "${selectedBusiness.services[selectedServiceIndex]?.name}" en ${selectedBusiness.name} ha sido reservada para ${selectedBusiness.nextAvailable}. Te enviamos los detalles a tu agenda.`
      );
    }, 1200);
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.container}>
        {/* Cabecera Glassmorphism */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark
                ? 'rgba(26, 26, 26, 0.92)'
                : 'rgba(255, 255, 255, 0.94)',
              borderBottomColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Explorar & Agendar
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.muted }]}>
            Busca establecimientos o ingresa enlaces públicos de reserva
          </Text>

          {/* Barra de Búsqueda / Link Directo */}
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
                placeholder="slotly.app/negocio o busca servicio..."
                placeholderTextColor={colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleOpenDirectLink}
                returnKeyType="go"
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.openLinkBtn,
                { backgroundColor: colors.action.primary },
              ]}
              onPress={handleOpenDirectLink}
              activeOpacity={0.8}
            >
              <Feather name="arrow-right" size={18} color={colors.action.primaryText} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner de Enlace Público Rápido */}
          <View
            style={[
              styles.quickLinkBanner,
              {
                backgroundColor: isDark
                  ? 'rgba(99, 102, 241, 0.12)'
                  : 'rgba(99, 102, 241, 0.08)',
                borderColor: isDark
                  ? 'rgba(99, 102, 241, 0.25)'
                  : 'rgba(99, 102, 241, 0.18)',
              },
            ]}
          >
            <MaterialCommunityIcons name="link-variant" size={22} color={colors.action.primary} />
            <View style={styles.bannerTextContainer}>
              <Text style={[styles.bannerTitle, { color: colors.text.primary }]}>
                ¿Tienes un enlace de reserva?
              </Text>
              <Text style={[styles.bannerSubtitle, { color: colors.text.secondary }]}>
                Pega la dirección de tu prestador de servicios en la barra superior para abrir su agenda directa.
              </Text>
            </View>
          </View>

          {/* Categorías */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected
                        ? colors.action.primary
                        : colors.background.secondary,
                      borderColor: isSelected
                        ? colors.action.primary
                        : colors.border.main,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color: isSelected
                          ? colors.action.primaryText
                          : colors.text.secondary,
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

          {/* Lista de Negocios */}
          <View style={styles.businessListSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Negocios con Citas Disponibles
              </Text>
              <Text style={[styles.sectionBadge, { color: colors.text.muted }]}>
                {filteredBusinesses.length} disponibles
              </Text>
            </View>

            {filteredBusinesses.map((biz) => (
              <View
                key={biz.id}
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
                    <Text style={[styles.bizName, { color: colors.text.primary }]}>
                      {biz.name}
                    </Text>
                    <Text style={[styles.bizCategory, { color: colors.text.muted }]}>
                      {biz.category}
                    </Text>
                  </View>

                  <View style={styles.ratingBadge}>
                    <Feather name="star" size={13} color="#FBBF24" />
                    <Text style={styles.ratingText}>
                      {biz.rating} <Text style={{ color: colors.text.muted }}>({biz.reviewCount})</Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.bizMetaRow}>
                  <Feather name="map-pin" size={13} color={colors.text.muted} />
                  <Text style={[styles.bizAddress, { color: colors.text.muted }]}>
                    {biz.address}
                  </Text>
                </View>

                {/* Badge de Próximo Horario Libre */}
                <View
                  style={[
                    styles.availabilityBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(16, 185, 129, 0.08)',
                    },
                  ]}
                >
                  <View style={styles.greenDot} />
                  <Text style={[styles.availabilityText, { color: '#10B981' }]}>
                    Próximo espacio disponible: <Text style={{ fontWeight: '700' }}>{biz.nextAvailable}</Text>
                  </Text>
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
                    <Text style={[styles.bookBtnText, { color: colors.action.primaryText }]}>
                      Reservar Cita
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal de Reserva Directa de Cita */}
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
                  borderColor: colors.border.light,
                },
              ]}
            >
              {selectedBusiness && (
                <>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={[styles.modalBizName, { color: colors.text.primary }]}>
                        {selectedBusiness.name}
                      </Text>
                      <Text style={[styles.modalBizSlug, { color: colors.text.muted }]}>
                        slotly.app/{selectedBusiness.slug}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setSelectedBusiness(null)}
                      style={styles.modalCloseBtn}
                    >
                      <Feather name="x" size={20} color={colors.text.primary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.modalSectionLabel, { color: colors.text.muted }]}>
                      SELECCIONA EL SERVICIO
                    </Text>

                    {selectedBusiness.services.map((srv, idx) => {
                      const isSrvSelected = selectedServiceIndex === idx;
                      return (
                        <TouchableOpacity
                          key={srv.name}
                          style={[
                            styles.serviceOptionCard,
                            {
                              backgroundColor: isSrvSelected
                                ? isDark
                                  ? 'rgba(99, 102, 241, 0.16)'
                                  : 'rgba(99, 102, 241, 0.10)'
                                : colors.background.secondary,
                              borderColor: isSrvSelected
                                ? colors.action.primary
                                : colors.border.main,
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
                                  borderColor: isSrvSelected
                                    ? colors.action.primary
                                    : colors.border.main,
                                },
                              ]}
                            >
                              {isSrvSelected && (
                                <View
                                  style={[
                                    styles.radioInner,
                                    { backgroundColor: colors.action.primary },
                                  ]}
                                />
                              )}
                            </View>
                            <View>
                              <Text
                                style={[
                                  styles.serviceOptionName,
                                  { color: colors.text.primary },
                                ]}
                              >
                                {srv.name}
                              </Text>
                              <Text
                                style={[
                                  styles.serviceOptionDuration,
                                  { color: colors.text.muted },
                                ]}
                              >
                                ⏱️ {srv.duration}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.serviceOptionPrice,
                              { color: colors.text.primary },
                            ]}
                          >
                            {srv.price}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    <View
                      style={[
                        styles.selectedTimeBox,
                        {
                          backgroundColor: colors.background.secondary,
                          borderColor: colors.border.main,
                        },
                      ]}
                    >
                      <Feather name="clock" size={16} color={colors.action.primary} />
                      <Text style={[styles.selectedTimeText, { color: colors.text.primary }]}>
                        Horario propuesto:{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {selectedBusiness.nextAvailable}
                        </Text>
                      </Text>
                    </View>
                  </ScrollView>

                  <TouchableOpacity
                    style={[
                      styles.confirmBookingBtn,
                      { backgroundColor: colors.action.primary },
                    ]}
                    onPress={handleConfirmBooking}
                    activeOpacity={0.8}
                    disabled={bookingSuccess}
                  >
                    <Text
                      style={[
                        styles.confirmBookingText,
                        { color: colors.action.primaryText },
                      ]}
                    >
                      {bookingSuccess ? 'Confirmando Cita...' : 'Confirmar Reserva de Cita'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
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
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 14,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  openLinkBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  quickLinkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 18,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  categoriesScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
  },
  businessListSection: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionBadge: {
    fontSize: 13,
  },
  businessCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bizHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bizTitleGroup: {
    flex: 1,
  },
  bizName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  bizCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
  },
  bizMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bizAddress: {
    fontSize: 12,
  },
  availabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  availabilityText: {
    fontSize: 12,
  },
  bizCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  slugText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBizName: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalBizSlug: {
    fontSize: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  serviceOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  serviceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  serviceOptionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  serviceOptionDuration: {
    fontSize: 12,
  },
  serviceOptionPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 16,
  },
  selectedTimeText: {
    fontSize: 13,
  },
  confirmBookingBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBookingText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
