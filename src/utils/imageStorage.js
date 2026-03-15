import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { generateId } from './id';

const IMAGES_DIR = `${FileSystem.documentDirectory}meddoc-images/`;

// Compresión: max 1200px de lado largo, JPEG 70% calidad
// Una foto de 4MB del iPhone queda en ~150-300KB
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;

/**
 * Asegura que el directorio de imagenes exista.
 */
async function ensureDir() {
  const info = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

/**
 * Comprime una imagen: redimensiona al max 1200px y convierte a JPEG 70%.
 * Retorna la URI del archivo comprimido (en cache temporal).
 */
async function compressImage(uri) {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: SaveFormat.JPEG }
  );
  return result.uri;
}

/**
 * Comprime y guarda una imagen permanentemente.
 * Flujo: tempUri → comprimir → copiar a documentDirectory
 * Retorna la URI persistente.
 */
export async function saveImagePermanently(tempUri) {
  await ensureDir();

  // Comprimir primero
  const compressedUri = await compressImage(tempUri);

  const filename = `${generateId()}.jpg`;
  const destUri = `${IMAGES_DIR}${filename}`;
  await FileSystem.moveAsync({ from: compressedUri, to: destUri });
  return destUri;
}

/**
 * Elimina una imagen del almacenamiento permanente.
 */
export async function deleteImageFile(uri) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (e) {
    console.warn('No se pudo eliminar imagen:', uri, e);
  }
}

/**
 * Elimina multiples imagenes.
 */
export async function deleteImageFiles(uris) {
  await Promise.all(uris.map(deleteImageFile));
}

/**
 * Calcula el tamaño total de todas las imagenes guardadas.
 * Retorna bytes.
 */
export async function getImageStorageSize() {
  try {
    const info = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!info.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    let total = 0;
    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${IMAGES_DIR}${file}`);
      if (fileInfo.exists && fileInfo.size) {
        total += fileInfo.size;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

/**
 * Formatea bytes a texto legible.
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
