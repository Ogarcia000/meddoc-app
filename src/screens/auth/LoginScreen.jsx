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
import { colors } from '../../theme/colors';
import { shared } from '../../theme/styles';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import { validateEmail } from '../../utils/validation';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passRef = useRef(null);

  const handleLogin = async () => {
    setError('');

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      hapticError();
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña');
      hapticError();
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      hapticSuccess();
    } catch (e) {
      hapticError();
      if (e.message === 'INVALID_CREDENTIALS') {
        setError('Correo o contraseña incorrectos');
      } else {
        setError('Error al iniciar sesion. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
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
            <Ionicons name="medkit" size={32} color={colors.textDark} />
          </View>
          <Text style={styles.logo}>MedDoc</Text>
          <Text style={styles.subtitle}>Documentacion medica</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Iniciar sesion</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={shared.field}>
            <Text style={shared.label}>Correo electronico</Text>
            <TextInput
              style={shared.input}
              placeholder="doctor@ejemplo.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
              accessibilityLabel="Correo electronico"
            />
          </View>

          <View style={shared.field}>
            <Text style={shared.label}>Contraseña</Text>
            <TextInput
              ref={passRef}
              style={shared.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Contraseña"
            />
          </View>

          <PrimaryButton
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={{ marginTop: 8 }}
          />

          <PrimaryButton
            title="Crear cuenta"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            style={{ marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  form: {},
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: colors.dangerText,
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
