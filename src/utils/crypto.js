import * as Crypto from 'expo-crypto';

/**
 * Hash de contraseña usando SHA-256 con salt.
 * Para producción real usar bcrypt en backend — esto es para auth local.
 */
export async function hashPassword(password, salt) {
  const data = `${salt}:${password}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

export function generateSalt() {
  return Crypto.randomUUID();
}
