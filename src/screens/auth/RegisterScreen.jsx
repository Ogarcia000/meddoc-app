import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import PrimaryButton from '../../components/PrimaryButton';
import PasswordStrengthBar from '../../components/PasswordStrengthBar';
import { colors } from '../../theme/colors';
import { shared } from '../../theme/styles';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '../../utils/validation';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const emailRef = useRef(null);
  const specRef = useRef(null);
  const passRef = useRef(null);
  const confirmRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio';
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) e.password = passErr;
    const matchErr = validatePasswordMatch(password, confirm);
    if (matchErr) e.confirm = matchErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    setGlobalError('');
    if (!validate()) { hapticError(); return; }

    setLoading(true);
    try {
      await register({ name, email, password, specialty });
      hapticSuccess();
    } catch (e) {
      hapticError();
      if (e.message === 'EMAIL_EXISTS') {
        setErrors((prev) => ({ ...prev, email: 'Ya existe una cuenta con este correo' }));
      } else {
        setGlobalError('Error al crear cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (key) => [
    shared.input,
    errors[key] && { borderColor: colors.borderError },
  ];

  const clearError = (key) => {
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setGlobalError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="medkit" size={28} color={colors.textDark} />
          </View>
          <Text style={styles.logo}>MedDoc</Text>
        </View>

        <Text style={styles.title}>Crear cuenta</Text>

        {globalError ? <Text style={styles.globalError}>{globalError}</Text> : null}

        <View style={shared.field}>
          <Text style={shared.label}>Nombre completo *</Text>
          <TextInput
            style={fieldStyle('name')}
            placeholder="Dr. Juan Perez"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={(t) => { setName(t); clearError('name'); }}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            accessibilityLabel="Nombre completo"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={shared.field}>
          <Text style={shared.label}>Correo electronico *</Text>
          <TextInput
            ref={emailRef}
            style={fieldStyle('email')}
            placeholder="doctor@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={(t) => { setEmail(t); clearError('email'); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => specRef.current?.focus()}
            accessibilityLabel="Correo electronico"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={shared.field}>
          <Text style={shared.label}>Especialidad</Text>
          <TextInput
            ref={specRef}
            style={shared.input}
            placeholder="Ej: Dermatologia, Cirugia..."
            placeholderTextColor={colors.textMuted}
            value={specialty}
            onChangeText={setSpecialty}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()}
            accessibilityLabel="Especialidad medica"
          />
        </View>

        <View style={shared.field}>
          <Text style={shared.label}>Contraseña *</Text>
          <TextInput
            ref={passRef}
            style={fieldStyle('password')}
            placeholder="Min 8, mayuscula, numero, simbolo"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={(t) => { setPassword(t); clearError('password'); }}
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            accessibilityLabel="Contraseña"
          />
          <PasswordStrengthBar password={password} />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        <View style={shared.field}>
          <Text style={shared.label}>Confirmar contraseña *</Text>
          <TextInput
            ref={confirmRef}
            style={fieldStyle('confirm')}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            value={confirm}
            onChangeText={(t) => { setConfirm(t); clearError('confirm'); }}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleRegister}
            accessibilityLabel="Confirmar contraseña"
          />
          {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
        </View>

        <View style={styles.requirements}>
          <Text style={styles.reqTitle}>Requisitos de contraseña:</Text>
          <Requirement met={password.length >= 8} text="8 caracteres minimo" />
          <Requirement met={/[A-Z]/.test(password)} text="Una letra mayuscula" />
          <Requirement met={/[a-z]/.test(password)} text="Una letra minuscula" />
          <Requirement met={/[0-9]/.test(password)} text="Un numero" />
          <Requirement met={/[^a-zA-Z0-9]/.test(password)} text="Un simbolo (!@#$...)" />
        </View>

        <PrimaryButton
          title="Crear cuenta"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={{ marginTop: 16 }}
        />

        <PrimaryButton
          title="Ya tengo cuenta"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={{ marginTop: 10 }}
        />

        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Requirement({ met, text }) {
  return (
    <Text style={[styles.reqItem, met && styles.reqMet]}>
      {met ? '✓' : '○'}  {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: { fontSize: 28, fontWeight: '800', color: colors.text },
  title: { fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: 16 },
  globalError: {
    fontSize: 13,
    color: colors.dangerText,
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  errorText: { fontSize: 12, color: colors.dangerText, marginTop: 4 },
  requirements: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reqTitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  reqItem: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  reqMet: { color: colors.success },
});
