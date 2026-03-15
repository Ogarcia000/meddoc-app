import isEmail from 'validator/lib/isEmail';
import isStrongPassword from 'validator/lib/isStrongPassword';

/**
 * Valida un correo electrónico.
 */
export function validateEmail(email) {
  if (!email || !email.trim()) return 'El correo es obligatorio';
  if (!isEmail(email.trim())) return 'Correo electronico invalido';
  return null;
}

/**
 * Opciones de fortaleza de contraseña.
 * Requiere: min 8 chars, 1 minúscula, 1 mayúscula, 1 número, 1 símbolo.
 */
const PASSWORD_OPTIONS = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

/**
 * Valida la fortaleza de una contraseña.
 * Retorna null si es válida, o un mensaje de error.
 */
export function validatePassword(password) {
  if (!password) return 'La contraseña es obligatoria';

  if (password.length < PASSWORD_OPTIONS.minLength) {
    return `Minimo ${PASSWORD_OPTIONS.minLength} caracteres`;
  }

  if (!isStrongPassword(password, PASSWORD_OPTIONS)) {
    const missing = [];
    if (!/[a-z]/.test(password)) missing.push('una minuscula');
    if (!/[A-Z]/.test(password)) missing.push('una mayuscula');
    if (!/[0-9]/.test(password)) missing.push('un numero');
    if (!/[^a-zA-Z0-9]/.test(password)) missing.push('un simbolo (!@#$...)');

    if (missing.length > 0) {
      return `Falta: ${missing.join(', ')}`;
    }
    return 'La contraseña no es suficientemente segura';
  }

  return null;
}

/**
 * Calcula un score visual de fortaleza (0-4).
 */
export function passwordStrength(password) {
  if (!password) return { score: 0, label: '', color: '#6b7280' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Muy debil', color: '#ef4444' },
    { label: 'Debil', color: '#f97316' },
    { label: 'Aceptable', color: '#eab308' },
    { label: 'Buena', color: '#22c55e' },
    { label: 'Fuerte', color: '#38bdf8' },
  ];

  return { score, ...levels[score] };
}

/**
 * Valida que dos contraseñas coincidan.
 */
export function validatePasswordMatch(password, confirm) {
  if (!confirm) return 'Confirma tu contraseña';
  if (password !== confirm) return 'Las contraseñas no coinciden';
  return null;
}
