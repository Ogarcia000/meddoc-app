import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export default function ImageGrid({
  images = [],
  onAdd,
  onRemove,
  onTap,
  maxImages = 6,
  editable = true,
}) {
  return (
    <View style={styles.grid}>
      {images.map((img, index) => {
        const uri = typeof img === 'string' ? img : img.uri;
        return (
          <TouchableOpacity
            key={img.id || index}
            style={styles.imageContainer}
            onPress={() => onTap?.(index)}
            onLongPress={() => editable && onRemove?.(index, img)}
            activeOpacity={0.8}
          >
            <Image source={{ uri }} style={styles.image} />
            {editable && (
              <View style={styles.removeBadge}>
                <Text style={styles.removeBadgeText}>×</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {editable && images.length < maxImages && onAdd ? (
        <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.7}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addText}>Foto</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  addIcon: {
    fontSize: 24,
    color: colors.accent,
    lineHeight: 28,
  },
  addText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
