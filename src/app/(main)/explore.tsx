import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, RefreshControl, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/shared/theme';
import { apiClient } from '@/shared/lib/api';

// ==========================================
// Types & Interfaces
// ==========================================
export interface BusinessServiceDto { id: string; name: string; price: number; durationMinutes: number; }
export type BusinessServiceItem = BusinessServiceDto;

export interface BusinessDto {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  category: string;
  categoryKey?: string;
  timeZone?: string;
  minAdvanceHours?: number;
  maxAdvanceDays?: number;
  sectorTemplateId?: number | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  services: BusinessServiceDto[];
  address?: string;
  rating?: number;
  reviewCount?: number;
}
export type Business = BusinessDto;
export type BusinessItem = BusinessDto;

export interface Category { id: string; name: string; key: string; }
export interface SearchFilters { query: string; categoryKey: string; }

const isValidHexColor = (color?: string | null): boolean => {
  if (!color || typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color.trim());
};

// ==========================================
// Hook: useExploreBusinesses
// ==========================================
function useExploreBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true); else setIsLoading(true);
      setErrorMessage(null);
      const res = await apiClient.get<BusinessDto[]>('/businesses');
      setBusinesses(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'No se pudieron cargar los negocios.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);
  return { businesses, isLoading, isRefreshing, errorMessage, refetch: fetchBusinesses };
}

// ==========================================
// Subcomponents
// ==========================================
const SkeletonCard = ({ colors }: { colors: any }) => (
  <View style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.avatarBox, { backgroundColor: colors.background.tertiary }]} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: '60%', height: 14, borderRadius: 7, backgroundColor: colors.background.tertiary }} />
        <View style={{ width: '35%', height: 10, borderRadius: 5, backgroundColor: colors.background.tertiary }} />
      </View>
    </View>
    <View style={[styles.cardFooter, { borderTopColor: colors.border.light }]}>
      <View style={{ width: 100, height: 10, borderRadius: 5, backgroundColor: colors.background.tertiary }} />
      <View style={{ width: 75, height: 28, borderRadius: 8, backgroundColor: colors.background.tertiary }} />
    </View>
  </View>
);

const EmptyState = ({ isSearching, onReset, colors }: { isSearching: boolean; onReset: () => void; colors: any }) => (
  <View style={[styles.emptyContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
    <View style={[styles.iconCircle, { backgroundColor: colors.background.tertiary }]}>
      <Feather name="search" size={26} color={colors.text.muted} />
    </View>
    <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{isSearching ? 'Sin resultados' : 'No hay negocios disponibles'}</Text>
    <Text style={[styles.emptyDesc, { color: colors.text.muted }]}>
      {isSearching ? 'Prueba con otros términos o cambia la categoría.' : 'Actualmente no hay establecimientos dados de alta.'}
    </Text>
    {isSearching && (
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.action.primary }]} onPress={onReset} accessibilityRole="button">
        <Text style={[styles.actionBtnText, { color: colors.action.primaryText }]}>Restablecer filtros</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ErrorState = ({ message, onRetry, colors }: { message: string; onRetry: () => void; colors: any }) => (
  <View style={[styles.emptyContainer, { backgroundColor: colors.background.secondary, borderColor: '#EF444450' }]}>
    <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
      <Feather name="alert-triangle" size={26} color="#EF4444" />
    </View>
    <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Error de conexión</Text>
    <Text style={[styles.emptyDesc, { color: colors.text.muted }]}>{message}</Text>
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.action.primary }]} onPress={onRetry} accessibilityRole="button">
      <Feather name="refresh-cw" size={14} color={colors.action.primaryText} />
      <Text style={[styles.actionBtnText, { color: colors.action.primaryText }]}>Reintentar</Text>
    </TouchableOpacity>
  </View>
);

