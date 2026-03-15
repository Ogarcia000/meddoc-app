import { Alert } from 'react-native';

/**
 * Muestra un diálogo de confirmación nativo.
 * Devuelve una promesa que resuelve a true si el usuario confirma.
 */
export function confirmDialog({
  title = 'Confirmar',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
} = {}) {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
