import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';
import {
  useCalendarStore,
  resolveSessionScopeKey,
} from '@/features/calendar/model';
import {
  useClientsStore,
  buildUnifiedBusinessClients,
  filterBusinessClients,
  normalizeClientKey,
} from '../../model';
import type {
  BusinessClient,
  ClientFilterSegment,
  ClientManagementAction,
  UpsertClientPayload,
} from '../../types';
import { ClientCard } from '../components/ClientCard';
import { CreateClientModal } from '../components/CreateClientModal';
import { ClientDetailModal } from '../components/ClientDetailModal';
import { appointmentHaptic } from '@/features/settings/model/preferences';

export function ClientsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { slots, timeZone } = useCalendarStore();

  const {
    apiClients,
    manualClients,
    clientNotes,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    searchQuery,
    activeSegment,
    loadClients,
    setSearchQuery,
    setActiveSegment,
    saveClient,
    updateClientNote,
    manageClient,
  } = useClientsStore();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<BusinessClient | null>(null);
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(
    null
  );

  const scopeKey = useMemo(
    () => resolveSessionScopeKey(user),
    [user?.businessId, user?.id, user?.email]
  );

  useFocusEffect(useCallback(() => {
    void loadClients(scopeKey);
    const calendar = useCalendarStore.getState();
    if (!calendar.timeZone) void calendar.loadSlots(scopeKey);
  }, [loadClients, scopeKey]));

  // Cartera unificada (Backend GET /api/clients + Clientes manuales + Citas reales en Agenda)
  const portfolio = useMemo(
    () =>
      buildUnifiedBusinessClients(
        apiClients,
        manualClients,
        slots,
        clientNotes,
        true
      ),
    [apiClients, manualClients, slots, clientNotes]
  );
  const unifiedClients = useMemo(() => portfolio.filter((client) => !client.archivedAt), [portfolio]);
  const archivedCount = portfolio.length - unifiedClients.length;
  const showingArchived = activeSegment === 'archived';

  // Lista filtrada por búsqueda y segmento
  const filteredClients = useMemo(
    () => filterBusinessClients(portfolio, searchQuery, activeSegment),
    [portfolio, searchQuery, activeSegment]
  );

  // Cliente actualmente abierto en el modal de detalle
  const selectedClient = useMemo(() => {
    if (!selectedClientKey) return null;
    return (
      portfolio.find(
        (c) =>
          c.id === selectedClientKey ||
          normalizeClientKey(c) === selectedClientKey
      ) ?? null
    );
  }, [portfolio, selectedClientKey]);

  // Métricas superiores
  const metrics = useMemo(() => {
    const total = unifiedClients.length;
    const withUpcoming = unifiedClients.filter((c) =>
      Boolean(c.nextVisitAt)
    ).length;
    const frequent = unifiedClients.filter((c) => c.totalVisits >= 2).length;
    const newClients = unifiedClients.filter((c) => c.totalVisits <= 1).length;

    return { total, withUpcoming, frequent, newClients };
  }, [unifiedClients]);

  const filterChips: {
    key: ClientFilterSegment;
    label: string;
    count: number;
  }[] = [
    { key: 'all', label: 'Todos', count: metrics.total },
    { key: 'archived', label: 'Archivados', count: archivedCount },
    { key: 'upcoming', label: 'Próxima cita', count: metrics.withUpcoming },
    { key: 'frequent', label: 'Frecuentes', count: metrics.frequent },
    { key: 'new', label: 'Nuevos', count: metrics.newClients },
  ];

  const handleRefresh = async () => {
    await loadClients(scopeKey, true);
  };

  const handleOpenCreate = () => {
    setClientToEdit(null);
    setCreateModalVisible(true);
  };

  const handleOpenEditFromDetail = (client: BusinessClient) => {
    setSelectedClientKey(null);
    setClientToEdit(client);
    setCreateModalVisible(true);
  };

  const handleSaveClient = async (payload: UpsertClientPayload) => {
    const saved = await saveClient(payload, scopeKey);
    appointmentHaptic(true);
    setCreateModalVisible(false);
    setClientToEdit(null);
    setSelectedClientKey(normalizeClientKey(saved));
  };

  const handleSaveNote = async (client: BusinessClient, note: string) => {
    const saved = await updateClientNote(client, note, scopeKey);
    if (saved) {
      appointmentHaptic(true);
      const originalKey = normalizeClientKey(client);
      setSelectedClientKey((key) =>
        key === originalKey || key === client.id ? normalizeClientKey(saved) : key
      );
    }
  };

  const handleScheduleForClient = (client: BusinessClient) => {
    useCalendarStore.getState().prepareAppointment({
      scopeKey,
      client: {
        businessClientId: client.isRegistered ? client.clientId ?? undefined : undefined,
        fullName: client.fullName,
        phone: client.phone,
        email: client.email,
      },
    });
    setSelectedClientKey(null);
    router.push('/(main)/agenda' as any);
  };

  const handleManageClient = async (client: BusinessClient, action: ClientManagementAction) => {
    await manageClient(client, action, scopeKey);
    setSelectedClientKey(null);
  };

  return (
    <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        {/* Header superior alineado a la estética de Inicio y Agenda */}
        <Animated.View
          entering={FadeInDown.duration(350)}
          style={s.headerContainer}
        >
          <View style={s.headerLeft}>
            <Text style={[s.headerEyebrow, { color: colors.text.muted }]}>
              CARTERA DEL NEGOCIO
            </Text>
            <Text style={[s.headerTitle, { color: colors.text.primary }]}>
              Clientes
            </Text>
          </View>

          <View style={s.headerActions}>
            <TouchableOpacity
              testID="btn-open-create-client"
              activeOpacity={0.82}
              onPress={handleOpenCreate}
              style={s.addClientBtn}
            >
              <Feather name="user-plus" size={15} color="#FFFFFF" />
              <Text style={s.addClientBtnText}>+ Nuevo</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#6366F1"
            />
          }
        >
          {/* Tarjetas KPI de Cartera */}
          <Animated.View
            entering={FadeInDown.delay(60).duration(380)}
            style={s.kpiRow}
          >
            <View
              style={[
                s.kpiCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <View
                style={[
                  s.kpiIconWrap,
                  { backgroundColor: 'rgba(99, 102, 241, 0.14)' },
                ]}
              >
                <Feather name="users" size={16} color="#6366F1" />
              </View>
              <Text
                testID="kpi-total-clients"
                style={[s.kpiNumber, { color: colors.text.primary }]}
              >
                {metrics.total}
              </Text>
              <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                Total Clientes
              </Text>
            </View>

            <View
              style={[
                s.kpiCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <View
                style={[
                  s.kpiIconWrap,
                  { backgroundColor: 'rgba(16, 185, 129, 0.14)' },
                ]}
              >
                <Feather name="calendar" size={16} color="#10B981" />
              </View>
              <Text style={[s.kpiNumber, { color: colors.text.primary }]}>
                {metrics.withUpcoming}
              </Text>
              <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                Próxima Cita
              </Text>
            </View>

            <View
              style={[
                s.kpiCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <View
                style={[
                  s.kpiIconWrap,
                  { backgroundColor: 'rgba(245, 158, 11, 0.14)' },
                ]}
              >
                <Feather name="award" size={16} color="#F59E0B" />
              </View>
              <Text style={[s.kpiNumber, { color: colors.text.primary }]}>
                {metrics.frequent}
              </Text>
              <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                Frecuentes
              </Text>
            </View>
          </Animated.View>

          {/* Barra de búsqueda */}
          <Animated.View
            entering={FadeInDown.delay(110).duration(380)}
            style={[
              s.searchContainer,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.main,
              },
            ]}
          >
            <Feather name="search" size={17} color={colors.text.muted} />
            <TextInput
              testID="clients-search-input"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nombre, teléfono, correo o nota..."
              placeholderTextColor={colors.text.muted}
              style={[s.searchInput, { color: colors.text.primary }]}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                testID="btn-clear-search"
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x-circle" size={17} color={colors.text.muted} />
              </TouchableOpacity>
            ) : null}
          </Animated.View>

          {/* Chips de segmentación */}
          <Animated.View entering={FadeInDown.delay(150).duration(380)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsScroll}
            >
              {filterChips.map((chip) => {
                const isSelected = activeSegment === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    testID={`filter-chip-${chip.key}`}
                    activeOpacity={0.8}
                    onPress={() => setActiveSegment(chip.key)}
                    style={[
                      s.filterChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(99, 102, 241, 0.22)'
                            : '#EEF2FF'
                          : colors.background.secondary,
                        borderColor: isSelected
                          ? '#6366F1'
                          : colors.border.main,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.filterChipText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#818CF8'
                              : '#4F46E5'
                            : colors.text.secondary,
                        },
                      ]}
                    >
                      {chip.label} ({chip.count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {error && (
            <View style={[s.syncError, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
              <View style={s.syncErrorMessage} accessibilityLiveRegion="polite">
                <Text style={[s.emptyTitle, { color: colors.text.primary }]}>No se pudo sincronizar la cartera</Text>
                <Text style={{ color: colors.text.secondary }}>{error}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => loadClients(scopeKey, true)}
                style={s.syncRetry}
              >
                <Text style={s.syncRetryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {(isLoading || isRefreshing) && portfolio.length === 0 ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={[s.loadingText, { color: colors.text.secondary }]}>
                Sincronizando cartera de clientes...
              </Text>
            </View>
          ) : error && filteredClients.length === 0 ? null : showingArchived && archivedCount === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.main }]}>
              <Feather name="archive" size={26} color={colors.text.muted} />
              <Text style={[s.emptyTitle, { color: colors.text.primary }]}>
                Aún no hay clientes archivados
              </Text>
            </View>
          ) : !showingArchived && unifiedClients.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(190).duration(400)}
              testID="clients-empty-state"
              style={[
                s.emptyCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <View
                style={[
                  s.emptyIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(99, 102, 241, 0.14)'
                      : '#EEF2FF',
                  },
                ]}
              >
                <Feather name="users" size={28} color="#6366F1" />
              </View>

              <Text style={[s.emptyTitle, { color: colors.text.primary }]}>
                Aún no tienes clientes registrados
              </Text>
              <Text style={[s.emptySubtitle, { color: colors.text.secondary }]}>
                Tu cartera se construye automáticamente con los clientes que
                agendan citas en tu negocio o puedes registrarlos manualmente
                desde aquí.
              </Text>

              <View style={s.emptyActionsRow}>
                <TouchableOpacity
                  testID="btn-empty-create-client"
                  activeOpacity={0.85}
                  onPress={handleOpenCreate}
                  style={s.primaryActionBtn}
                >
                  <Feather name="user-plus" size={16} color="#FFFFFF" />
                  <Text style={s.primaryActionBtnText}>Registrar Cliente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="btn-empty-go-agenda"
                  activeOpacity={0.85}
                  onPress={() => router.push('/(main)/agenda' as any)}
                  style={[
                    s.secondaryActionBtn,
                    {
                      backgroundColor: colors.background.primary,
                      borderColor: colors.border.main,
                    },
                  ]}
                >
                  <Feather
                    name="calendar"
                    size={15}
                    color={colors.text.primary}
                  />
                  <Text
                    style={[
                      s.secondaryActionBtnText,
                      { color: colors.text.primary },
                    ]}
                  >
                    Ir a la Agenda
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : filteredClients.length === 0 ? (
            <View
              testID="clients-search-empty-state"
              style={[
                s.emptyCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <Feather name="search" size={26} color={colors.text.muted} />
              <Text style={[s.emptyTitle, { color: colors.text.primary }]}>
                Sin coincidencias
              </Text>
              <Text style={[s.emptySubtitle, { color: colors.text.secondary }]}>
                No encontramos clientes que coincidan con los filtros actuales.
              </Text>
              <TouchableOpacity
                testID="btn-reset-filters"
                onPress={() => {
                  setSearchQuery('');
                  setActiveSegment('all');
                }}
                style={s.resetFiltersBtn}
              >
                <Text style={s.resetFiltersText}>Limpiar filtros</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.listContainer}>
              {filteredClients.map((client) => (
                <ClientCard
                  timeZone={timeZone ?? undefined}
                  key={client.id}
                  client={client}
                  onPress={(c) => setSelectedClientKey(normalizeClientKey(c))}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Modal para Registrar o Editar Cliente */}
      <CreateClientModal
        visible={createModalVisible}
        initialClient={clientToEdit}
        isSaving={isSaving}
        onClose={() => {
          setCreateModalVisible(false);
          setClientToEdit(null);
        }}
        onSave={handleSaveClient}
      />

      {/* Modal de Detalle e Historial de Citas del Cliente */}
      <ClientDetailModal
        timeZone={timeZone ?? undefined}
        visible={Boolean(selectedClient)}
        client={selectedClient}
        onClose={() => setSelectedClientKey(null)}
        onEditClient={handleOpenEditFromDetail}
        onSaveNote={handleSaveNote}
        onScheduleAppointment={handleScheduleForClient}
        onManageClient={handleManageClient}
      />
    </View>
  );
}

const s = StyleSheet.create({
  syncError: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  syncErrorMessage: { gap: 4 },
  syncRetry: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  syncRetryText: { color: '#6366F1', fontWeight: '700' },
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addClientBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 13,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resetFiltersBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  resetFiltersText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    marginTop: 2,
  },
});
