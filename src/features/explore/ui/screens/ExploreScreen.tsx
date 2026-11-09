import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/shared/theme';

import {
  useExploreStore,
  selectExploreCategories,
  selectFilteredBusinesses,
} from '../../model';
import { ExploreHeader } from '../components/ExploreHeader';
import { BusinessCard } from '../components/BusinessCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
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

  // Lista filtrada reactiva
  const filteredBusinesses = useMemo(
    () =>
      selectFilteredBusinesses(
        businesses,
        debouncedQuery,
        selectedCategoryKey
      ),
    [businesses, debouncedQuery, selectedCategoryKey]
  );

  const handleNavigateToBook = useCallback(
    (slug: string) => {
      if (slug) {
        router.push(`/book/${slug}` as any);
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
    handleNavigateToBook(found ? found.slug : clean);
  }, [searchInput, businesses, handleNavigateToBook]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ExploreHeader
        searchInput={searchInput}
        onChangeSearch={setSearchInput}
        onSubmitSearch={handleDirectSearch}
        onClearSearch={() => setSearchInput('')}
        categories={categories}
        selectedCategoryKey={selectedCategoryKey}
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
                onBook={handleNavigateToBook}
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
                  debouncedQuery.length > 0 || selectedCategoryKey !== 'all'
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
