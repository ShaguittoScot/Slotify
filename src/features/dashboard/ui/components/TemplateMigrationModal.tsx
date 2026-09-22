import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';

// Se utiliza la variable de entorno para la URL de la API
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5272/api';

interface SectorTemplate {
  id: number;
  name: string;
  defaultModules: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function TemplateMigrationModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<SectorTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      fetchTemplates();
    }
  }, [visible]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/sector-templates`);
      if (res.ok) {
        const jsonRes = await res.json();
        // El servidor retorna { success: true, data: [...] }
        setTemplates(jsonRes?.data || []);
      }
    } catch (error) {
      console.warn('Error fetching templates', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!selectedId) return;
    if (!user?.businessId) {
      Alert.alert('Error', 'No tienes un negocio asignado.');
      return;
    }

    Alert.alert(
      'Atención',
      'Al cambiar la plantilla, algunos servicios actuales que no sean compatibles podrían desactivarse. Tu información de contacto y reservas pasadas se mantendrán. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar Migración', 
          style: 'destructive',
          onPress: performMigration 
        }
      ]
    );
  };

  const performMigration = async () => {
    try {
      setMigrating(true);
      const res = await fetch(`${API_URL}/businesses/${user?.businessId}/template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTemplateId: selectedId })
      });

      if (res.ok) {
        Alert.alert('Éxito', 'Plantilla migrada correctamente.');
        onClose();
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData?.error || 'Ocurrió un error en la migración.');
      }
    } catch (error) {
      console.warn('Error in migration', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[s.container, { backgroundColor: colors.background.primary }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text.primary }]}>Cambiar Plantilla (US-013)</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={s.content}>
          <Text style={[s.description, { color: colors.text.secondary }]}>
            Selecciona el nuevo giro comercial de tu negocio. Esto actualizará tu perfil base.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.action.primary} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={s.list} contentContainerStyle={{ paddingBottom: 40 }}>
              {templates.map((tpl) => (
                <TouchableOpacity
                  key={tpl.id}
                  style={[
                    s.templateCard,
                    { 
                      backgroundColor: colors.background.secondary,
                      borderColor: selectedId === tpl.id ? colors.action.primary : colors.border.main,
                      borderWidth: selectedId === tpl.id ? 2 : 1
                    }
                  ]}
                  onPress={() => setSelectedId(tpl.id)}
                >
                  <Text style={[s.templateName, { color: colors.text.primary }]}>{tpl.name}</Text>
                  <View style={s.modulesBox}>
                    <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                      Módulos: {tpl.defaultModules}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[
              s.submitBtn,
              { backgroundColor: selectedId && !migrating ? colors.action.primary : colors.background.tertiary }
            ]}
            disabled={!selectedId || migrating}
            onPress={handleMigrate}
          >
            {migrating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[s.submitText, { color: selectedId ? colors.action.primaryText : colors.text.secondary }]}>
                Migrar Plantilla
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)'
  },
  closeBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  description: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  list: { flex: 1 },
  templateCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  templateName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  modulesBox: { marginTop: 8 },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  submitText: { fontSize: 16, fontWeight: '700' }
});
