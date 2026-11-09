import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useAppTheme } from '@/shared/theme';
import { createFeedbackStatesStyles } from '../styles/feedbackStates.styles';

export function SkeletonCard() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFeedbackStatesStyles(colors), [colors]);

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonInfo}>
          <View style={styles.skeletonBarLong} />
          <View style={styles.skeletonBarShort} />
        </View>
      </View>
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonPill} />
        <View style={styles.skeletonBtn} />
      </View>
    </View>
  );
}
