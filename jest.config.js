module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.cjs'],
  clearMocks: true,
  collectCoverageFrom: ['src/features/sector-templates/ui/SectorTemplateCard.tsx'],
  coverageDirectory: '<rootDir>/coverage',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    '^react-native/setup-env$': '<rootDir>/jest-setup-mock.js'
  }
};
