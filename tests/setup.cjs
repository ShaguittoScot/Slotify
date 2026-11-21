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

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
  MaterialCommunityIcons: () => null,
  FontAwesome5: () => null,
  AntDesign: () => null,
  Ionicons: () => null,
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  useSegments: () => [],
}));

