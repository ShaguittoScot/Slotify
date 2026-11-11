import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  LinearTransition,
} from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme';
import { useCalendarStore } from '@/features/calendar/model';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

interface ClientItem {
  id: string;
  name: string;
  phone: string;
  lastService: string;
  visits: number;
  status: 'active' | 'frequent';
}

const DEFAULT_CLIENTS: ClientItem[] = [
  {
    id: 'cl-1',
    name: 'Carlos Mendoza',
    phone: '+52 55 4123 8901',
    lastService: 'Corte Clásico & Barba',
    visits: 8,
    status: 'frequent',
  },
  {
    id: 'cl-2',
    name: 'Laura Gómez',
    phone: '+52 55 6789 2341',
    lastService: 'Diseño & Estilizado',
    visits: 5,
    status: 'frequent',
  },
  {
    id: 'cl-3',
    name: 'Roberto Díaz',
    phone: '+52 55 3390 1122',
    lastService: 'Tratamiento Facial',
    visits: 2,
    status: 'active',
  },
  {
    id: 'cl-4',
    name: 'Andrea Ruiz',
    phone: '+52 55 9012 4455',
    lastService: 'Manicura Spa',
    visits: 4,
    status: 'active',
  },
];

export function ClientsScreen() {
  const { colors, isDark } = useAppTheme();
  const { slots } = useCalendarStore();
  const [query, setQuery] = useState('');

  const clients = useMemo(() => {
    const map = new Map<string, ClientItem>();
    DEFAULT_CLIENTS.forEach((c) => map.set(c.name.toLowerCase(), c));

    slots
      .filter((s) => s.type === 'appointment' && s.status !== 'cancelled')
      .forEach((apt, idx) => {
        const name = apt.clientName || 'Cliente Reservado';
        const key = name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: `apt-cl-${idx}`,
            name,
            phone: apt.clientPhone || '+52 55 0000 0000',
            lastService: apt.title || 'Cita programada',
            visits: 1,
            status: 'active',
          });
        }
      });

    const list = Array.from(map.values());
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastService.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [slots, query]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <Animated.View
          entering={FadeInDown.duration(380).springify()}
          style={[
            s.header,
            { borderBottomColor: isDark ? '#1E1E24' : colors.border.main },
          ]}
        >
          <View style={s.headerTop}>
            <View>
              <View style={s.tagRow}>
                <View style={s.tagDot} />
                <Text style={[s.tagText, { color: colors.text.muted }]}>
                  CARTERA ACTIVA
                </Text>
              </View>
              <Text style={[s.title, { color: colors.text.primary }]}>
                Clientes
              </Text>
            </View>
            <View
              style={[
                s.countPill,
                {
                  backgroundColor: isDark ? '#14141A' : '#F4F4F5',
                  borderColor: isDark ? '#24242C' : '#E4E4E7',
                },
              ]}
            >
              <Feather name="users" size={13} color="#818CF8" />
              <Text style={[s.countText, { color: colors.text.primary }]}>
                {clients.length}
              </Text>
            </View>
          </View>

          <View
            style={[
              s.searchBox,
              {
                backgroundColor: isDark ? '#121216' : colors.background.secondary,
                borderColor: isDark ? '#24242C' : colors.border.main,
              },
            ]}
          >
            <Feather name="search" size={15} color={colors.text.muted} />
            <TextInput
              style={[s.searchInput, { color: colors.text.primary }]}
              placeholder="Buscar por nombre o servicio..."
              placeholderTextColor={colors.text.muted}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Feather name="x" size={15} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              layout={LinearTransition.springify()}
              entering={FadeInRight.duration(340).delay(index * 55)}
            >
              <AnimatedPressable
                style={[
                  s.clientCard,
                  {
                    backgroundColor: isDark ? '#121216' : '#FFFFFF',
                    borderColor: isDark ? '#22222A' : '#E4E4E7',
                  },
                ]}
              >
                <View
                  style={[
                    s.avatarBox,
                    {
                      backgroundColor: isDark ? '#1A1A22' : '#EEF2FF',
                      borderColor: 'rgba(129, 140, 248, 0.3)',
                    },
                  ]}
                >
                  <Text style={s.avatarText}>{getInitials(item.name)}</Text>
                </View>

                <View style={s.clientInfo}>
                  <Text
                    style={[s.clientName, { color: colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[s.clientService, { color: colors.text.muted }]}
                    numberOfLines={1}
                  >
                    {item.lastService}
                  </Text>
                </View>

                <View style={s.clientRight}>
                  <View
                    style={[
                      s.visitBadge,
                      {
                        backgroundColor:
                          item.status === 'frequent'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : isDark
                            ? '#1A1A22'
                            : '#F4F4F5',
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.visitDot,
                        {
                          backgroundColor:
                            item.status === 'frequent' ? '#10B981' : '#818CF8',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        s.visitText,
                        {
                          color:
                            item.status === 'frequent'
                              ? '#10B981'
                              : colors.text.secondary,
                        },
                      ]}
                    >
                      {item.visits} {item.visits === 1 ? 'cita' : 'citas'}
                    </Text>
                  </View>
                </View>
              </AnimatedPressable>
            </Animated.View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 10,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#818CF8',
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  clientService: {
    fontSize: 12.5,
  },
  clientRight: {
    alignItems: 'flex-end',
  },
  visitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  visitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  visitText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
