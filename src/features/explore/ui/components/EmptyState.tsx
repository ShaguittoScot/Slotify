import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { createFeedbackStatesStyles } from '../styles/feedbackStates.styles';

interface EmptyStateProps {
  isSearching: boolean;
  onReset: () => void;
}

export function EmptyState({ isSearching, onReset }: EmptyStateProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFeedbackStatesStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name="search" size={26} color={colors.text.muted} />
      </View>
      <Text style={styles.title}>
        {isSearching ? 'Sin resultados' : 'No hay negocios disponibles'}
      </Text>
      <Text style={styles.description}>
        {isSearching
          ? 'Prueba con otros términos o cambia la categoría.'
          : 'Actualmente no hay establecimientos dados de alta.'}
      </Text>
      {isSearching && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onReset}
          accessibilityRole="button"
        >
          <Text style={styles.actionBtnText}>Restablecer filtros</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
