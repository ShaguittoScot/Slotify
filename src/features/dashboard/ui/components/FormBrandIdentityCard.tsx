import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/shared/theme';
import {
  CORPORATE_COLOR_PRESETS,
  COLOR_SWATCHES,
  PRESET_BRAND_LOGOS,
  isValidHexColor,
} from '../../model/formBranding';

interface FormBrandIdentityCardProps {
  businessName: string;
  logoUrl?: string | null;
  accentColor: string;
  secondaryColor: string;
  onChangeBranding: (updates: {
    businessName?: string;
    logoUrl?: string | null;
    accentColor?: string;
    secondaryColor?: string;
  }) => void;
}

export function FormBrandIdentityCard({
  businessName,
  logoUrl,
  accentColor,
  secondaryColor,
  onChangeBranding,
}: FormBrandIdentityCardProps) {
  const { colors, isDark } = useAppTheme();

  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [customLogoInput, setCustomLogoInput] = useState(logoUrl || '');
  const [activeColorTab, setActiveColorTab] = useState<'primary' | 'secondary'>('primary');
  const [hexInput, setHexInput] = useState(accentColor);

  const handlePickFileWeb = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
      input.onchange = (event: any) => {
        const file = event?.target?.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
          Alert.alert('Archivo demasiado grande', 'El logotipo debe pesar menos de 4 MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onChangeBranding({ logoUrl: reader.result });
            setCustomLogoInput(reader.result);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      setShowLogoUrlInput(true);
    }
  };

  const handleApplyLogoUrl = () => {
    const trimmed = customLogoInput.trim();
    if (!trimmed) {
      onChangeBranding({ logoUrl: null });
      setShowLogoUrlInput(false);
      return;
    }
    onChangeBranding({ logoUrl: trimmed });
    setShowLogoUrlInput(false);
  };

  const handleSelectColorTab = (tab: 'primary' | 'secondary') => {
    setActiveColorTab(tab);
    setHexInput(tab === 'primary' ? accentColor : secondaryColor);
  };

  const handleSelectSwatch = (colorHex: string) => {
    setHexInput(colorHex);
    if (activeColorTab === 'primary') {
      onChangeBranding({ accentColor: colorHex });
    } else {
      onChangeBranding({ secondaryColor: colorHex });
    }
  };

  const handleHexChange = (text: string) => {
    const formatted = text.startsWith('#') ? text.toUpperCase() : `#${text.toUpperCase()}`;
    setHexInput(formatted);
    if (isValidHexColor(formatted)) {
      if (activeColorTab === 'primary') {
        onChangeBranding({ accentColor: formatted });
      } else {
        onChangeBranding({ secondaryColor: formatted });
      }
    }
  };

  const getInitials = (name: string) => {
    const clean = (name || 'Mi Negocio').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#171717' : '#FFFFFF',
          borderColor: isDark ? '#262626' : '#E5E5E5',
        },
      ]}
    >
      {/* Cabecera de Sección */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${accentColor}18` }]}>
          <MaterialCommunityIcons name="palette-swatch-outline" size={20} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Identidad de Marca del Formulario
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Carga tu logotipo y define tus colores corporativos para las reservas públicas
          </Text>
        </View>
      </View>

      {/* Vista Previa en Vivo del Banner de Marca */}
      <LinearGradient
        colors={[accentColor, secondaryColor || accentColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.livePreviewBanner}
      >
        <View style={styles.previewLogoWrapper}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.previewLogoImage}
              resizeMode="cover"
              testID="brand-preview-logo-image"
            />
          ) : (
            <Text style={styles.previewInitialsText}>{getInitials(businessName)}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.previewTagPill}>
            <Text style={styles.previewTagText}>VISTA PREVIA DE MARCA</Text>
          </View>
          <Text style={styles.previewBusinessName} numberOfLines={1}>
            {businessName || 'Mi Establecimiento'}
          </Text>
          <Text style={styles.previewColorsCode}>
            Primario {accentColor} • Secundario {secondaryColor}
          </Text>
        </View>
      </LinearGradient>

      {/* Nombre del Establecimiento en el Formulario */}
      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.text.primary }]}>
          Nombre del Establecimiento
        </Text>
        <TextInput
          testID="brand-business-name-input"
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5',
              color: colors.text.primary,
              borderColor: isDark ? '#2E2E2E' : '#E4E4E7',
            },
          ]}
          value={businessName}
          onChangeText={(text) => onChangeBranding({ businessName: text })}
          placeholder="Ej. Barbería Imperial / Clínica Sonrisas"
          placeholderTextColor={colors.text.muted}
        />
      </View>

      {/* Carga de Logotipo */}
      <View style={styles.block}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text.primary, marginBottom: 0 }]}>
            Logotipo del Negocio
          </Text>
          {logoUrl ? (
            <TouchableOpacity
              testID="remove-logo-button"
              onPress={() => {
                onChangeBranding({ logoUrl: null });
                setCustomLogoInput('');
              }}
              style={styles.removeLogoBtn}
            >
              <Feather name="trash-2" size={13} color={colors.status.error} />
              <Text style={[styles.removeLogoText, { color: colors.status.error }]}>
                Quitar logo
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.logoActionsRow}>
          <TouchableOpacity
            testID="upload-logo-button"
            style={[
              styles.uploadBtn,
              {
                backgroundColor: `${accentColor}15`,
                borderColor: accentColor,
              },
            ]}
            onPress={handlePickFileWeb}
            activeOpacity={0.75}
          >
            <Feather name="upload" size={16} color={accentColor} />
            <Text style={[styles.uploadBtnText, { color: accentColor }]}>
              {logoUrl ? 'Cambiar Logotipo' : 'Cargar Logotipo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="toggle-logo-url-button"
            style={[
              styles.urlToggleBtn,
              {
                backgroundColor: isDark ? '#262626' : '#F4F4F5',
                borderColor: isDark ? '#333' : '#E4E4E7',
              },
            ]}
            onPress={() => setShowLogoUrlInput(!showLogoUrlInput)}
            activeOpacity={0.75}
          >
            <Feather name="link" size={15} color={colors.text.primary} />
            <Text style={[styles.urlToggleBtnText, { color: colors.text.primary }]}>
              URL / Galería
            </Text>
          </TouchableOpacity>
        </View>

        {/* Entrada por URL o selección rápida de insignias de muestra */}
        {showLogoUrlInput && (
          <View
            style={[
              styles.logoPickerDrawer,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#F9FAFB',
                borderColor: isDark ? '#2E2E2E' : '#E5E7EB',
              },
            ]}
          >
            <Text style={[styles.helperLabel, { color: colors.text.secondary }]}>
              Pega el enlace directo de tu logotipo (PNG, JPG, SVG):
            </Text>
            <View style={styles.urlInputRow}>
              <TextInput
                testID="logo-url-input"
                style={[
                  styles.urlInput,
                  {
                    backgroundColor: isDark ? '#141414' : '#FFFFFF',
                    color: colors.text.primary,
                    borderColor: isDark ? '#333' : '#D4D4D8',
                  },
                ]}
                value={customLogoInput}
                onChangeText={setCustomLogoInput}
                placeholder="https://mi-negocio.com/logo.png"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                testID="apply-logo-url-button"
                style={[styles.applyUrlBtn, { backgroundColor: accentColor }]}
                onPress={handleApplyLogoUrl}
              >
                <Text style={styles.applyUrlBtnText}>Aplicar</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.helperLabel, { color: colors.text.secondary, marginTop: 10 }]}>
              O elige un distintivo de muestra para probar:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetLogosRow}
            >
              {PRESET_BRAND_LOGOS.map((preset) => {
                const isSelected = logoUrl === preset.url;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    testID={`preset-logo-${preset.id}`}
                    style={[
                      styles.presetLogoChip,
                      {
                        backgroundColor: isDark ? '#141414' : '#FFFFFF',
                        borderColor: isSelected ? accentColor : isDark ? '#333' : '#E4E4E7',
                      },
                    ]}
                    onPress={() => {
                      onChangeBranding({ logoUrl: preset.url });
                      setCustomLogoInput(preset.url);
                    }}
                  >
                    <Image source={{ uri: preset.url }} style={styles.presetThumb} />
                    <Text
                      style={[
                        styles.presetLogoLabel,
                        { color: isSelected ? accentColor : colors.text.primary },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Paletas Corporativas Predefinidas */}
      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.text.primary }]}>
          Paletas Corporativas Recomendadas
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsScroll}
        >
          {CORPORATE_COLOR_PRESETS.map((preset) => {
            const isSelected =
              accentColor.toUpperCase() === preset.primary.toUpperCase() &&
              secondaryColor.toUpperCase() === preset.secondary.toUpperCase();
            return (
              <TouchableOpacity
                key={preset.id}
                testID={`color-preset-${preset.id}`}
                style={[
                  styles.presetPaletteCard,
                  {
                    backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5',
                    borderColor: isSelected ? preset.primary : 'transparent',
                  },
                ]}
                onPress={() => {
                  onChangeBranding({
                    accentColor: preset.primary,
                    secondaryColor: preset.secondary,
                  });
                  setHexInput(activeColorTab === 'primary' ? preset.primary : preset.secondary);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.dualDots}>
                  <View style={[styles.colorDot, { backgroundColor: preset.primary }]} />
                  <View
                    style={[
                      styles.colorDot,
                      styles.colorDotOverlap,
                      { backgroundColor: preset.secondary },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.presetPaletteName,
                    { color: isSelected ? preset.primary : colors.text.primary },
                  ]}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selector Detallado: Color Primario y Secundario */}
      <View style={styles.blockLast}>
        <Text style={[styles.label, { color: colors.text.primary }]}>
          Colores Corporativos Principales
        </Text>

        {/* Tabs para alternar entre Color Primario y Secundario */}
        <View
          style={[
            styles.colorRoleTabs,
            { backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5' },
          ]}
        >
          <TouchableOpacity
            testID="tab-primary-color"
            style={[
              styles.colorRoleTab,
              activeColorTab === 'primary' && {
                backgroundColor: isDark ? '#2E2E2E' : '#FFFFFF',
                borderColor: accentColor,
                borderWidth: 1,
              },
            ]}
            onPress={() => handleSelectColorTab('primary')}
          >
            <View style={[styles.roleSwatchMini, { backgroundColor: accentColor }]} />
            <View>
              <Text style={[styles.roleTabTitle, { color: colors.text.primary }]}>
                Color Primario
              </Text>
              <Text style={[styles.roleTabHex, { color: colors.text.muted }]}>
                {accentColor}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            testID="tab-secondary-color"
            style={[
              styles.colorRoleTab,
              activeColorTab === 'secondary' && {
                backgroundColor: isDark ? '#2E2E2E' : '#FFFFFF',
                borderColor: secondaryColor,
                borderWidth: 1,
              },
            ]}
            onPress={() => handleSelectColorTab('secondary')}
          >
            <View style={[styles.roleSwatchMini, { backgroundColor: secondaryColor }]} />
            <View>
              <Text style={[styles.roleTabTitle, { color: colors.text.primary }]}>
                Color Secundario
              </Text>
              <Text style={[styles.roleTabHex, { color: colors.text.muted }]}>
                {secondaryColor}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Muestras de color rápidas (Swatches) */}
        <View style={styles.swatchesGrid}>
          {COLOR_SWATCHES.map((swatch) => {
            const currentActiveColor =
              activeColorTab === 'primary' ? accentColor : secondaryColor;
            const isSelected = currentActiveColor.toUpperCase() === swatch.toUpperCase();
            return (
              <TouchableOpacity
                key={swatch}
                testID={`swatch-${swatch}`}
                style={[
                  styles.swatchCircle,
                  { backgroundColor: swatch },
                  isSelected && styles.swatchCircleSelected,
                ]}
                onPress={() => handleSelectSwatch(swatch)}
                activeOpacity={0.8}
              >
                {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Código HEX personalizado */}
        <View style={styles.hexInputRow}>
          <Text style={[styles.hexLabel, { color: colors.text.secondary }]}>
            Código HEX ({activeColorTab === 'primary' ? 'Primario' : 'Secundario'}):
          </Text>
          <View
            style={[
              styles.hexInputWrapper,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5',
                borderColor: isDark ? '#333' : '#E4E4E7',
              },
            ]}
          >
            <View
              style={[
                styles.hexPreviewDot,
                {
                  backgroundColor:
                    activeColorTab === 'primary' ? accentColor : secondaryColor,
                },
              ]}
            />
            <TextInput
              testID="custom-hex-input"
              style={[styles.hexTextInput, { color: colors.text.primary }]}
              value={hexInput}
              onChangeText={handleHexChange}
              placeholder="#6366F1"
              placeholderTextColor={colors.text.muted}
              maxLength={7}
              autoCapitalize="characters"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  livePreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 18,
    gap: 14,
  },
  previewLogoWrapper: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewLogoImage: {
    width: '100%',
    height: '100%',
  },
  previewInitialsText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  previewTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  previewBusinessName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  previewColorsCode: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  block: {
    marginBottom: 18,
  },
  blockLast: {
    marginBottom: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  removeLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  removeLogoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  urlToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  urlToggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoPickerDrawer: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  helperLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  applyUrlBtn: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyUrlBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  presetLogosRow: {
    gap: 8,
    paddingTop: 4,
  },
  presetLogoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  presetThumb: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  presetLogoLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetsScroll: {
    gap: 10,
  },
  presetPaletteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dualDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  colorDotOverlap: {
    marginLeft: -6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  presetPaletteName: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorRoleTabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  colorRoleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  roleSwatchMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleTabTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleTabHex: {
    fontSize: 10,
    fontWeight: '500',
  },
  swatchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  swatchCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchCircleSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  hexLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  hexInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 130,
  },
  hexPreviewDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  hexTextInput: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 75,
  },
});

