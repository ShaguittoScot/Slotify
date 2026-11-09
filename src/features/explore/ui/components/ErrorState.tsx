import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { createFeedbackStatesStyles } from '../styles/feedbackStates.styles';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFeedbackStatesStyles(colors), [colors]);

  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconCircle}>
        <Feather name="alert-triangle" size={26} color={colors.status.error} />
      </View>
      <Text style={styles.title}>Error de conexión</Text>
      <Text style={styles.description}>{message}</Text>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onRetry}
        accessibilityRole="button"
      >
        <Feather
          name="refresh-cw"
          size={14}
          color={colors.action.primaryText}
        />
        <Text style={styles.actionBtnText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}
