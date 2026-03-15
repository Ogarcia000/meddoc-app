import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPatientsPaginated } from '../database/patients';
import { useData } from '../context/DataContext';
import PatientCard from '../components/PatientCard';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { confirmDialog } from '../components/ConfirmDialog';
import { colors } from '../theme/colors';
import { shared } from '../theme/styles';
import { hapticWarning, hapticSuccess } from '../utils/haptics';

const PAGE_SIZE = 50;

const SORT_OPTIONS = [
  { key: 'name', label: 'A-Z' },
  { key: 'recent', label: 'Recientes' },
  { key: 'records', label: 'Registros' },
];

export default function PatientsListScreen({ navigation }) {
  const { deletePatient, patientsVersion } = useData();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const debounceRef = useRef(null);

  // Cargar primera pagina
  const loadFirstPage = useCallback(async (q = query, sort = sortBy) => {
    setLoading(true);
    try {
      const result = await getPatientsPaginated({
        query: q.trim(),
        sortBy: sort,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setData(result.data);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (e) {
      console.error('Error cargando pacientes:', e);
    } finally {
      setLoading(false);
    }
  }, [query, sortBy]);

  // Cargar siguiente pagina
  const loadNextPage = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getPatientsPaginated({
        query: query.trim(),
        sortBy,
        limit: PAGE_SIZE,
        offset: data.length,
      });
      setData((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
    } catch (e) {
      console.error('Error cargando mas pacientes:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, query, sortBy, data.length]);

  // Recargar cuando la pantalla recibe focus O cuando patientsVersion cambia
  useFocusEffect(
    useCallback(() => {
      loadFirstPage();
    }, [sortBy, patientsVersion])
  );

  // Debounce en busqueda
  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadFirstPage(text, sortBy);
    }, 300);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    loadFirstPage(query, sort);
  };

  const handleDelete = useCallback(
    async (patient) => {
      hapticWarning();
      const confirmed = await confirmDialog({
        title: 'Eliminar paciente',
        message: `Se eliminara a "${patient.name}" y todos sus registros. Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        destructive: true,
      });
      if (confirmed) {
        await deletePatient(patient.id);
        hapticSuccess();
        setData((prev) => prev.filter((p) => p.id !== patient.id));
        setTotal((prev) => prev - 1);
        setToast({ visible: true, message: 'Paciente eliminado', type: 'success' });
      }
    },
    [deletePatient]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <PatientCard
        patient={item}
        onPress={() =>
          navigation.navigate('PatientDetail', {
            patientId: item.id,
            patientName: item.name,
          })
        }
        onLongPress={() => handleDelete(item)}
      />
    ),
    [navigation, handleDelete]
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.footerText}>Cargando mas...</Text>
      </View>
    );
  };

  return (
    <View style={shared.screen}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o ID..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleQueryChange}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Buscar pacientes"
          accessibilityHint="Busca por nombre o ID interno"
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => { setQuery(''); loadFirstPage('', sortBy); }}
            accessibilityLabel="Limpiar busqueda"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort */}
      <View style={styles.sortRow} accessibilityRole="radiogroup" accessibilityLabel="Ordenar pacientes">
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
            onPress={() => handleSortChange(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: sortBy === opt.key }}
            accessibilityLabel={`Ordenar por ${opt.label}`}
          >
            <Text
              style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.countText}>{total} pacientes</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            data.length === 0 ? styles.emptyList : { paddingBottom: 80 }
          }
          keyboardDismissMode="on-drag"
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <EmptyState
              icon="person-outline"
              title={query ? 'Sin resultados' : 'Sin pacientes'}
              subtitle={
                query
                  ? `No se encontraron pacientes para "${query}"`
                  : 'Agrega tu primer paciente para comenzar'
              }
              actionLabel={query ? undefined : '+ Nuevo paciente'}
              onAction={
                query
                  ? undefined
                  : () => navigation.navigate('EditPatient', { mode: 'create' })
              }
            />
          }
        />
      )}

      <View style={styles.fab}>
        <PrimaryButton
          title="+ Nuevo paciente"
          onPress={() => navigation.navigate('EditPatient', { mode: 'create' })}
          accessibilityLabel="Agregar nuevo paciente"
        />
      </View>

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  searchInput: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 40,
    color: colors.text,
    backgroundColor: colors.bgCard,
    fontSize: 14,
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 28,
    alignItems: 'center',
  },
  clearText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  sortChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  sortChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sortChipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  countText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});
