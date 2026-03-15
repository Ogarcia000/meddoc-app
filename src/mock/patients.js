export const MOCK_PATIENTS = [
  {
    id: '1',
    name: 'Juan Perez',
    internalId: 'P-001',
    birthDate: '1990-05-10',
    gender: 'M',
    phone: '+52 55 1234 5678',
    bloodType: 'O+',
    allergies: 'Penicilina',
    notes: 'Paciente de prueba con seguimiento fotografico.',
  },
  {
    id: '2',
    name: 'Maria Lopez',
    internalId: 'P-002',
    birthDate: '1985-11-23',
    gender: 'F',
    phone: '+52 55 8765 4321',
    bloodType: 'A+',
    allergies: '',
    notes: 'Ejemplo para pruebas de UI.',
  },
];

export const MOCK_RECORDS = [
  {
    id: 'r1',
    patientId: '1',
    date: '2026-02-01',
    category: 'Consulta inicial',
    description: 'Evaluacion general y toma de primeras fotos.',
    images: [],
  },
  {
    id: 'r2',
    patientId: '1',
    date: '2026-02-10',
    category: 'Seguimiento',
    description: 'Revision de progreso y actualizacion de notas.',
    images: [],
  },
  {
    id: 'r3',
    patientId: '2',
    date: '2026-01-15',
    category: 'Procedimiento',
    description: 'Registro fotografico del procedimiento realizado.',
    images: [],
  },
];
