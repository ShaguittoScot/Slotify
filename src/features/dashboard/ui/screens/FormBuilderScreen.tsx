import React, { useState } from 'react';
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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormViewer } from '../components/FormViewer';

// ─── Tipos del Modelo Dinámico ──────────────────────────────────────
export type FieldType = 'short_text' | 'paragraph' | 'single_choice' | 'multiple_choice' | 'rating_stars';
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
  fields: FormField[];
}

const FIELD_TYPE_META: Record<FieldType, { icon: any; label: string }> = {
  short_text: { icon: 'type', label: 'Texto corto' },
  paragraph: { icon: 'align-left', label: 'Párrafo' },
  single_choice: { icon: 'check-circle', label: 'Opción Única' },
  multiple_choice: { icon: 'check-square', label: 'Opción Múltiple' },
  rating_stars: { icon: 'star', label: 'Calificación' },
};

// ─── Componente Principal ──────────────────────────────────────────
export function FormBuilderScreen() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [schema, setSchema] = useState<FormSchema>({
    title: 'Nueva Reservación',
    description: 'Por favor, completa los siguientes datos para confirmar tu mesa.',
    presentationStyle: 'classic_scroll',
    accentColor: '#6366F1',
    fields: [
      { id: 'f1', type: 'short_text', question: 'Nombre completo', required: true },
      { id: 'f2', type: 'single_choice', question: 'Zona preferida', required: false, options: ['Terraza', 'Salón Principal', 'Jardín'] },
    ],
  });

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Funciones de utilidad
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      question: 'Nueva Pregunta',
      required: false,
      options: type.includes('choice') ? ['Opción 1', 'Opción 2'] : undefined,
    };
    setSchema((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
    setEditingFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setSchema((prev) => ({ ...prev, fields: prev.fields.filter(f => f.id !== id) }));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setSchema((prev) => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f),
    }));
  };

  const setPresentationStyle = (style: PresentationStyle) => {
    setSchema((prev) => ({ ...prev, presentationStyle: style }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveForm = async () => {
    try {
      setIsSaving(true);
      const businessId = user?.businessId;
      
      // Si estamos en modo demo local, simulamos
      if (!businessId || businessId.startsWith('demo') || businessId === 'synced-backend') {
        await new Promise(r => setTimeout(r, 800));
        Alert.alert('Guardado Local', 'El esquema del formulario ha sido guardado exitosamente (Modo Demo).');
        return;
      }

      // Conexión real al backend
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/businesses/${businessId}/booking-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formConfig: schema })
      });

      if (res.ok) {
        Alert.alert('¡Éxito!', 'El esquema se ha guardado permanentemente en la base de datos.');
      } else {
        const data = await res.json();
        Alert.alert('Error', data.error || 'No se pudo guardar la configuración.');
      }
    } catch (e) {
      Alert.alert('Error', 'Problema de conexión con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal visible={isPreviewing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsPreviewing(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
          <View style={{ paddingTop: Platform.OS === 'ios' ? 20 : 40, paddingBottom: 10, paddingHorizontal: 20, backgroundColor: colors.background.primary }}>
            <TouchableOpacity onPress={() => setIsPreviewing(false)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="x" size={24} color={colors.text.primary} />
              <Text style={{ marginLeft: 8, color: colors.text.primary, fontWeight: '600', fontSize: 16 }}>Cerrar Vista Previa</Text>
            </TouchableOpacity>
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ─── Cabecera del Creador ─── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Generador de Formularios</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Diseña la estructura de tu formulario y cómo se le presentará al cliente.
          </Text>
        </Animated.View>

        {/* ─── Estilo de Presentación ─── */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>Modo de Presentación</Text>
          <View style={styles.styleSelectorRow}>
            <TouchableOpacity
              style={[
                styles.styleCard,
                { backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5' },
                schema.presentationStyle === 'classic_scroll' && { borderColor: schema.accentColor, borderWidth: 2 }
              ]}
              onPress={() => setPresentationStyle('classic_scroll')}
            >
              <Feather name="list" size={24} color={schema.presentationStyle === 'classic_scroll' ? schema.accentColor : colors.text.secondary} />
              <Text style={[styles.styleCardText, { color: colors.text.primary }]}>Clásico (Scroll)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.styleCard,
                { backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5' },
                schema.presentationStyle === 'interactive_slides' && { borderColor: schema.accentColor, borderWidth: 2 }
              ]}
              onPress={() => setPresentationStyle('interactive_slides')}
            >
              <Feather name="layers" size={24} color={schema.presentationStyle === 'interactive_slides' ? schema.accentColor : colors.text.secondary} />
              <Text style={[styles.styleCardText, { color: colors.text.primary }]}>Typeform (Slides)</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── Configuración General del Formulario ─── */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>Datos del Formulario</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5', color: colors.text.primary }]}
            value={schema.title}
            onChangeText={(text) => setSchema({ ...schema, title: text })}
            placeholder="Título principal..."
            placeholderTextColor={colors.text.muted}
          />
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#F4F4F5', color: colors.text.primary, height: 80 }]}
            value={schema.description}
            onChangeText={(text) => setSchema({ ...schema, description: text })}
            placeholder="Descripción o instrucciones..."
            placeholderTextColor={colors.text.muted}
            multiline
          />
        </Animated.View>

        {/* ─── Campos del Formulario ─── */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text style={[styles.sectionLabel, { color: colors.text.primary, marginTop: 10 }]}>Preguntas del Formulario</Text>
          
          {schema.fields.map((field, index) => (
            <Animated.View
              key={field.id}
              layout={Layout.springify()}
              entering={FadeInDown.duration(300)}
              exiting={FadeOutUp.duration(200)}
              style={[
                styles.fieldCard,
                { backgroundColor: isDark ? '#171717' : '#FFFFFF', borderColor: isDark ? '#262626' : '#E5E5E5' }
              ]}
            >
              <View style={styles.fieldHeader}>
                <View style={styles.fieldTypeBadge}>
                  <Feather name={FIELD_TYPE_META[field.type].icon} size={14} color="#8B5CF6" />
                  <Text style={styles.fieldTypeText}>{FIELD_TYPE_META[field.type].label}</Text>
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

              {/* Si es de opciones múltiples, mostrar editor básico de opciones */}
              {field.options && (
                <View style={styles.optionsContainer}>
                  {field.options.map((opt, oIdx) => (
                    <View key={oIdx} style={styles.optionRow}>
                      <Feather name={field.type === 'single_choice' ? 'circle' : 'square'} size={14} color={colors.text.muted} />
                      <Text style={[styles.optionText, { color: colors.text.secondary }]}>{opt}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addOptionBtn}>
                    <Feather name="plus" size={14} color={schema.accentColor} />
                    <Text style={{ color: schema.accentColor, fontSize: 13, marginLeft: 4 }}>Añadir opción</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.fieldFooter}>
                <TouchableOpacity 
                  style={styles.toggleReq}
                  onPress={() => updateField(field.id, { required: !field.required })}
                >
                  <Feather name={field.required ? "toggle-right" : "toggle-left"} size={20} color={field.required ? schema.accentColor : colors.text.muted} />
                  <Text style={[styles.reqText, { color: colors.text.secondary }]}>Obligatorio</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ─── Botones para Agregar Nuevos Campos ─── */}
        <Animated.View layout={Layout.springify()} style={styles.addButtonsContainer}>
          <Text style={[styles.addButtonsTitle, { color: colors.text.secondary }]}>Agregar nuevo bloque:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addButtonsScroll}>
            {Object.entries(FIELD_TYPE_META).map(([type, meta]) => (
              <TouchableOpacity
                key={type}
                style={[styles.addTypeBtn, { backgroundColor: isDark ? '#262626' : '#F4F4F5' }]}
                onPress={() => addField(type as FieldType)}
              >
                <Feather name={meta.icon as any} size={16} color={schema.accentColor} />
                <Text style={[styles.addTypeText, { color: colors.text.primary }]}>{meta.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── Footer Flotante de Acciones ─── */}
      <View style={[styles.footer, { backgroundColor: isDark ? 'rgba(18,18,18,0.95)' : 'rgba(255,255,255,0.95)' }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border.main }]} onPress={() => setIsPreviewing(true)}>
          <View style={[styles.saveBtnGradient, { backgroundColor: 'transparent' }]}>
            <Feather name="eye" size={18} color={colors.text.primary} />
            <Text style={[styles.saveBtnText, { color: colors.text.primary }]}>Vista Previa</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={saveForm}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
            <Feather name="save" size={18} color="#FFF" />
            <Text style={styles.saveBtnText}>Guardar</Text>
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
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  
  styleSelectorRow: { flexDirection: 'row', gap: 12 },
  styleCard: {
    flex: 1, padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent'
  },
  styleCardText: { marginTop: 8, fontSize: 14, fontWeight: '600' },
  
  input: {
    borderRadius: 12, padding: 16, fontSize: 15, marginBottom: 12,
  },
  
  fieldCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fieldTypeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF615', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 6 },
  fieldTypeText: { fontSize: 12, fontWeight: '600', color: '#8B5CF6' },
  questionInput: { fontSize: 16, fontWeight: '600', marginBottom: 12, paddingVertical: 4 },
  
  optionsContainer: { marginBottom: 12, gap: 8, paddingLeft: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionText: { fontSize: 14 },
  addOptionBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingVertical: 4 },
  
  fieldFooter: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)', paddingTop: 12, marginTop: 4 },
  toggleReq: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqText: { fontSize: 13, fontWeight: '500' },
  
  addButtonsContainer: { marginTop: 10 },
  addButtonsTitle: { fontSize: 13, marginBottom: 10, fontWeight: '500' },
  addButtonsScroll: { gap: 10, paddingBottom: 10 },
  addTypeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 8 },
  addTypeText: { fontSize: 13, fontWeight: '600' },

  footer: {
    padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)', flexDirection: 'row', gap: 12
  },
  saveBtn: { flex: 1, borderRadius: 14, overflow: 'hidden', height: 50 },
  saveBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});
