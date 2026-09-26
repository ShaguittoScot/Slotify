import { isFeatureEnabled } from '../FeatureFlags';

describe('FeatureFlags', () => {
  it('should return boolean values for feature flags', () => {
    const isNewDashboardEnabled = isFeatureEnabled('ENABLE_NEW_DASHBOARD');
    expect(typeof isNewDashboardEnabled).toBe('boolean');
  });
  
  it('should return boolean values for preview channel', () => {
    const isBetaChannel = isFeatureEnabled('BETA_PREVIEW_CHANNEL');
    expect(typeof isBetaChannel).toBe('boolean');
  });
});
