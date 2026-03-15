import { formatBytes } from '../utils/imageStorage';

// Solo testear las funciones puras (formatBytes no necesita filesystem)
// Las funciones de IO (save, delete) se testean con integración

describe('formatBytes', () => {
  test('handles 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  test('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  test('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(5242880)).toBe('5.0 MB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });
});
