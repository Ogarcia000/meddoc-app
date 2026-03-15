import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export default function PatientCard({ patient, onPress, onLongPress }) {
  const recordCount = patient._recordCount ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${patient.name}, ID ${patient.internalId}, ${recordCount} registros`}
      accessibilityHint="Toca para ver detalle, manten presionado para eliminar"
    >
      <View style={styles.row}>
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>
            {patient.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{patient.name}</Text>
          <Text style={styles.meta}>ID: {patient.internalId}</Text>
          <Text style={styles.meta}>{patient.birthDate}</Text>
        </View>

        <View style={styles.badge} accessibilityElementsHidden>
          <Text style={styles.badgeText}>{recordCount}</Text>
          <Text style={styles.badgeLabel}>reg.</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  badge: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  badgeLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
