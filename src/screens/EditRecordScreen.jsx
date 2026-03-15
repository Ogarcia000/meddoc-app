import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../context/DataContext';
import PrimaryButton from '../components/PrimaryButton';
import ImageGrid from '../components/ImageGrid';
import ImageViewer from '../components/ImageViewer';
import { confirmDialog } from '../components/ConfirmDialog';
import { colors } from '../theme/colors';
import { shared } from '../theme/styles';
import { isValidDate, todayString } from '../utils/date';
import { hapticError, hapticSuccess, hapticLight } from '../utils/haptics';

const CATEGORIES = [
  'Consulta inicial',
  'Seguimiento',
  'Procedimiento',
  'Urgencia',
  'Control',
];

const MAX_DESC_LENGTH = 1000;

export default function EditRecordScreen({ route, navigation }) {
  const { mode = 'create', record, patientId } = route.params || {};
  const { addRecord, updateRecord, getImagesForRecord, addImage, removeImage } = useData();

  const [date, setDate] = useState(record?.date || todayString());
  const [category, setCategory] = useState(record?.category || '');
  const [description, setDescription] = useState(record?.description || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [savedImages, setSavedImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(false);

  const descRef = useRef(null);
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (isEdit && record?.id) {
      setLoadingImages(true);
      getImagesForRecord(record.id)
        .then(setSavedImages)
        .catch(() => {})
        .finally(() => setLoadingImages(false));
    }
  }, [isEdit, record?.id]);

  const allImages = [
    ...savedImages,
    ...pendingImages.map((uri, i) => ({ id: `pending-${i}`, uri, _pending: true })),
  ];

  const validate = () => {
    const e = {};
    if (!date.trim()) e.date = 'La fecha es obligatoria';
    else if (!isValidDate(date.trim())) e.date = 'Fecha invalida (YYYY-MM-DD)';
    else {
      const d = new Date(date.trim());
      const future = new Date();
      future.setDate(future.getDate() + 1);
      if (d > future) e.date = 'La fecha no puede ser futura';
    }

    if (!description.trim()) e.description = 'La descripcion es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImage = async (source) => {
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
      });
    }

    if (!result.canceled && result.assets?.[0]) {
      hapticLight();
      setPendingImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleAddImage = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar foto', 'Elegir de galeria'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) pickImage('camera');
          if (index === 2) pickImage('gallery');
        }
      );
    } else {
      Alert.alert('Agregar imagen', 'Elige una opcion', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: () => pickImage('camera') },
        { text: 'Elegir de galeria', onPress: () => pickImage('gallery') },
      ]);
    }
  };

  const handleRemoveImage = async (index, img) => {
    if (img._pending) {
      const pendingIdx = index - savedImages.length;
      setPendingImages((prev) => prev.filter((_, i) => i !== pendingIdx));
      hapticLight();
    } else {
      const confirmed = await confirmDialog({
        title: 'Eliminar foto',
        message: 'Se eliminara esta foto permanentemente.',
        confirmText: 'Eliminar',
        destructive: true,
      });
      if (confirmed) {
        await removeImage(img.id);
        setSavedImages((prev) => prev.filter((i) => i.id !== img.id));
        hapticSuccess();
      }
    }
  };

  const handleTapImage = (index) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const handleSave = async () => {
    if (!validate()) {
      hapticError();
      return;
    }

    setSaving(true);

    const data = {
      patientId: patientId || record?.patientId,
      date: date.trim(),
      category,
      description: description.trim(),
      images: [],
    };

    try {
      let recordId;

      if (isEdit && record) {
        await updateRecord(record.id, data);
        recordId = record.id;
      } else {
        const newRecord = await addRecord(data);
        recordId = newRecord.id;
      }

      const startPosition = savedImages.length;
      for (let i = 0; i < pendingImages.length; i++) {
        await addImage(recordId, pendingImages[i], '', startPosition + i);
      }

      hapticSuccess();
      navigation.goBack();
    } catch (e) {
      console.error('Error guardando registro:', e);
      hapticError();
      setSaving(false);
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    }
  };

  const fieldStyle = (key) => [
    shared.input,
    errors[key] && { borderColor: colors.borderError },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={shared.screen}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={shared.title}>
          {isEdit ? 'Editar registro' : 'Nuevo registro'}
        </Text>

        {/* Fecha */}
        <View style={shared.field}>
          <Text style={shared.label}>Fecha *</Text>
          <TextInput
            style={fieldStyle('date')}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={date}
            onChangeText={(t) => { setDate(t); setErrors((e) => ({ ...e, date: undefined })); }}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            keyboardType="numeric"
            autoCorrect={false}
            accessibilityLabel="Fecha del registro"
            accessibilityHint="Formato año mes dia"
          />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Categoria */}
        <View style={shared.field}>
          <Text style={shared.label}>Categoria</Text>
          <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Categoria del registro">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => { hapticLight(); setCategory(category === cat ? '' : cat); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: category === cat }}
                accessibilityLabel={cat}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripcion */}
        <View style={shared.field}>
          <Text style={shared.label}>Descripcion * ({description.length}/{MAX_DESC_LENGTH})</Text>
          <TextInput
            ref={descRef}
            style={[...fieldStyle('description'), styles.textarea]}
            placeholder="Describe brevemente que se hizo en esta visita."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={(t) => {
              if (t.length <= MAX_DESC_LENGTH) {
                setDescription(t);
                setErrors((e) => ({ ...e, description: undefined }));
              }
            }}
            multiline
            autoCapitalize="sentences"
            accessibilityLabel="Descripcion del registro"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Fotos */}
        <View style={shared.field}>
          <Text style={shared.label}>Fotos ({allImages.length}/6)</Text>
          {loadingImages ? (
            <Text style={styles.loadingText}>Cargando fotos...</Text>
          ) : (
            <ImageGrid
              images={allImages}
              onAdd={allImages.length < 6 ? handleAddImage : undefined}
              onRemove={handleRemoveImage}
              onTap={handleTapImage}
              maxImages={6}
              editable
            />
          )}
        </View>

        <PrimaryButton
          title="Guardar"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={{ marginTop: 16 }}
          accessibilityLabel={isEdit ? 'Guardar cambios del registro' : 'Crear nuevo registro'}
        />

        <PrimaryButton
          title="Cancelar"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={saving}
          style={{ marginTop: 8 }}
          accessibilityLabel="Cancelar y volver"
        />
      </ScrollView>

      <ImageViewer
        images={allImages}
        initialIndex={viewerIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.bgElevated,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  textarea: {
    height: 110,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
