import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme, ThemeMode, VisualTheme } from './useTheme';

interface ThemeSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface VisualThemeOption {
  id: VisualTheme;
  title: string;
  subtitle: string;
  colors: string[];
}

interface AppearanceModeOption {
  id: ThemeMode;
  label: string;
  icon: 'sun' | 'moon' | 'smartphone';
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    colors,
    themeMode,
    setThemeMode,
    visualTheme,
    setVisualTheme,
    isDark,
  } = useAppTheme();

  const visualThemes: VisualThemeOption[] = [
    {
      id: 'slotify',
      title: 'Slotify',
      subtitle: 'Identidad original',
      colors: ['#121212', '#262626', '#E4E4E7', '#22C55E'],
    },
    {
      id: 'obsidian',
      title: 'Obsidian',
      subtitle: 'Identidad alternativa',
      colors: ['#09090B', '#1C1C21', '#6366F1', '#10B981'],
    },
  ];

  const appearanceModes: AppearanceModeOption[] = [
    {
      id: 'light',
      label: 'Claro',
      icon: 'sun',
    },
    {
      id: 'dark',
      label: 'Oscuro',
      icon: 'moon',
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: 'smartphone',
    },
  ];

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
                Apariencia
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                Personaliza el tema y modo de visualización
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.background.tertiary },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ─── 1. TEMA ─── */}
            <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>
              TEMA
            </Text>

              <View style={styles.themeList}>
                {visualThemes.map((item) => {
                  const isSelected = visualTheme === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => void setVisualTheme(item.id)}
                      style={[
                        styles.themeCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(99, 102, 241, 0.12)'
                              : '#F4F4F5'
                            : colors.background.tertiary,
                          borderColor: isSelected
                            ? colors.border.focus
                            : colors.border.light,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      {/* Radio Indicator */}
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected
                              ? colors.border.focus
                              : colors.border.main,
                          },
                        ]}
                      >
                      { isSelected && (
                            <View
                              style={[
                                styles.radioInner,
                                { backgroundColor: colors.border.focus },
                              ]}
                            />
                          )}
                      </View>

                        {/* Textos */}
                        <View style={styles.themeInfo}>
                          <Text
                            style={[
                              styles.themeTitle,
                              {
                                color: isSelected
                                  ? colors.text.primary
                                  : colors.text.secondary,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              styles.themeSubtitle,
                              { color: colors.text.muted },
                            ]}
                          >
                            {item.subtitle}
                          </Text>
                        </View>

                            {/* Vista previa de colores */ }
                            < View style={styles.previewColorsContainer}>
                          {item.colors.map((c, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.colorDot,
                                {
                                  backgroundColor: c,
                                  borderColor: isDark
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : 'rgba(0, 0, 0, 0.15)',
                                },
                              ]}
                            />
                      ))}
                        </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ─── 2. MODO DE APARIENCIA ─── */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text.muted, marginTop: 20 },
                ]}
              >
                MODO DE APARIENCIA
              </Text>

                  <View style={styles.modeGrid}>
                    {appearanceModes.map((mode) => {
                      const isSelected = themeMode === mode.id;

                      return (
                        <TouchableOpacity
                          key={mode.id}
                          onPress={() => void setThemeMode(mode.id)}
                          style={[
                            styles.modeCard,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                    ? 'rgba(99, 102, 241, 0.14)'
                                    : '#F4F4F5'
                                  : colors.background.tertiary,
                              borderColor: isSelected
                                ? colors.border.focus
                                : colors.border.light,
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                            <Feather
                      name={mode.icon}
                            size={20}
                            color={
                              isSelected
                                ? visualTheme === 'obsidian'
                                  ? '#818CF8'
                                  : colors.text.primary
                                : colors.text.muted
                            }
                          />
                          <Text
                            style={[
                              styles.modeLabel,
                              {
                                color: isSelected
                                  ? colors.text.primary
                                  : colors.text.secondary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                          {mode.label}
                        </Text>
                  </TouchableOpacity>
                );
              })}
              </View>
          </ScrollView>

          {/* Botón Listo */}
          <TouchableOpacity
            style={[
              styles.doneButton,
              { backgroundColor: colors.action.primary },
            ]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.doneButtonText,
                { color: colors.action.primaryText },
              ]}
            >
              Listo
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
    themeList: {
      gap: 10,
    },
      themeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        gap: 12,
      },
        radioOuter: {
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
          radioInner: {
            width: 10,
            height: 10,
            borderRadius: 5,
          },
          themeInfo: {
            flex: 1,
            gap: 2,
          },
            themeTitle: {
              fontSize: 14,
            },
              themeSubtitle: {
                fontSize: 12,
              },
                previewColorsContainer: {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingLeft: 4,
                },
                colorDot: {
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  borderWidth: 1,
                },
                modeGrid: {
                  flexDirection: 'row',
                  gap: 8,
                },
                modeCard: {
                  flex: 1,
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 4,
                  borderRadius: 14,
                  borderWidth: 1,
                  gap: 6,
                },
                  modeLabel: {
                    fontSize: 13,
                    textAlign: 'center',
                  },
                  doneButton: {
                    marginTop: 14,
                    paddingVertical: 12,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  doneButtonText: {
                    fontSize: 14,
                    fontWeight: '700',
                  },
                });
