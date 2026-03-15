import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useData } from '../context/DataContext';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { shared } from '../theme/styles';
import { isValidDate } from '../utils/date';
import { hapticError, hapticSuccess, hapticLight } from '../utils/haptics';

const GENDERS = ['M', 'F', 'Otro'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MAX_NOTES_LENGTH = 500;

export default function EditPatientScreen({ route, navigation }) {
  const mode = route?.params?.mode || 'create';
  const existingPatient = route?.params?.patient || null;
  const { patients, addPatient, updatePatient } = useData();

  const [name, setName] = useState(existingPatient?.name || '');
  const [internalId, setInternalId] = useState(existingPatient?.internalId || '');
  const [birthDate, setBirthDate] = useState(existingPatient?.birthDate || '');
  const [gender, setGender] = useState(existingPatient?.gender || '');
  const [phone, setPhone] = useState(existingPatient?.phone || '');
  const [bloodType, setBloodType] = useState(existingPatient?.bloodType || '');
  const [allergies, setAllergies] = useState(existingPatient?.allergies || '');
  const [notes, setNotes] = useState(existingPatient?.notes || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = mode === 'edit';

  // Refs para focus encadenado
  const idRef = useRef(null);
  const birthRef = useRef(null);
  const phoneRef = useRef(null);
  const allergiesRef = useRef(null);
  const notesRef = useRef(null);
  const scrollRef = useRef(null);

  const validate = () => {
    const e = {};
    const trimName = name.trim();
    const trimId = internalId.trim();
    const trimBirth = birthDate.trim();
    const trimPhone = phone.trim();

    if (!trimName) e.name = 'El nombre es obligatorio';
    if (!trimId) e.internalId = 'El ID interno es obligatorio';

    // Verificar ID duplicado
    if (trimId && !isEdit) {
      const exists = patients.some(
        (p) => p.internalId.toLowerCase() === trimId.toLowerCase()
      );
      if (exists) e.internalId = 'Este ID ya existe';
    }
    if (trimId && isEdit && existingPatient) {
      const exists = patients.some(
        (p) =>
          p.id !== existingPatient.id &&
          p.internalId.toLowerCase() === trimId.toLowerCase()
      );
      if (exists) e.internalId = 'Este ID ya existe';
    }

    if (trimBirth) {
      if (!isValidDate(trimBirth)) {
        e.birthDate = 'Fecha invalida (YYYY-MM-DD)';
      } else {
        const d = new Date(trimBirth);
        if (d > new Date()) e.birthDate = 'La fecha no puede ser futura';
        const age = new Date().getFullYear() - d.getFullYear();
        if (age > 150) e.birthDate = 'Fecha no realista';
      }
    }

    if (trimPhone && !/^[+\d\s()-]{7,20}$/.test(trimPhone)) {
      e.phone = 'Telefono invalido';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      hapticError();
      return;
    }

    setSaving(true);

    const data = {
      name: name.trim(),
      internalId: internalId.trim(),
      birthDate: birthDate.trim(),
      gender,
      phone: phone.trim(),
      bloodType,
      allergies: allergies.trim(),
      notes: notes.trim(),
    };

    try {
      if (isEdit && existingPatient) {
        await updatePatient(existingPatient.id, data);
      } else {
        await addPatient(data);
      }
      hapticSuccess();
      navigation.goBack();
    } catch (e) {
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
        ref={scrollRef}
        style={shared.screen}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={shared.title}>
          {isEdit ? 'Editar paciente' : 'Nuevo paciente'}
        </Text>

        {/* Nombre */}
        <View style={shared.field}>
          <Text style={shared.label}>Nombre *</Text>
          <TextInput
            style={fieldStyle('name')}
            placeholder="Nombre completo"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
            returnKeyType="next"
            onSubmitEditing={() => idRef.current?.focus()}
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityLabel="Nombre del paciente"
            accessibilityHint="Ingresa el nombre completo"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* ID interno */}
        <View style={shared.field}>
          <Text style={shared.label}>ID interno *</Text>
          <TextInput
            ref={idRef}
            style={fieldStyle('internalId')}
            placeholder="Ej: P-001"
            placeholderTextColor={colors.textMuted}
            value={internalId}
            onChangeText={(t) => { setInternalId(t); setErrors((e) => ({ ...e, internalId: undefined })); }}
            returnKeyType="next"
            onSubmitEditing={() => birthRef.current?.focus()}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="ID interno del paciente"
          />
          {errors.internalId && <Text style={styles.errorText}>{errors.internalId}</Text>}
        </View>

        {/* Genero */}
        <View style={shared.field}>
          <Text style={shared.label}>Genero</Text>
          <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Genero">
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => { hapticLight(); setGender(gender === g ? '' : g); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: gender === g }}
                accessibilityLabel={g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : 'Otro'}
              >
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fecha de nacimiento */}
        <View style={shared.field}>
          <Text style={shared.label}>Fecha de nacimiento</Text>
          <TextInput
            ref={birthRef}
            style={fieldStyle('birthDate')}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={birthDate}
            onChangeText={(t) => { setBirthDate(t); setErrors((e) => ({ ...e, birthDate: undefined })); }}
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            keyboardType="numeric"
            autoCorrect={false}
            accessibilityLabel="Fecha de nacimiento"
            accessibilityHint="Formato año mes dia"
          />
          {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
        </View>

        {/* Telefono */}
        <View style={shared.field}>
          <Text style={shared.label}>Telefono</Text>
          <TextInput
            ref={phoneRef}
            style={fieldStyle('phone')}
            placeholder="+52 55 1234 5678"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: undefined })); }}
            returnKeyType="next"
            onSubmitEditing={() => allergiesRef.current?.focus()}
            keyboardType="phone-pad"
            autoCorrect={false}
            accessibilityLabel="Numero de telefono"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Tipo de sangre */}
        <View style={shared.field}>
          <Text style={shared.label}>Tipo de sangre</Text>
          <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Tipo de sangre">
            {BLOOD_TYPES.map((bt) => (
              <TouchableOpacity
                key={bt}
                style={[styles.chip, bloodType === bt && styles.chipActive]}
                onPress={() => { hapticLight(); setBloodType(bloodType === bt ? '' : bt); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: bloodType === bt }}
                accessibilityLabel={`Tipo ${bt}`}
              >
                <Text style={[styles.chipText, bloodType === bt && styles.chipTextActive]}>
                  {bt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alergias */}
        <View style={shared.field}>
          <Text style={shared.label}>Alergias</Text>
          <TextInput
            ref={allergiesRef}
            style={shared.input}
            placeholder="Ej: Penicilina, latex..."
            placeholderTextColor={colors.textMuted}
            value={allergies}
            onChangeText={setAllergies}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
            autoCapitalize="sentences"
            accessibilityLabel="Alergias del paciente"
          />
        </View>

        {/* Notas */}
        <View style={shared.field}>
          <Text style={shared.label}>Notas ({notes.length}/{MAX_NOTES_LENGTH})</Text>
          <TextInput
            ref={notesRef}
            style={[shared.input, shared.textarea]}
            placeholder="Notas generales del paciente"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={(t) => t.length <= MAX_NOTES_LENGTH && setNotes(t)}
            returnKeyType="done"
            multiline
            autoCapitalize="sentences"
            accessibilityLabel="Notas del paciente"
          />
        </View>

        <PrimaryButton
          title="Guardar"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={{ marginTop: 16 }}
          accessibilityLabel={isEdit ? 'Guardar cambios del paciente' : 'Crear nuevo paciente'}
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
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
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
});
