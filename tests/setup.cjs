// Solo se sustituyen dependencias nativas/visuales; se usa el componente real.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const animation = {
    delay: () => animation,
    springify: () => animation,
    damping: () => animation,
    stiffness: () => animation,
  };
  return {
    __esModule: true,
    default: { View },
    FadeInDown: animation,
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (factory) => factory(),
    withSpring: (value) => value,
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
