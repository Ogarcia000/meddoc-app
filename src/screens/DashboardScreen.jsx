import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos dias';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatToday() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function DashboardScreen({ navigation }) {
  const { patients, records, loading } = useData();
  const { user } = useAuth();

  const firstName = (user?.name || '').split(' ')[0] || 'Doctor';

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = records.filter((r) => new Date(r.date) >= weekAgo).length;
    return { thisWeek };
  }, [records]);

  // Pacientes atendidos recientemente (por fecha de ultimo registro)
  const recentPatients = useMemo(() => {
    const patientLastDate = new Map();
    records.forEach((r) => {
      const prev = patientLastDate.get(r.patientId);
      if (!prev || r.date > prev) patientLastDate.set(r.patientId, r.date);
    });

    return patients
      .filter((p) => patientLastDate.has(p.id))
      .map((p) => ({ ...p, lastVisit: patientLastDate.get(p.id) }))
      .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))
      .slice(0, 5);
  }, [patients, records]);

  // Pacientes sin registros (pendientes de primera consulta)
  const pendingPatients = useMemo(() => {
    const withRecords = new Set(records.map((r) => r.patientId));
    return patients.filter((p) => !withRecords.has(p.id)).slice(0, 3);
  }, [patients, records]);

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header con saludo */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
          <Text style={styles.date}>{formatToday()}</Text>
        </View>
        {user?.photoUri ? (
          <Image source={{ uri: user.photoUri }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.headerAvatarPlaceholder}>
            <Ionicons name="person" size={18} color={colors.accent} />
          </View>
        )}
      </View>

      {/* Stats en linea */}
      <View style={styles.statsRow}>
        <StatPill icon="people" value={patients.length} label="Pacientes" color={colors.accent} />
        <StatPill icon="document-text" value={records.length} label="Registros" color={colors.success} />
        <StatPill icon="calendar" value={stats.thisWeek} label="Esta semana" color={colors.warning} />
      </View>

      {/* Acciones rapidas */}
      <Text style={styles.sectionTitle}>Acciones rapidas</Text>
      <View style={styles.actionsRow}>
        <QuickAction
          icon="person-add-outline"
          label="Nuevo paciente"
          onPress={() => navigation.navigate('Pacientes', {
            screen: 'EditPatient',
            params: { mode: 'create' },
          })}
        />
        <QuickAction
          icon="search-outline"
          label="Buscar"
          onPress={() => navigation.navigate('Pacientes', { screen: 'PatientsList' })}
        />
        <QuickAction
          icon="document-text-outline"
          label="Nuevo registro"
          subtitle="Elige paciente"
          onPress={() => navigation.navigate('Pacientes', { screen: 'PatientsList' })}
        />
      </View>

      {/* Pacientes recientes */}
      {recentPatients.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Pacientes recientes</Text>
          {recentPatients.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.patientRow}
              onPress={() => navigation.navigate('Pacientes', {
                screen: 'PatientDetail',
                params: { patientId: p.id, patientName: p.name },
              })}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ultima visita ${p.lastVisit}`}
            >
              <View style={styles.patientAvatar}>
                <Text style={styles.patientInitial}>{p.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.patientMeta}>{p.internalId}</Text>
              </View>
              <View style={styles.lastVisitBadge}>
                <Text style={styles.lastVisitText}>{p.lastVisit}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Pendientes */}
      {pendingPatients.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Sin registros aun</Text>
          <View style={styles.pendingRow}>
            {pendingPatients.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.pendingCard}
                onPress={() => navigation.navigate('Pacientes', {
                  screen: 'PatientDetail',
                  params: { patientId: p.id, patientName: p.name },
                })}
                activeOpacity={0.7}
              >
                <View style={styles.pendingAvatar}>
                  <Text style={styles.pendingInitial}>{p.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.pendingName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.pendingId}>{p.internalId}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Vacio total */}
      {patients.length === 0 && (
        <View style={styles.emptyWrap}>
          <Ionicons name="medical-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Comienza agregando un paciente</Text>
          <Text style={styles.emptySubtitle}>
            Toca el boton + en la barra inferior o usa "Nuevo paciente" arriba
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatPill({ icon, value, label, color }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={16} color={color} style={{ marginRight: 6 }} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    flexShrink: 1,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },

  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },

  // Recent patients
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  patientInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  patientMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  lastVisitBadge: {
    marginRight: 8,
  },
  lastVisitText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Pending
  pendingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pendingCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  pendingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pendingInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pendingName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  pendingId: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
