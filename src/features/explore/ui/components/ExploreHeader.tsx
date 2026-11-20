import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
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
    <Animated.View
      entering={FadeInDown.duration(380).springify()}
      style={styles.header}
    >
      <View style={styles.titleRow}>
        <View>
          <View style={styles.tagRow}>
            <View style={styles.tagDot} />
            <Text style={styles.tagLabel}>DIRECTORIO</Text>
          </View>
          <Text style={styles.headerTitle}>Explorar</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={15} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar establecimiento o servicio..."
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
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isSelected =
            (selectedCategoryKey || 'all').toLowerCase() === cat.key.toLowerCase();
          return (
            <AnimatedPressable
              key={cat.id}
              scaleDown={0.95}
              style={[
                styles.categoryChip,
                isSelected
                  ? styles.categoryChipActive
                  : styles.categoryChipInactive,
              ]}
              onPress={() => onSelectCategory(cat.key)}
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
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
