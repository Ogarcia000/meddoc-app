import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { seedIfEmpty } from '../database/seed';
import * as PatientsDB from '../database/patients';
import * as RecordsDB from '../database/records';
import * as ImagesDB from '../database/images';

const DataContext = createContext(null);

/**
 * DataProvider con caché inteligente basado en señales de invalidación.
 *
 * En vez de mantener TODOS los datos en memoria:
 * - `patients` es un caché ligero solo para el Dashboard (últimos datos cargados)
 * - `records` es un caché ligero solo para el Dashboard
 * - Las pantallas de lista (PatientsListScreen, PatientDetailScreen) paginan
 *   directo de SQLite y se recargan al detectar cambios via `invalidationKey`
 * - Cada mutación incrementa el key relevante, las pantallas con useFocusEffect recargan
 */
export function DataProvider({ children }) {
  // Caché ligero para Dashboard (no necesita paginación)
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Señales de invalidación — cada cambio incrementa el counter
  const [patientsVersion, setPatientsVersion] = useState(0);
  const [recordsVersion, setRecordsVersion] = useState(0);

  // Inicializar
  useEffect(() => {
    (async () => {
      try {
        await seedIfEmpty();
        await refreshDashboardCache();
      } catch (e) {
        console.error('Error inicializando DB:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Recargar caché del Dashboard cuando algo cambia
  const refreshDashboardCache = useCallback(async () => {
    const [p, r] = await Promise.all([
      PatientsDB.getAllPatients(),
      RecordsDB.getAllRecords(),
    ]);
    setPatients(p);
    setRecords(r);
  }, []);

  // Señales — las pantallas paginadas escuchan estos valores
  const invalidatePatients = useCallback(() => {
    setPatientsVersion((v) => v + 1);
  }, []);

  const invalidateRecords = useCallback(() => {
    setRecordsVersion((v) => v + 1);
  }, []);

  // --- Pacientes ---

  const addPatient = useCallback(async (data) => {
    const newPatient = await PatientsDB.insertPatient(data);
    // Actualizar caché del dashboard sin recargar todo
    setPatients((prev) => [newPatient, ...prev]);
    invalidatePatients();
    return newPatient;
  }, [invalidatePatients]);

  const updatePatient = useCallback(async (id, data) => {
    await PatientsDB.updatePatientById(id, data);
    // Actualizar solo el paciente afectado en caché
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    invalidatePatients();
  }, [invalidatePatients]);

  const deletePatient = useCallback(async (id) => {
    const recs = await RecordsDB.getRecordsByPatientId(id);
    for (const rec of recs) {
      await ImagesDB.deleteImagesByRecordId(rec.id);
    }
    await PatientsDB.deletePatientById(id);
    // Remover solo lo eliminado del caché
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setRecords((prev) => prev.filter((r) => r.patientId !== id));
    invalidatePatients();
    invalidateRecords();
  }, [invalidatePatients, invalidateRecords]);

  // --- Registros ---

  const getRecordsForPatient = useCallback(
    (patientId) =>
      records
        .filter((r) => r.patientId === patientId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );

  const addRecord = useCallback(async (data) => {
    const newRecord = await RecordsDB.insertRecord(data);
    setRecords((prev) => [newRecord, ...prev]);
    invalidateRecords();
    return newRecord;
  }, [invalidateRecords]);

  const updateRecord = useCallback(async (id, data) => {
    await RecordsDB.updateRecordById(id, data);
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
    invalidateRecords();
  }, [invalidateRecords]);

  const deleteRecord = useCallback(async (id) => {
    await ImagesDB.deleteImagesByRecordId(id);
    await RecordsDB.deleteRecordById(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    invalidateRecords();
  }, [invalidateRecords]);

  // --- Imagenes ---

  const getImagesForRecord = useCallback(async (recordId) => {
    return ImagesDB.getImagesByRecordId(recordId);
  }, []);

  const getImagesForRecords = useCallback(async (recordIds) => {
    return ImagesDB.getImagesByRecordIds(recordIds);
  }, []);

  const addImage = useCallback(async (recordId, tempUri, caption = '', position = 0) => {
    return ImagesDB.insertImage(recordId, tempUri, caption, position);
  }, []);

  const removeImage = useCallback(async (imageId) => {
    await ImagesDB.deleteImageById(imageId);
  }, []);

  const updateImageCaption = useCallback(async (imageId, caption) => {
    await ImagesDB.updateImageCaption(imageId, caption);
  }, []);

  // --- Reset ---

  const resetAllData = useCallback(async () => {
    const { getDatabase } = require('../database/db');
    const db = await getDatabase();
    const imgRows = await db.getAllAsync('SELECT uri FROM images;');
    const { deleteImageFiles } = require('../utils/imageStorage');
    await deleteImageFiles(imgRows.map((r) => r.uri));
    await db.execAsync('DELETE FROM images;');
    await db.execAsync('DELETE FROM records;');
    await db.execAsync('DELETE FROM patients;');
    setPatients([]);
    setRecords([]);
    invalidatePatients();
    invalidateRecords();
  }, [invalidatePatients, invalidateRecords]);

  return (
    <DataContext.Provider
      value={{
        // Caché ligero (Dashboard)
        patients,
        records,
        loading,
        // Señales de invalidación (pantallas paginadas escuchan esto)
        patientsVersion,
        recordsVersion,
        // Mutaciones
        addPatient,
        updatePatient,
        deletePatient,
        getRecordsForPatient,
        addRecord,
        updateRecord,
        deleteRecord,
        getImagesForRecord,
        getImagesForRecords,
        addImage,
        removeImage,
        updateImageCaption,
        resetAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>');
  return ctx;
}