const BusinessCard = ({ business, onBook, colors, isDark }: { business: BusinessDto; onBook: (slug: string) => void; colors: any; isDark: boolean }) => {
  const [imageError, setImageError] = useState(false);
  const initial = business.name ? business.name.charAt(0).toUpperCase() : 'S';
  const category = business.category || 'Servicios Generales';
  const hasPhone = Boolean(business.phone && business.phone.trim().length > 0);
  const hasAdvance = typeof business.minAdvanceHours === 'number' && business.minAdvanceHours > 0;
  const services = business.services || [];
  const accentColor = isValidHexColor(business.brandColor) ? business.brandColor! : colors.action.primary;
  const hasValidLogo = Boolean(business.logoUrl && business.logoUrl.trim().length > 0 && !imageError);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border.main }]}
      onPress={() => onBook(business.slug)}
      activeOpacity={0.88}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Negocio ${business.name}, categoría ${category}. Toca para reservar`}
    >
      <View style={styles.cardHeader}>
        {hasValidLogo ? (
          <Image
            source={{ uri: business.logoUrl! }}
            style={[styles.avatarImage, { borderColor: accentColor + '40' }]}
            resizeMode="cover"
            onError={() => setImageError(true)}
            accessibilityLabel={`Logotipo de ${business.name}`}
          />
        ) : (
          <View style={[styles.avatarBox, { backgroundColor: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(99,102,241,0.12)', borderColor: accentColor }]}>
            <Text style={[styles.avatarText, { color: isDark ? '#A78BFA' : accentColor }]}>{initial}</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.businessName, { color: colors.text.primary }]} numberOfLines={1}>{business.name}</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={[styles.categoryBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.10)' }]}>
              <Text style={[styles.categoryBadgeText, { color: isDark ? '#818CF8' : colors.action.primary }]}>{category}</Text>
            </View>
          </View>
        </View>
      </View>

      {services.length > 0 && (
        <View style={styles.servicesContainer}>
          <View style={styles.servicesHeaderRow}>
            <Text style={[styles.servicesLabel, { color: colors.text.muted }]}>Servicios destacados</Text>
            <Text style={[styles.servicesNote, { color: colors.text.muted }]}>Más al agendar</Text>
          </View>
          <View style={styles.servicesList}>
            {services.slice(0, 2).map((svc) => (
              <View
                key={svc.id}
                style={[styles.serviceBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border.light }]}
                accessible={true}
                accessibilityLabel={`${svc.name}, precio ${Number(svc.price).toFixed(2)} pesos, duración ${svc.durationMinutes} minutos`}
              >
                <Text style={[styles.serviceBadgeName, { color: colors.text.primary }]} numberOfLines={1}>{svc.name}</Text>
                <View style={styles.serviceBadgeMeta}>
                  <Text style={[styles.serviceBadgePrice, { color: accentColor }]}>${Number(svc.price).toFixed(2)}</Text>
                  <Text style={[styles.serviceBadgeDuration, { color: colors.text.muted }]}>• {svc.durationMinutes} min</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {(hasPhone || hasAdvance) && (
        <View style={styles.metaContainer}>
          {hasPhone && (
            <View style={styles.metaItem} accessible={true} accessibilityLabel={`Teléfono: ${business.phone}`}>
              <Feather name="phone" size={12} color={colors.text.muted} />
              <Text style={[styles.metaText, { color: colors.text.secondary }]}>{business.phone}</Text>
            </View>
          )}
          {hasAdvance && (
            <View style={styles.metaItem} accessible={true} accessibilityLabel={`Anticipación mínima: ${business.minAdvanceHours} horas`}>
              <Feather name="clock" size={12} color={colors.text.muted} />
              <Text style={[styles.metaText, { color: colors.text.secondary }]}>Anticipación mín.: {business.minAdvanceHours}h</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.cardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border.light }]}>
        <View style={styles.slugContainer}>
          <MaterialCommunityIcons name="web" size={13} color={colors.text.muted} />
          <Text style={[styles.slugText, { color: colors.text.muted }]} numberOfLines={1}>slotify.app/{business.slug}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: accentColor }]}
          onPress={() => onBook(business.slug)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Reservar cita en ${business.name}`}
        >
          <Feather name="calendar" size={12} color="#FFFFFF" />
          <Text style={[styles.bookBtnText, { color: '#FFFFFF' }]}>Reservar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// Screen Component: ExploreScreen
