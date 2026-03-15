import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import PrimaryButton from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';

export default function LockScreen() {
  const { unlock, logout } = useAuth();

  useEffect(() => {
    unlock();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={32} color={colors.textDark} />
        </View>
        <Text style={styles.title}>MedDoc esta bloqueado</Text>
        <Text style={styles.subtitle}>
          Usa tu huella, Face ID o contraseña del dispositivo para continuar
        </Text>

        <PrimaryButton
          title="Desbloquear"
          onPress={unlock}
          style={{ marginTop: 24, width: '100%' }}
        />

        <PrimaryButton
          title="Cerrar sesion"
          variant="outline"
          onPress={logout}
          style={{ marginTop: 12, width: '100%' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
