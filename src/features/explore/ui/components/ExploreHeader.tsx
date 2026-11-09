import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { Category } from '../../types';
import { createExploreHeaderStyles } from '../styles/exploreHeader.styles';

interface ExploreHeaderProps {
  searchInput: string;
  onChangeSearch: (text: string) => void;
  onSubmitSearch: () => void;
  onClearSearch: () => void;
  categories: Category[];
  selectedCategoryKey: string;
  onSelectCategory: (key: string) => void;
}

export function ExploreHeader({
  searchInput,
  onChangeSearch,
  onSubmitSearch,
  onClearSearch,
  categories,
  selectedCategoryKey,
  onSelectCategory,
}: ExploreHeaderProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createExploreHeaderStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Explorar & Agendar</Text>
        <Text style={styles.headerSubtitle}>
          Encuentra negocios registrados y reserva tu cita en línea
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por negocio o enlace..."
            placeholderTextColor={colors.text.muted}
            value={searchInput}
            onChangeText={onChangeSearch}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Buscar negocios"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={onClearSearch}
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
            >
              <Feather name="x" size={15} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={onSubmitSearch}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ejecutar búsqueda"
        >
          <Feather name="arrow-right" size={17} color={colors.action.primaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategoryKey === cat.key;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                isSelected ? styles.categoryChipActive : styles.categoryChipInactive,
              ]}
              onPress={() => onSelectCategory(cat.key)}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected
                    ? styles.categoryChipTextActive
                    : styles.categoryChipTextInactive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
