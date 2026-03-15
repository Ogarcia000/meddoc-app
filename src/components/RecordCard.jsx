import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

const CATEGORY_COLORS = {
  'Consulta inicial': '#0EA5E9',
  'Seguimiento': '#10B981',
  'Procedimiento': '#F59E0B',
  'Urgencia': '#EF4444',
  'Control': '#8B5CF6',
};

export default function RecordCard({ record, images = [], onPress, onDelete, onImageTap }) {
  const dotColor = CATEGORY_COLORS[record.category] || colors.textMuted;
  const hasImages = images.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onDelete}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${record.category || 'Registro'}, ${record.date}, ${record.description.substring(0, 60)}`}
      accessibilityHint="Toca para editar, manten presionado para eliminar"
    >
      <View style={styles.headerRow}>
        <View style={styles.categoryRow}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} accessibilityElementsHidden />
          <Text style={styles.category}>
            {record.category || 'Sin categoria'}
          </Text>
        </View>
        <Text style={styles.date}>{record.date}</Text>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {record.description}
      </Text>

      {hasImages && (
        <View style={styles.thumbRow}>
          {images.slice(0, 4).map((img, i) => (
            <TouchableOpacity
              key={img.id || i}
              onPress={() => onImageTap?.(i)}
              activeOpacity={0.8}
              accessibilityRole="image"
              accessibilityLabel={`Foto ${i + 1} de ${images.length}`}
            >
              <Image source={{ uri: img.uri }} style={styles.thumb} />
            </TouchableOpacity>
          ))}
          {images.length > 4 && (
            <View style={styles.moreThumb} accessibilityLabel={`${images.length - 4} fotos mas`}>
              <Text style={styles.moreText}>+{images.length - 4}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  thumbRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  moreThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
