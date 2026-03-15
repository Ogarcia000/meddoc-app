import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as UsersDB from '../database/users';

const SESSION_KEY = 'meddoc_session';
const LOCK_ENABLED_KEY = 'meddoc_lock_enabled';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  // Restaurar sesion al arrancar
  useEffect(() => {
    (async () => {
      try {
        const sessionJson = await SecureStore.getItemAsync(SESSION_KEY);
        if (sessionJson) {
          const session = JSON.parse(sessionJson);
          setUser(session);

          // Verificar si hay lock activado
          const lockEnabled = await SecureStore.getItemAsync(LOCK_ENABLED_KEY);
          if (lockEnabled === 'true') {
            setLocked(true);
          }
        }
      } catch (e) {
        console.error('Error restaurando sesion:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const register = useCallback(async ({ name, email, password, specialty }) => {
    const newUser = await UsersDB.createUser({ name, email, password, specialty });
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback(async (email, password) => {
    const verifiedUser = await UsersDB.verifyUser(email, password);
    if (!verifiedUser) throw new Error('INVALID_CREDENTIALS');
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(verifiedUser));
    setUser(verifiedUser);
    setLocked(false);
    return verifiedUser;
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setUser(null);
    setLocked(false);
  }, []);

  const updateProfile = useCallback(async (data) => {
    if (!user) return;
    await UsersDB.updateUser(user.id, data);
    const updated = { ...user, ...data };
    setUser(updated);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(updated));
  }, [user]);

  const updateProfilePhoto = useCallback(async (photoUri) => {
    if (!user) return;
    await UsersDB.updatePhotoUri(user.id, photoUri);
    const updated = { ...user, photoUri };
    setUser(updated);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(updated));
  }, [user]);

  const changePassword = useCallback(async (newPassword) => {
    if (!user) return;
    await UsersDB.changePassword(user.id, newPassword);
  }, [user]);

  // --- Lock / Biometria ---

  const isLockAvailable = useCallback(async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }, []);

  const enableLock = useCallback(async () => {
    await SecureStore.setItemAsync(LOCK_ENABLED_KEY, 'true');
  }, []);

  const disableLock = useCallback(async () => {
    await SecureStore.setItemAsync(LOCK_ENABLED_KEY, 'false');
    setLocked(false);
  }, []);

  const isLockEnabled = useCallback(async () => {
    const val = await SecureStore.getItemAsync(LOCK_ENABLED_KEY);
    return val === 'true';
  }, []);

  const unlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear MedDoc',
      fallbackLabel: 'Usar contraseña',
      disableDeviceFallback: false,
    });
    if (result.success) {
      setLocked(false);
      return true;
    }
    return false;
  }, []);

  const lockApp = useCallback(() => {
    setLocked(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        locked,
        register,
        login,
        logout,
        updateProfile,
        updateProfilePhoto,
        changePassword,
        isLockAvailable,
        enableLock,
        disableLock,
        isLockEnabled,
        unlock,
        lockApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
