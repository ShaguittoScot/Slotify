import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import Animated, {
  FadeInDown,
  Layout,
  FadeOutUp,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';
import { apiClient } from '@/shared/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FormViewer } from '../components/FormViewer';
import { FormBrandIdentityCard } from '../components/FormBrandIdentityCard';
import {
  saveFormSchemaLocally,
  loadFormSchemaLocally,
} from '../../model/formBranding';

// ─── Tipos del Modelo Dinámico ──────────────────────────────────────
export type FieldType =
  | 'short_text'
  | 'paragraph'
  | 'single_choice'
  | 'multiple_choice'
  | 'rating_stars'
  | 'service_catalog';
export type PresentationStyle = 'classic_scroll' | 'interactive_slides';

export interface FormField {
  id: string;
  type: FieldType;
  question: string;
  required: boolean;
  options?: string[];
}

export interface FormSchema {
  title: string;
  description: string;
  presentationStyle: PresentationStyle;
  accentColor: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  businessName?: string;
  fields: FormField[];
}

const FIELD_TYPE_META: Record<FieldType, { icon: any; label: string }> = {
  short_text: { icon: 'type', label: 'Texto corto' },
  paragraph: { icon: 'align-left', label: 'Párrafo' },
  single_choice: { icon: 'check-circle', label: 'Opción Única' },
  multiple_choice: { icon: 'check-square', label: 'Opción Múltiple' },
  rating_stars: { icon: 'star', label: 'Calificación' },
  service_catalog: { icon: 'list', label: 'Catálogo de Servicios' },
};

// ─── Componente Principal ──────────────────────────────────────────
export function FormBuilderScreen() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const defaultBusinessName =
    user?.businessName || user?.fullName || 'Mi Negocio Slotify';

  const [schema, setSchema] = useState<FormSchema>({
    title: 'Nueva Reservación',
    description: 'Por favor, completa los siguientes datos para confirmar tu cita.',
    presentationStyle: 'classic_scroll',
    accentColor: '#6366F1',
    secondaryColor: '#8B5CF6',
    logoUrl: null,
    businessName: defaultBusinessName,
    fields: [
      { id: 'f1', type: 'short_text', question: 'Nombre completo', required: true },
      {
        id: 'f2',
        type: 'single_choice',
        question: 'Zona o modalidad preferida',
        required: false,
        options: ['Terraza', 'Salón Principal', 'Jardín'],
      },
    ],
  });

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Hidrata el esquema y la identidad de marca guardada localmente
  useEffect(() => {
    let mounted = true;
    loadFormSchemaLocally().then((saved) => {
      if (mounted && saved && saved.title && Array.isArray(saved.fields)) {
        setSchema((prev) => ({
          ...prev,
          ...saved,
          secondaryColor: saved.secondaryColor || prev.secondaryColor || '#8B5CF6',
          businessName: saved.businessName || prev.businessName || defaultBusinessName,
        }));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Funciones de utilidad
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      question:
        type === 'service_catalog'
          ? 'Selecciona los servicios que deseas:'
          : 'Nueva Pregunta',
      required: type === 'service_catalog' ? true : false,
      options: type.includes('choice') ? ['Opción 1', 'Opción 2'] : undefined,
    };
    setSchema((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
    setEditingFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id),
    }));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  };

  const addOptionToField = (fieldId: string) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const currentOpts = f.options || [];
        return {
          ...f,
          options: [...currentOpts, `Opción ${currentOpts.length + 1}`],
        };
      }),
    }));
  };

  const updateOptionInField = (fieldId: string, optionIdx: number, text: string) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.id !== fieldId || !f.options) return f;
        const nextOpts = [...f.options];
        nextOpts[optionIdx] = text;
        return { ...f, options: nextOpts };
      }),
    }));
  };

  const removeOptionFromField = (fieldId: string, optionIdx: number) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.id !== fieldId || !f.options || f.options.length <= 1) return f;
        return {
          ...f,
          options: f.options.filter((_, idx) => idx !== optionIdx),
        };
      }),
    }));
  };

  const setPresentationStyle = (style: PresentationStyle) => {
    setSchema((prev) => ({ ...prev, presentationStyle: style }));
  };

  const handleUpdateBranding = (updates: {
    businessName?: string;
    logoUrl?: string | null;
    accentColor?: string;
    secondaryColor?: string;
  }) => {
    setSchema((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const saveForm = async () => {
    try {
      setIsSaving(true);
      await saveFormSchemaLocally(schema);

      const businessId = user?.businessId;

      // Si estamos en modo demo local, confirmamos guardado local
      if (
        !businessId ||
        businessId.startsWith('demo') ||
        businessId === 'synced-backend'
      ) {
        await new Promise((r) => setTimeout(r, 400));
        Alert.alert(
          'Identidad y Formulario Guardados',
          'Tu logotipo, colores corporativos y preguntas se han aplicado a la interfaz pública de reservas.'
        );
        return;
      }

      // Conexión real al backend
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/businesses/${businessId}/booking-config`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formConfig: schema }),
        }
      );

      if (res.ok) {
        Alert.alert(
          '¡Éxito!',
          'El formulario y la identidad de marca se han guardado permanentemente.'
        );
      } else {
        const data = await res.json();
        Alert.alert('Error', data.error || 'No se pudo guardar la configuración.');
      }
    } catch {
      Alert.alert(
        'Guardado en Dispositivo',
        'Tu logotipo y colores corporativos se guardaron localmente para la interfaz pública de reservas.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const secondaryColor = schema.secondaryColor || schema.accentColor;

  return (
    <>
      <Modal
        visible={isPreviewing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPreviewing(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
          <View
            style={{
              paddingTop: Platform.OS === 'ios' ? 20 : 40,
              paddingBottom: 10,
              paddingHorizontal: 20,
              backgroundColor: colors.background.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <TouchableOpacity
              onPress={() => setIsPreviewing(false)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Feather name="x" size={24} color={colors.text.primary} />
              <Text
                style={{
                  marginLeft: 8,
                  color: colors.text.primary,
                  fontWeight: '600',
                  fontSize: 16,
                }}
              >
                Cerrar Vista Previa
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.previewModeBadge,
                { backgroundColor: `${schema.accentColor}20` },
              ]}
            >
              <View
                style={[
                  styles.previewColorDot,
                  { backgroundColor: schema.accentColor },
                ]}
              />
              <Text
                style={[styles.previewModeBadgeText, { color: schema.accentColor }]}
              >
                Vista Pública de Cliente
              </Text>
            </View>
          </View>
          <FormViewer
            schema={schema}
            onSubmit={(answers) => {
              Alert.alert('Formulario Enviado', JSON.stringify(answers, null, 2));
              setIsPreviewing(false);
            }}
          />
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Cabecera del Creador ─── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Generador de Formularios
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
              Personaliza tu logotipo, colores corporativos y la estructura del formulario público de reservas.
            </Text>
          </Animated.View>

          {/* ─── Identidad de Marca: Logotipo y Colores Corporativos ─── */}
          <Animated.View entering={FadeInDown.duration(400).delay(50)}>
            <FormBrandIdentityCard
              businessName={schema.businessName || defaultBusinessName}
              logoUrl={schema.logoUrl}
              accentColor={schema.accentColor}
              secondaryColor={secondaryColor}
              onChangeBranding={handleUpdateBranding}
            />
          </Animated.View>

          {/* ─── Estilo de Presentación ─── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={styles.section}
          >
            <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>
              Modo de Presentación
            </Text>
            <View style={styles.styleSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.styleCard,
                  { backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5' },
                  schema.presentationStyle === 'classic_scroll' && {
                    borderColor: schema.accentColor,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setPresentationStyle('classic_scroll')}
              >
                <Feather
                  name="list"
                  size={24}
                  color={
                    schema.presentationStyle === 'classic_scroll'
                      ? schema.accentColor
                      : colors.text.secondary
                  }
                />
                <Text style={[styles.styleCardText, { color: colors.text.primary }]}>
                  Clásico (Scroll)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.styleCard,
                  { backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5' },
                  schema.presentationStyle === 'interactive_slides' && {
                    borderColor: schema.accentColor,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setPresentationStyle('interactive_slides')}
              >
                <Feather
                  name="layers"
                  size={24}
                  color={
                    schema.presentationStyle === 'interactive_slides'
                      ? schema.accentColor
                      : colors.text.secondary
                  }
                />
                <Text style={[styles.styleCardText, { color: colors.text.primary }]}>
                  Typeform (Slides)
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ─── Configuración General del Formulario ─── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.section}
          >
            <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>
              Datos del Formulario
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5',
                  color: colors.text.primary,
                },
              ]}
              value={schema.title}
              onChangeText={(text) => setSchema({ ...schema, title: text })}
              placeholder="Título principal..."
              placeholderTextColor={colors.text.muted}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5',
                  color: colors.text.primary,
                  height: 80,
                },
              ]}
              value={schema.description}
              onChangeText={(text) => setSchema({ ...schema, description: text })}
              placeholder="Descripción o instrucciones..."
              placeholderTextColor={colors.text.muted}
              multiline
            />
          </Animated.View>

          {/* ─── Campos del Formulario ─── */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.text.primary, marginTop: 10 },
              ]}
            >
              Preguntas del Formulario
            </Text>

            {schema.fields.map((field) => (
              <Animated.View
                key={field.id}
                layout={Layout.springify()}
                entering={FadeInDown.duration(300)}
                exiting={FadeOutUp.duration(200)}
                style={[
                  styles.fieldCard,
                  {
                    backgroundColor: isDark ? '#171717' : '#FFFFFF',
                    borderColor: isDark ? '#262626' : '#E5E5E5',
                  },
                ]}
              >
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.fieldTypeBadge,
                      { backgroundColor: `${schema.accentColor}18` },
                    ]}
                  >
                    <Feather
                      name={FIELD_TYPE_META[field.type].icon}
                      size={14}
                      color={schema.accentColor}
                    />
                    <Text
                      style={[
                        styles.fieldTypeText,
                        { color: schema.accentColor },
                      ]}
                    >
                      {FIELD_TYPE_META[field.type].label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeField(field.id)}>
                    <Feather name="trash-2" size={18} color={colors.status.error} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.questionInput, { color: colors.text.primary }]}
                  value={field.question}
                  onChangeText={(text) => updateField(field.id, { question: text })}
                  placeholder="Escribe la pregunta..."
                  placeholderTextColor={colors.text.muted}
                />

                {/* Si es de opciones múltiples, mostrar editor de opciones */}
                {field.options && (
                  <View style={styles.optionsContainer}>
                    {field.options.map((opt, oIdx) => (
                      <View key={oIdx} style={styles.optionRow}>
                        <Feather
                          name={field.type === 'single_choice' ? 'circle' : 'square'}
                          size={14}
                          color={schema.accentColor}
                        />
                        <TextInput
                          style={[
                            styles.optionTextInput,
                            { color: colors.text.primary },
                          ]}
                          value={opt}
                          onChangeText={(txt) =>
                            updateOptionInField(field.id, oIdx, txt)
                          }
                          placeholder={`Opción ${oIdx + 1}`}
                          placeholderTextColor={colors.text.muted}
                        />
                        {field.options && field.options.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeOptionFromField(field.id, oIdx)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Feather name="x" size={14} color={colors.text.muted} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addOptionBtn}
                      onPress={() => addOptionToField(field.id)}
                    >
                      <Feather name="plus" size={14} color={schema.accentColor} />
                      <Text
                        style={{
                          color: schema.accentColor,
                          fontSize: 13,
                          fontWeight: '600',
                          marginLeft: 4,
                        }}
                      >
                        Añadir opción
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Si es catálogo de servicios, mostrar nota */}
                {field.type === 'service_catalog' && (
                  <View
                    style={[
                      styles.optionsContainer,
                      {
                        backgroundColor: `${schema.accentColor}12`,
                        padding: 12,
                        borderRadius: 12,
                        marginTop: 10,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: schema.accentColor,
                        fontSize: 13,
                        fontWeight: '600',
                        marginBottom: 4,
                      }}
                    >
                      <Feather name="info" size={12} /> Sincronización Automática
                    </Text>
                    <Text
                      style={{
                        color: colors.text.secondary,
                        fontSize: 12,
                        lineHeight: 18,
                      }}
                    >
                      Los servicios y precios configurados en la pestaña "Plantilla" de tu negocio se mostrarán aquí automáticamente con tus colores corporativos.
                    </Text>
                  </View>
                )}

                <View style={styles.fieldFooter}>
                  <TouchableOpacity
                    style={styles.toggleReq}
                    onPress={() =>
                      updateField(field.id, { required: !field.required })
                    }
                  >
                    <Feather
                      name={field.required ? 'toggle-right' : 'toggle-left'}
                      size={20}
                      color={field.required ? schema.accentColor : colors.text.muted}
                    />
                    <Text style={[styles.reqText, { color: colors.text.secondary }]}>
                      Obligatorio
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* ─── Botones para Agregar Nuevos Campos ─── */}
          <Animated.View layout={Layout.springify()} style={styles.addButtonsContainer}>
            <Text style={[styles.addButtonsTitle, { color: colors.text.secondary }]}>
              Agregar nuevo bloque:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.addButtonsScroll}
            >
              {Object.entries(FIELD_TYPE_META).map(([type, meta]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.addTypeBtn,
                    { backgroundColor: isDark ? '#262626' : '#F4F4F5' },
                  ]}
                  onPress={() => addField(type as FieldType)}
                >
                  <Feather
                    name={meta.icon as any}
                    size={16}
                    color={schema.accentColor}
                  />
                  <Text style={[styles.addTypeText, { color: colors.text.primary }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ─── Footer Flotante de Acciones ─── */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: isDark
                ? 'rgba(18,18,18,0.95)'
                : 'rgba(255,255,255,0.95)',
            },
          ]}
        >
          <TouchableOpacity
            testID="preview-form-button"
            style={[
              styles.saveBtn,
              {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: colors.border.main,
              },
            ]}
            onPress={() => setIsPreviewing(true)}
          >
            <View style={[styles.saveBtnGradient, { backgroundColor: 'transparent' }]}>
              <Feather name="eye" size={18} color={colors.text.primary} />
              <Text style={[styles.saveBtnText, { color: colors.text.primary }]}>
                Vista Previa
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            testID="save-form-button"
            style={styles.saveBtn}
            onPress={saveForm}
            disabled={isSaving}
          >
            <LinearGradient
              colors={[schema.accentColor, secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Feather name="save" size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 12 },

  previewModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  previewColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewModeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  styleSelectorRow: { flexDirection: 'row', gap: 12 },
  styleCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardText: { marginTop: 8, fontSize: 14, fontWeight: '600' },

  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 12,
  },

  fieldCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  fieldTypeText: { fontSize: 12, fontWeight: '600' },
  questionInput: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingVertical: 4,
  },

  optionsContainer: { marginBottom: 12, gap: 8, paddingLeft: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionTextInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
  },

  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    paddingTop: 12,
    marginTop: 4,
  },
  toggleReq: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqText: { fontSize: 13, fontWeight: '500' },

  addButtonsContainer: { marginTop: 10 },
  addButtonsTitle: { fontSize: 13, marginBottom: 10, fontWeight: '500' },
  addButtonsScroll: { gap: 10, paddingBottom: 10 },
  addTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addTypeText: { fontSize: 13, fontWeight: '600' },

  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: { flex: 1, borderRadius: 14, overflow: 'hidden', height: 50 },
  saveBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