// ==========================================
export default function ExploreScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { businesses, isLoading, isRefreshing, errorMessage, refetch } = useExploreBusinesses();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('all');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchInput.trim()), 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    AsyncStorage.getItem('consumerInterests')
      .then((val) => {
        if (!val) return;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length > 0) setSelectedCategoryKey(parsed[0].toLowerCase());
      })
      .catch(() => {});
  }, []);

  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, string>();
    businesses.forEach((b) => {
      if (b.category && b.category.trim()) {
        const key = b.categoryKey?.toLowerCase() || b.category.toLowerCase().trim();
        if (!map.has(key)) map.set(key, b.category.trim());
      }
    });
    const list: Category[] = [{ id: 'all', name: 'Todos', key: 'all' }];
    map.forEach((name, key) => list.push({ id: key, name, key }));
    return list;
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const query = debouncedQuery.toLowerCase();
    const activeKey = selectedCategoryKey.toLowerCase();
    return businesses.filter((b) => {
      const bKey = (b.categoryKey || b.category || '').toLowerCase();
      if (activeKey !== 'all' && !bKey.includes(activeKey)) return false;
      if (!query) return true;
      return (
        (b.name && b.name.toLowerCase().includes(query)) ||
        (b.slug && b.slug.toLowerCase().includes(query)) ||
        (b.category && b.category.toLowerCase().includes(query)) ||
        (b.phone && b.phone.toLowerCase().includes(query))
      );
    });
  }, [businesses, debouncedQuery, selectedCategoryKey]);

  const handleNavigateToBook = useCallback((slug: string) => {
    if (slug) router.push(`/book/${slug}` as any);
  }, [router]);

  const handleDirectSearch = () => {
    const clean = searchInput.replace(/^https?:\/\//i, '').replace(/^(?:www\.)?slot(?:ly|ify)\.app\//i, '').trim().toLowerCase();
    if (!clean) return;
    const found = businesses.find((b) => b.slug?.toLowerCase() === clean || b.name?.toLowerCase() === clean);
    handleNavigateToBook(found ? found.slug : clean);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(18,18,24,0.96)' : 'rgba(255,255,255,0.96)', borderBottomColor: colors.border.main }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Explorar & Agendar</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>Encuentra negocios registrados y reserva tu cita en línea</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
            <Feather name="search" size={16} color={colors.text.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Buscar por negocio o enlace..."
              placeholderTextColor={colors.text.muted}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleDirectSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Buscar negocios"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => setSearchInput('')} accessibilityRole="button" accessibilityLabel="Borrar búsqueda">
                <Feather name="x" size={15} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.action.primary }]} onPress={handleDirectSearch} activeOpacity={0.8} accessibilityRole="button">
            <Feather name="arrow-right" size={17} color={colors.action.primaryText} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategoryKey === cat.key;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, { backgroundColor: isSelected ? colors.action.primary : colors.background.secondary, borderColor: isSelected ? colors.action.primary : colors.border.main }]}
                onPress={() => setSelectedCategoryKey(cat.key)}
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.categoryChipText, { color: isSelected ? colors.action.primaryText : colors.text.secondary, fontWeight: isSelected ? '700' : '500' }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {isLoading && businesses.length === 0 ? (
          <View style={styles.listPadding}>
            <SkeletonCard colors={colors} /><SkeletonCard colors={colors} /><SkeletonCard colors={colors} />
          </View>
        ) : errorMessage && businesses.length === 0 ? (
          <View style={styles.listPadding}>
            <ErrorState message={errorMessage} onRetry={() => refetch()} colors={colors} />
          </View>
        ) : (
          <FlatList
            data={filteredBusinesses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BusinessCard business={item} onBook={handleNavigateToBook} colors={colors} isDark={isDark} />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => refetch(true)} tintColor={colors.action.primary} />}
            ListHeaderComponent={
              filteredBusinesses.length > 0 ? (
                <View style={{ marginBottom: 10 }}>
                  <Text style={[styles.resultsText, { color: colors.text.muted }]}>
                    {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'establecimiento' : 'establecimientos'}
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                isSearching={debouncedQuery.length > 0 || selectedCategoryKey !== 'all'}
                onReset={() => { setSearchInput(''); setSelectedCategoryKey('all'); }}
                colors={colors}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// Styles
// ==========================================
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1, gap: 10 },
  headerTitle: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, lineHeight: 17 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  searchBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryScroll: { gap: 8, paddingVertical: 2 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, borderWidth: 1 },
  categoryChipText: { fontSize: 13 },
  flatListContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 },
  listPadding: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  resultsText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  businessName: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontWeight: '700' },
  servicesContainer: { gap: 6, marginTop: 2 },
  servicesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  servicesLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  servicesNote: { fontSize: 11, fontStyle: 'italic' },
  servicesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  serviceBadgeName: { fontSize: 12, fontWeight: '600' },
  serviceBadgeMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  serviceBadgePrice: { fontSize: 12, fontWeight: '700' },
  serviceBadgeDuration: { fontSize: 11 },
  metaContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
  slugContainer: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  slugText: { fontSize: 12, fontWeight: '500' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9 },
  bookBtnText: { fontSize: 12, fontWeight: '700' },
  emptyContainer: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 10, marginTop: 10 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, marginTop: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
});
