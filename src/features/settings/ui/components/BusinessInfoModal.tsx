import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenMigration: () => void;
}

export function BusinessInfoModal({ visible, onClose, onOpenMigration }: Props) {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const businessName = user?.businessName || 'Mi Negocio Slotify';
  const slug = businessName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const bookingUrl = `https://slotify.app/book/${slug || 'demo'}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Reserva tu cita en ${businessName} a través de Slotify: ${bookingUrl}`,
        url: bookingUrl,
      });
    } catch {
      Alert.alert('Enlace Copiado', bookingUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                    Información del Negocio
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.text.muted }]}>
                    Datos operativos y portal de autoservicio
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Banner de Enlace Público */}
                <View
                  style={[
                    styles.bookingLinkCard,
                    {
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                      borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.18)',
                    },
                  ]}
                >
                  <View style={styles.linkHeader}>
                    <Feather name="globe" size={16} color={colors.action.primary} />
                    <Text style={[styles.linkLabel, { color: colors.action.primary }]}>
                      Tu Enlace de Reserva Pública
                    </Text>
                  </View>
                  <Text style={[styles.linkUrlText, { color: colors.text.primary }]} numberOfLines={1}>
                    {bookingUrl}
                  </Text>
                  <TouchableOpacity
                    style={[styles.shareBtn, { backgroundColor: colors.action.primary }]}
                    onPress={handleShare}
                    activeOpacity={0.8}
                  >
                    <Feather name="share-2" size={14} color={colors.action.primaryText} />
                    <Text style={[styles.shareBtnText, { color: colors.action.primaryText }]}>
                      Compartir Enlace
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Detalle operativo */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <MaterialCommunityIcons name="domain" size={18} color={colors.text.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.text.muted }]}>Razón Social / Comercial</Text>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>{businessName}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Feather name="clock" size={18} color={colors.text.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.text.muted }]}>Horario de Atención</Text>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      Lunes a Sábado • 09:00 AM - 07:00 PM
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Feather name="map-pin" size={18} color={colors.text.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.text.muted }]}>Sucursal Principal</Text>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      Centro Comercial / Plaza Mayor, Local 14
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <MaterialCommunityIcons name="shape-outline" size={18} color={colors.text.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.text.muted }]}>Giro Comercial Activo</Text>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      Sector Personalizado
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.smallBadgeBtn, { backgroundColor: isDark ? '#2A2A2E' : '#EFEFF4' }]}
                    onPress={() => {
                      onClose();
                      onOpenMigration();
                    }}
                  >
                    <Text style={[styles.smallBadgeBtnText, { color: colors.text.primary }]}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.closeBottomBtn, { backgroundColor: isDark ? '#262628' : '#F2F2F7' }]}
                onPress={onClose}
              >
                <Text style={[styles.closeBottomBtnText, { color: colors.text.primary }]}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
