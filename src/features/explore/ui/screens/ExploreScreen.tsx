import { useAppTheme } from '@/shared/theme';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  selectExploreCategories,
  selectFilteredBusinesses,
  useExploreStore,
} from '../../model';
import { BusinessCard } from '../components/BusinessCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ExploreHeader } from '../components/ExploreHeader';
import { SkeletonCard } from '../components/SkeletonCard';
import { createExploreScreenStyles } from '../styles/exploreScreen.styles';

export function ExploreScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createExploreScreenStyles(colors), [colors]);

  const {
    businesses,
    isLoading,
    isRefreshing,
    errorMessage,
    searchInput,
    debouncedQuery,
    selectedCategoryKey,
    fetchBusinesses,
    setSearchInput,
    setDebouncedQuery,
    setSelectedCategoryKey,
    resetFilters,
    initInterests,
  } = useExploreStore();

  // Cargar datos y preferencias de consumidor al montar
  useEffect(() => {
    fetchBusinesses();
    initInterests();
  }, [fetchBusinesses, initInterests]);

  // Debounce del input de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput, setDebouncedQuery]);

  // Categorías calculadas dinámicamente
  const categories = useMemo(
    () => selectExploreCategories(businesses),
    [businesses]
  );

  // Asegurar que siempre haya una categoría válida seleccionada (por defecto 'all' / "Todos")
  const activeCategoryKey = useMemo(() => {
    if (!selectedCategoryKey || selectedCategoryKey === 'all') return 'all';
    const exists = categories.some((c) => c.key.toLowerCase() === selectedCategoryKey.toLowerCase());
    return exists ? selectedCategoryKey : 'all';
  }, [categories, selectedCategoryKey]);

  // Lista filtrada reactiva
  const filteredBusinesses = useMemo(
    () =>
      selectFilteredBusinesses(
        businesses,
        debouncedQuery,
        activeCategoryKey
      ),
    [businesses, debouncedQuery, activeCategoryKey]
  );

  const handleNavigateToDetail = useCallback(
    (slug: string) => {
      if (slug) {
        router.push(`/business/${slug}` as any);
      }
    },
    [router]
  );

  const handleDirectSearch = useCallback(() => {
    const clean = searchInput
      .replace(/^https?:\/\//i, '')
      .replace(/^(?:www\.)?slot(?:ly|ify)\.app\//i, '')
      .trim()
      .toLowerCase();

    if (!clean) return;

    const found = businesses.find(
      (b) =>
        b.slug?.toLowerCase() === clean || b.name?.toLowerCase() === clean
    );
    handleNavigateToDetail(found ? found.slug : clean);
  }, [searchInput, businesses, handleNavigateToDetail]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ExploreHeader
        searchInput={searchInput}
        onChangeSearch={setSearchInput}
        onSubmitSearch={handleDirectSearch}
        onClearSearch={() => setSearchInput('')}
        categories={categories}
        selectedCategoryKey={activeCategoryKey}
        onSelectCategory={setSelectedCategoryKey}
      />

      <View style={styles.content}>
        {isLoading && businesses.length === 0 ? (
          <View style={styles.listPadding}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : errorMessage && businesses.length === 0 ? (
          <View style={styles.listPadding}>
            <ErrorState
              message={errorMessage}
              onRetry={() => fetchBusinesses()}
            />
          </View>
        ) : (
          <FlatList
            data={filteredBusinesses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BusinessCard
                business={item}
                onSelect={handleNavigateToDetail}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchBusinesses(true)}
                tintColor={colors.action.primary}
              />
            }
            ListHeaderComponent={
              filteredBusinesses.length > 0 ? (
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsText}>
                    {filteredBusinesses.length}{' '}
                    {filteredBusinesses.length === 1
                      ? 'establecimiento'
                      : 'establecimientos'}
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                isSearching={
                  debouncedQuery.length > 0 || activeCategoryKey !== 'all'
                }
                onReset={resetFilters}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
