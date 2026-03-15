import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Image,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { countImages } from '../database/images';
import { saveImagePermanently, deleteImageFile, getImageStorageSize, formatBytes } from '../utils/imageStorage';
import PrimaryButton from '../components/PrimaryButton';
import { confirmDialog } from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { colors } from '../theme/colors';
import { shared } from '../theme/styles';
import { hapticSuccess, hapticLight } from '../utils/haptics';

export default function SettingsScreen() {
  const { patients, records, resetAllData } = useData();
  const {
    user, logout,
    isLockAvailable, isLockEnabled, enableLock, disableLock,
    updateProfilePhoto,
  } = useAuth();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [imageCount, setImageCount] = useState(0);
  const [storageSize, setStorageSize] = useState(0);
  const [lockAvailable, setLockAvailable] = useState(false);
  const [lockOn, setLockOn] = useState(false);

  useEffect(() => {
    countImages().then(setImageCount);
    getImageStorageSize().then(setStorageSize);
  }, [records]);

  useEffect(() => {
    isLockAvailable().then(setLockAvailable);
    isLockEnabled().then(setLockOn);
  }, []);

  // --- Photo picker ---

  const pickPhoto = async (source) => {
    let result;

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la camara.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galeria.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
    }

    if (!result.canceled && result.assets?.[0]) {
      try {
        // Eliminar foto anterior si existe
        if (user?.photoUri) {
          await deleteImageFile(user.photoUri);
        }
        const permanentUri = await saveImagePermanently(result.assets[0].uri);
        await updateProfilePhoto(permanentUri);
        hapticSuccess();
        setToast({ visible: true, message: 'Foto actualizada', type: 'success' });
      } catch {
        Alert.alert('Error', 'No se pudo guardar la foto.');
      }
    }
  };

  const handleChangePhoto = () => {
    const options = user?.photoUri
      ? ['Cancelar', 'Tomar foto', 'Elegir de galeria', 'Eliminar foto']
      : ['Cancelar', 'Tomar foto', 'Elegir de galeria'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: user?.photoUri ? 3 : undefined,
        },
        (index) => {
          if (index === 1) pickPhoto('camera');
          if (index === 2) pickPhoto('gallery');
          if (index === 3) handleRemovePhoto();
        }
      );
    } else {
      const buttons = [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: () => pickPhoto('camera') },
        { text: 'Elegir de galeria', onPress: () => pickPhoto('gallery') },
      ];
      if (user?.photoUri) {
        buttons.push({
          text: 'Eliminar foto',
          style: 'destructive',
          onPress: handleRemovePhoto,
        });
      }
      Alert.alert('Foto de perfil', 'Elige una opcion', buttons);
    }
  };

  const handleRemovePhoto = async () => {
    if (user?.photoUri) {
      await deleteImageFile(user.photoUri);
      await updateProfilePhoto('');
      hapticLight();
      setToast({ visible: true, message: 'Foto eliminada', type: 'success' });
    }
  };

  // --- Actions ---

  const handleToggleLock = async (value) => {
    hapticLight();
    if (value) {
      await enableLock();
      setLockOn(true);
      setToast({ visible: true, message: 'Bloqueo biometrico activado', type: 'success' });
    } else {
      await disableLock();
      setLockOn(false);
      setToast({ visible: true, message: 'Bloqueo desactivado', type: 'success' });
    }
  };

  const handleResetData = async () => {
    const confirmed = await confirmDialog({
      title: 'Borrar todos los datos',
      message: 'Se eliminaran todos los pacientes, registros y fotos. Esta accion NO se puede deshacer.',
      confirmText: 'Borrar todo',
      destructive: true,
    });
    if (confirmed) {
      await resetAllData();
      hapticSuccess();
      setToast({ visible: true, message: 'Todos los datos han sido eliminados', type: 'success' });
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmDialog({
      title: 'Cerrar sesion',
      message: 'Tus datos se mantienen en el dispositivo. Podras volver a entrar con tu contraseña.',
      confirmText: 'Cerrar sesion',
    });
    if (confirmed) await logout();
  };

  const handleExportSummary = () => {
    const summary = patients
      .map((p) => {
        const recs = records.filter((r) => r.patientId === p.id);
        return `${p.name} (${p.internalId}) — ${recs.length} registros`;
      })
      .join('\n');
    console.log('=== RESUMEN MEDDOC ===\n' + summary);
    setToast({
      visible: true,
      message: `Resumen de ${patients.length} pacientes exportado`,
      type: 'success',
    });
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={shared.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Ajustes</Text>

      {/* Perfil con avatar */}
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={handleChangePhoto}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
        >
          {user?.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color={colors.textDark} />
          </View>
        </TouchableOpacity>

        <Text style={styles.profileName}>{user?.name || '—'}</Text>
        <Text style={styles.profileEmail}>{user?.email || '—'}</Text>
        {user?.specialty ? (
          <Text style={styles.profileSpecialty}>{user.specialty}</Text>
        ) : null}
      </View>

      {/* Seguridad */}
      <View style={styles.section}>
        <Text style={shared.sectionTitle}>Seguridad</Text>
        <View style={styles.infoCard}>
          {lockAvailable ? (
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Bloqueo biometrico</Text>
                <Text style={styles.switchHint}>Pedir Face ID / huella al abrir la app</Text>
              </View>
              <Switch
                value={lockOn}
                onValueChange={handleToggleLock}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFF"
                accessibilityLabel="Activar bloqueo biometrico"
              />
            </View>
          ) : (
            <View style={styles.switchRow}>
              <Text style={styles.switchHint}>
                Tu dispositivo no tiene biometria configurada
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={shared.sectionTitle}>Informacion</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Pacientes" value={String(patients.length)} />
          <InfoRow label="Registros" value={String(records.length)} />
          <InfoRow label="Fotos" value={`${imageCount} (${formatBytes(storageSize)})`} />
          <InfoRow label="Almacenamiento" value="SQLite (local)" />
        </View>
      </View>

      {/* Datos */}
      <View style={styles.section}>
        <Text style={shared.sectionTitle}>Datos</Text>
        <PrimaryButton
          title="Exportar resumen a consola"
          variant="outline"
          onPress={handleExportSummary}
          style={styles.btn}
        />
        <PrimaryButton
          title="Borrar todos los datos"
          variant="danger"
          onPress={handleResetData}
          style={styles.btn}
        />
      </View>

      {/* Sesion */}
      <View style={styles.section}>
        <PrimaryButton
          title="Cerrar sesion"
          variant="outline"
          onPress={handleLogout}
          style={styles.btn}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.about}>
          MedDoc — Documentacion medica segura.{'\n'}
          Todos los datos se almacenan localmente.
        </Text>
      </View>

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  // Profile
  profileSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.accent,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgCard,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileSpecialty: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
    marginTop: 4,
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  switchHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  btn: {
    marginTop: 10,
  },
  about: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
