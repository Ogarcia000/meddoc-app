// Mock expo-crypto for Node test environment
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async (algo, data) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

import { hashPassword, generateSalt } from '../utils/crypto';

describe('hashPassword', () => {
  test('returns a hex string', async () => {
    const hash = await hashPassword('mypassword', 'mysalt');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('same input produces same hash', async () => {
    const hash1 = await hashPassword('password', 'salt');
    const hash2 = await hashPassword('password', 'salt');
    expect(hash1).toBe(hash2);
  });

  test('different salt produces different hash', async () => {
    const hash1 = await hashPassword('password', 'salt1');
    const hash2 = await hashPassword('password', 'salt2');
    expect(hash1).not.toBe(hash2);
  });

  test('different password produces different hash', async () => {
    const hash1 = await hashPassword('password1', 'salt');
    const hash2 = await hashPassword('password2', 'salt');
    expect(hash1).not.toBe(hash2);
  });
});

describe('generateSalt', () => {
  test('returns a string', () => {
    const salt = generateSalt();
    expect(typeof salt).toBe('string');
    expect(salt.length).toBeGreaterThan(0);
  });
});
