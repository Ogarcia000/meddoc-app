import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  passwordStrength,
} from '../utils/validation';

describe('validateEmail', () => {
  test('rejects empty email', () => {
    expect(validateEmail('')).toBeTruthy();
    expect(validateEmail('   ')).toBeTruthy();
    expect(validateEmail(null)).toBeTruthy();
  });

  test('rejects invalid formats', () => {
    expect(validateEmail('noarroba')).toBeTruthy();
    expect(validateEmail('no@')).toBeTruthy();
    expect(validateEmail('@no.com')).toBeTruthy();
    expect(validateEmail('no@no')).toBeTruthy();
  });

  test('accepts valid emails', () => {
    expect(validateEmail('doctor@hospital.com')).toBeNull();
    expect(validateEmail('dr.perez@clinica.mx')).toBeNull();
    expect(validateEmail('TEST@EXAMPLE.COM')).toBeNull();
  });
});

describe('validatePassword', () => {
  test('rejects empty password', () => {
    expect(validatePassword('')).toBeTruthy();
    expect(validatePassword(null)).toBeTruthy();
  });

  test('rejects short passwords', () => {
    expect(validatePassword('Ab1!')).toBeTruthy();
    expect(validatePassword('Short1!')).toBeTruthy();
  });

  test('rejects missing uppercase', () => {
    expect(validatePassword('abcdefg1!')).toBeTruthy();
  });

  test('rejects missing lowercase', () => {
    expect(validatePassword('ABCDEFG1!')).toBeTruthy();
  });

  test('rejects missing number', () => {
    expect(validatePassword('Abcdefgh!')).toBeTruthy();
  });

  test('rejects missing symbol', () => {
    expect(validatePassword('Abcdefg1')).toBeTruthy();
  });

  test('accepts strong passwords', () => {
    expect(validatePassword('Test123!')).toBeNull();
    expect(validatePassword('MyP@ssw0rd')).toBeNull();
    expect(validatePassword('C0mpl3x!Pass')).toBeNull();
  });
});

describe('validatePasswordMatch', () => {
  test('rejects empty confirm', () => {
    expect(validatePasswordMatch('Test123!', '')).toBeTruthy();
    expect(validatePasswordMatch('Test123!', null)).toBeTruthy();
  });

  test('rejects mismatch', () => {
    expect(validatePasswordMatch('Test123!', 'Test123?')).toBeTruthy();
    expect(validatePasswordMatch('Test123!', 'test123!')).toBeTruthy();
  });

  test('accepts match', () => {
    expect(validatePasswordMatch('Test123!', 'Test123!')).toBeNull();
  });
});

describe('passwordStrength', () => {
  test('returns 0 for empty', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength(null).score).toBe(0);
  });

  test('returns low score for weak passwords', () => {
    expect(passwordStrength('abc').score).toBeLessThan(2);
  });

  test('returns high score for strong passwords', () => {
    expect(passwordStrength('Test123!').score).toBeGreaterThanOrEqual(3);
  });

  test('returns max score for very strong passwords', () => {
    expect(passwordStrength('C0mpl3x!Pass').score).toBe(4);
  });
});
