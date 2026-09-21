import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme, ThemeMode } from './useTheme';

interface ThemeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ThemeOption {
  id: ThemeMode;
  label: string;
  description: string;
  icon: (color: string) => React.ReactNode;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, palette, themeMode, setThemeMode, isDark } = useAppTheme();

  const options: ThemeOption[] = [
    {
      id: 'system',
      label: 'Automático (Dispositivo)',
      description: 'Sigue la configuración de tema de tu sistema operativo.',
      icon: (color) => <Feather name="smartphone" size={20} color={color} />,
    },
    {
      id: 'light',
      label: 'Modo Claro',
      description: 'Fondo luminoso y limpio en grises neutros.',
      icon: (color) => <Feather name="sun" size={20} color={color} />,
    },
    {
      id: 'dark',
      label: 'Modo Oscuro (Neutral Black)',
      description: 'Fondo en negro mate y gris oscuro sin matices azules.',
      icon: (color) => <Feather name="moon" size={20} color={color} />,
    },
  ];

  const handleSelect = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.main,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabecera del modal */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Ajustes de Tema
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                Selecciona la apariencia visual de la app
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.background.tertiary },
              ]}
            >
              <Feather name="x" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Opciones */}
          <View style={styles.optionsList}>
            {options.map((item) => {
              const isSelected = themeMode === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? colors.background.tertiary
                          : palette.neutral[100]
                        : colors.background.tertiary,
                      borderColor: isSelected
                        ? colors.border.focus
                        : colors.border.light,
                    },
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconWrapper,
                      {
                        backgroundColor: isSelected
                          ? colors.action.primary
                          : isDark
                          ? colors.background.secondary
                          : palette.white,
                      },
                    ]}
                  >
                    {item.icon(
                      isSelected
                        ? colors.action.primaryText
                        : colors.text.secondary
                    )}
                  </View>

                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: colors.text.primary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {item.description}
                    </Text>
                  </View>

                  {isSelected && (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: colors.action.primary },
                      ]}
                    >
                      <Feather
                        name="check"
                        size={14}
                        color={colors.action.primaryText}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionCardSelected: {
    borderWidth: 1.5,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
