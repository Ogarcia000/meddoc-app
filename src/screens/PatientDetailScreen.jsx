import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRecordsPaginated } from '../database/records';
import { useData } from '../context/DataContext';
import RecordCard from '../components/RecordCard';
import PrimaryButton from '../components/PrimaryButton';
import ImageViewer from '../components/ImageViewer';
import Toast from '../components/Toast';
import { confirmDialog } from '../components/ConfirmDialog';
import { colors } from '../theme/colors';
import { shared } from '../theme/styles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { hapticWarning, hapticSuccess } from '../utils/haptics';
import { printPatientReport, sharePatientReport } from '../utils/pdfReport';

const PAGE_SIZE = 50;

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) {
    age--;
  }
  return age >= 0 ? age : null;
}

export default function PatientDetailScreen({ route, navigation }) {
  const { patientId, patientName } = route.params || {};
  const { patients, deleteRecord, getImagesForRecords, recordsVersion } = useData();

  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [imagesMap, setImagesMap] = useState(new Map());
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);

  const patient = useMemo(
    () => patients.find((p) => p.id === patientId),
    [patients, patientId]
  );

  const age = patient?.birthDate ? calculateAge(patient.birthDate) : null;

  // Cargar primera pagina de registros
  const loadFirstPage = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const result = await getRecordsPaginated({
        patientId,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setRecords(result.data);
      setTotalRecords(result.total);
      setHasMore(result.hasMore);

      // Cargar imagenes del primer lote
      if (result.data.length > 0) {
        const ids = result.data.map((r) => r.id);
        const imgs = await getImagesForRecords(ids);
        setImagesMap(imgs);
      } else {
        setImagesMap(new Map());
      }
    } catch (e) {
      console.error('Error cargando registros:', e);
    } finally {
      setLoadingRecords(false);
    }
  }, [patientId, getImagesForRecords]);

  // Cargar siguiente pagina
  const loadNextPage = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getRecordsPaginated({
        patientId,
        limit: PAGE_SIZE,
        offset: records.length,
      });
      setRecords((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);

      // Cargar imagenes del nuevo lote
      if (result.data.length > 0) {
        const ids = result.data.map((r) => r.id);
        const newImgs = await getImagesForRecords(ids);
        setImagesMap((prev) => {
          const merged = new Map(prev);
          newImgs.forEach((val, key) => merged.set(key, val));
          return merged;
        });
      }
    } catch (e) {
      console.error('Error cargando mas registros:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, patientId, records.length, getImagesForRecords]);

  // Recargar cuando recibe focus O cuando recordsVersion cambia
  useFocusEffect(
    useCallback(() => {
      loadFirstPage();
    }, [recordsVersion])
  );

  const totalImages = useMemo(() => {
    let count = 0;
    imagesMap.forEach((imgs) => { count += imgs.length; });
    return count;
  }, [imagesMap]);

  const handleDeleteRecord = useCallback(
    async (record) => {
      hapticWarning();
      const confirmed = await confirmDialog({
        title: 'Eliminar registro',
        message: `Se eliminara el registro del ${record.date} y todas sus fotos. Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar',
        destructive: true,
      });
      if (confirmed) {
        try {
          await deleteRecord(record.id);
          setRecords((prev) => prev.filter((r) => r.id !== record.id));
          setTotalRecords((prev) => prev - 1);
          setImagesMap((prev) => {
            const next = new Map(prev);
            next.delete(record.id);
            return next;
          });
          hapticSuccess();
          setToast({ visible: true, message: 'Registro eliminado', type: 'success' });
        } catch {
          setToast({ visible: true, message: 'Error al eliminar', type: 'error' });
        }
      }
    },
    [deleteRecord]
  );

  const handleCall = () => {
    if (!patient?.phone) return;
    const url = `tel:${patient.phone.replace(/\s/g, '')}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Alert.alert('Error', 'No se puede realizar la llamada');
    });
  };

  const openGallery = useCallback((recordImages, index) => {
    setViewerImages(recordImages);
    setViewerIndex(index);
    setViewerVisible(true);
  }, []);

  const renderRecord = useCallback(
    ({ item }) => {
      const recordImages = imagesMap.get(item.id) || [];
      return (
        <RecordCard
          record={item}
          images={recordImages}
          onPress={() =>
            navigation.navigate('EditRecord', { mode: 'edit', record: item })
          }
          onDelete={() => handleDeleteRecord(item)}
          onImageTap={(index) => openGallery(recordImages, index)}
        />
      );
    },
    [navigation, handleDeleteRecord, imagesMap, openGallery]
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

  const ListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header} accessibilityRole="header">
        <View style={styles.avatar} accessibilityElementsHidden>
          <Text style={styles.avatarText}>
            {(patient?.name || patientName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} accessibilityRole="header">
            {patient?.name || patientName}
          </Text>
          <Text style={styles.meta}>
            ID: {patient?.internalId || '—'}
            {patient?.gender ? `  •  ${patient.gender}` : ''}
            {age !== null ? `  •  ${age} años` : ''}
          </Text>
          {patient?.phone ? (
            <Text style={styles.meta} accessibilityLabel={`Telefono: ${patient.phone}`}>
              {patient.phone}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Medical badges */}
      {(patient?.bloodType || patient?.allergies) ? (
        <View style={styles.medicalRow}>
          {patient.bloodType ? (
            <View style={styles.medicalBadge} accessibilityLabel={`Tipo de sangre: ${patient.bloodType}`}>
              <Ionicons name="water" size={12} color={colors.danger} style={{ marginRight: 4 }} />
              <Text style={styles.medicalText}>{patient.bloodType}</Text>
            </View>
          ) : null}
          {patient.allergies ? (
            <View
              style={[styles.medicalBadge, styles.allergyBadge]}
              accessibilityLabel={`Alergias: ${patient.allergies}`}
              accessibilityRole="alert"
            >
              <Ionicons name="warning" size={12} color={colors.warningText} style={{ marginRight: 4 }} />
              <Text style={[styles.medicalText, styles.allergyText]}>
                {patient.allergies}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {patient?.notes ? (
        <Text style={styles.notes} accessibilityLabel={`Notas: ${patient.notes}`}>
          {patient.notes}
        </Text>
      ) : null}

      {/* Actions */}
      <View style={styles.actionRow}>
        <PrimaryButton
          title="Editar"
          variant="outline"
          onPress={() => navigation.navigate('EditPatient', { mode: 'edit', patient })}
          style={{ flex: 1, marginRight: 8 }}
          accessibilityLabel="Editar datos del paciente"
        />
        {patient?.phone ? (
          <PrimaryButton
            title="Llamar"
            variant="outline"
            onPress={handleCall}
            style={{ flex: 1 }}
            accessibilityLabel={`Llamar a ${patient.name}`}
          />
        ) : null}
      </View>

      {/* PDF / Compartir */}
      <View style={styles.actionRow}>
        <PrimaryButton
          title="PDF"
          variant="outline"
          onPress={() => printPatientReport(patient, records, imagesMap)}
          style={{ flex: 1, marginRight: 8 }}
          accessibilityLabel="Generar reporte PDF"
        />
        <PrimaryButton
          title="Compartir"
          variant="outline"
          onPress={() => sharePatientReport(patient, records, imagesMap)}
          style={{ flex: 1 }}
          accessibilityLabel="Compartir reporte del paciente"
        />
      </View>

      <Text style={shared.sectionTitle}>
        Registros ({totalRecords}){totalImages > 0 ? ` • ${totalImages} fotos` : ''}
      </Text>

      {loadingRecords && (
        <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 12 }} />
      )}
    </>
  );

  return (
    <View style={shared.screen}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.3}
        contentContainerStyle={
          records.length === 0 && !loadingRecords ? { flexGrow: 1 } : { paddingBottom: 80 }
        }
        ListEmptyComponent={
          !loadingRecords ? (
            <Text style={shared.emptyText}>
              Este paciente aun no tiene registros.
            </Text>
          ) : null
        }
      />

      <View style={styles.fab}>
        <PrimaryButton
          title="+ Nuevo registro"
          onPress={() =>
            navigation.navigate('EditRecord', { mode: 'create', patientId })
          }
          accessibilityLabel="Agregar nuevo registro medico"
        />
      </View>

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <ImageViewer
        images={viewerImages}
        initialIndex={viewerIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.accent,
  },
  headerInfo: { flex: 1 },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  medicalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  medicalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  allergyBadge: {
    borderColor: colors.warning,
    backgroundColor: colors.warningBg,
  },
  medicalText: { fontSize: 12, color: colors.text, fontWeight: '500' },
  allergyText: { color: colors.warningText },
  notes: {
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: colors.bgCard,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 12,
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
