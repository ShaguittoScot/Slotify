export const FeatureFlags = {
  // Ejemplos de feature flags (rollout simulado o canal preview)
  ENABLE_NEW_DASHBOARD: process.env.EXPO_PUBLIC_ENABLE_NEW_DASHBOARD === 'true',
  BETA_PREVIEW_CHANNEL: process.env.EXPO_PUBLIC_BETA_PREVIEW_CHANNEL === 'true',
};

// Utilidad para evaluar features
export const isFeatureEnabled = (featureName: keyof typeof FeatureFlags) => {
  return FeatureFlags[featureName] || false;
};
