
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { storage } from '../storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('get', () => {
    it('reads values from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('"dark"');

      await expect(storage.get('theme')).resolves.toBe('dark');
    });

    it('uses SecureStore when AsyncStorage returns null', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('"dark"');

      await expect(storage.get('theme')).resolves.toBe('dark');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        'theme',
        expect.any(Object),
      );
    });

    it('uses memory when persistent storage is unavailable', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('AsyncStorage unavailable'),
      );
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore unavailable'),
      );

      await storage.set('theme', 'dark');

      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('AsyncStorage unavailable'),
      );
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore unavailable'),
      );

      await expect(storage.get('theme')).resolves.toBe('dark');
    });
  });

  describe('set', () => {
    it('writes to AsyncStorage', async () => {
      await storage.set('theme', 'dark');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('uses SecureStore when AsyncStorage fails', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('AsyncStorage unavailable'),
      );

      await storage.set('theme', 'dark');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'theme',
        'dark',
        expect.any(Object),
      );
    });
  });

  describe('remove', () => {
    it('removes values from both persistent stores', async () => {
      await storage.remove('theme');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('theme');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('theme');
    });

    it('throws when both persistent removals fail', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(
        new Error('AsyncStorage unavailable'),
      );
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(
        new Error('SecureStore unavailable'),
      );

      await expect(storage.remove('theme')).rejects.toThrow(
        'Could not remove',
      );
    });
  });

  describe('clear', () => {
    it('clears AsyncStorage', async () => {
      await storage.clear();

      expect(AsyncStorage.clear).toHaveBeenCalled();
    });
  });
});
