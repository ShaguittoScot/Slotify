import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { authRequestMessage } from '@/features/auth/api';
import { useAppTheme } from '@/shared/theme';
import { bookingLink, fetchOwnBusinessInfo, type BusinessInfo } from '../../api';

const WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenMigration: () => void;
}

export function BusinessInfoModal({ visible, onClose, onOpenMigration }: Props) {
  const { colors, isDark } = useAppTheme();
  const [info, setInfo] = useState<BusinessInfo>();
  const [error, setError] = useState<string>();
  const [shareError, setShareError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    setInfo(undefined);
    setError(undefined);
    setShareError(false);
    fetchOwnBusinessInfo(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setInfo(data); },
      (failure) => {
        if (!controller.signal.aborted) setError(authRequestMessage(failure, 'No se pudo cargar el negocio.'));
      },
    );
    return () => controller.abort();
  }, [visible, attempt]);

  const url = bookingLink(info?.slug);
  const share = async () => {
    if (!url || !info) return;
    setShareError(false);
    try {
      await Share.share({ message: `Consulta las reservas de ${info.name} en Slotify: ${url}` });
    } catch {
      setShareError(true);
    }
  };
  const accent = isDark ? '#A5B4FC' : '#4F46E5';
  const fields = [
    { label: 'Razón Social / Comercial', value: info?.name, icon: 'briefcase' },
    { label: 'Teléfono', value: info?.phone || 'Sin teléfono registrado', icon: 'phone' },
    { label: 'Zona Horaria', value: info?.timeZone?.replaceAll('_', ' '), icon: 'globe' },
  ] as const;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        <View style={[styles.modalCard, {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }]}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Información del Negocio</Text>
              <Text style={[styles.modalSubtitle, { color: colors.text.muted }]}>Datos operativos y portal de autoservicio</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          {error ? (
            <>
              <Text accessibilityRole="alert" style={{ color: colors.status.error }}>{error}</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)} style={styles.retryBtn}>
                <Text style={[styles.shareBtnText, { color: accent }]}>Reintentar</Text>
              </TouchableOpacity>
            </>
          ) : !info ? <ActivityIndicator color={accent} /> : (
            <ScrollView style={styles.details} showsVerticalScrollIndicator={false}>
              <View style={[styles.bookingLinkCard, {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.18)',
              }]}>
                <View style={styles.linkHeader}>
                  <Feather name="globe" size={16} color={accent} />
                  <Text style={[styles.linkLabel, { color: accent }]}>Tu Enlace de Reserva Pública</Text>
                </View>
                <Text selectable={Boolean(url)} style={[styles.linkUrlText, { color: colors.text.primary }]}>
                  {url ?? 'Disponible cuando se configure el portal público de Slotify.'}
                </Text>
                {url && (
                  <TouchableOpacity accessibilityRole="button" onPress={share}
                    style={[styles.shareBtn, { backgroundColor: colors.action.primary }]}>
                    <Feather name="share-2" size={14} color={colors.action.primaryText} />
                    <Text style={[styles.shareBtnText, { color: colors.action.primaryText }]}>Compartir Enlace</Text>
                  </TouchableOpacity>
                )}
                {shareError && <Text accessibilityRole="alert" style={{ color: colors.status.error }}>No se pudo compartir el enlace.</Text>}
              </View>

              {fields.map(({ label, value, icon }) => (
                <View key={label} style={styles.infoRow}>
                  <View style={styles.infoIconBox}><Feather name={icon} size={18} color={colors.text.primary} /></View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.text.muted }]}>{label}</Text>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>{value}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}><Feather name="clock" size={18} color={colors.text.primary} /></View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.text.muted }]}>Horario de Atención</Text>
                  {info.hours.length > 0 ? info.hours.map((hours, index) => (
                    <Text key={index} style={[styles.infoValue, { color: colors.text.primary }]}>
                      {WEEK[hours.dayOfWeek]} · {hours.startTime.slice(0, 5)}–{hours.endTime.slice(0, 5)}
                    </Text>
                  )) : <Text style={[styles.infoValue, { color: colors.text.primary }]}>Sin horario general configurado</Text>}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}><MaterialCommunityIcons name="shape-outline" size={18} color={colors.text.primary} /></View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.text.muted }]}>Giro Comercial Activo</Text>
                  <Text style={[styles.infoValue, { color: colors.text.primary }]}>{info.sector || 'Sin giro asignado'}</Text>
                </View>
                <TouchableOpacity accessibilityRole="button"
                  style={[styles.smallBadgeBtn, { backgroundColor: isDark ? '#2A2A2E' : '#EFEFF4' }]}
                  onPress={() => { onClose(); onOpenMigration(); }}>
                  <Text style={[styles.smallBadgeBtnText, { color: colors.text.primary }]}>Cambiar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          <TouchableOpacity accessibilityRole="button" onPress={onClose}
            style={[styles.closeBottomBtn, { backgroundColor: isDark ? '#262628' : '#F2F2F7' }]}>
            <Text style={[styles.closeBottomBtnText, { color: colors.text.primary }]}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  details: { flexShrink: 1 },
  retryBtn: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  bookingLinkCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkUrlText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 6,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  smallBadgeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBadgeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBottomBtn: {
    marginTop: 18,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBottomBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
