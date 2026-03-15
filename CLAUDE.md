# MedDoc App

Aplicacion movil para documentacion medica con seguimiento fotografico de pacientes.

## Stack

- **Framework:** React Native (0.81.5) con Expo SDK 54
- **Navegacion:** React Navigation v7 (Bottom Tabs + Native Stack)
- **Estado global:** React Context (`DataProvider` + `AuthProvider`)
- **Base de datos:** SQLite via expo-sqlite (local, offline-first)
- **Autenticacion:** Local con hash SHA-256 + salt, sesion en expo-secure-store
- **Biometria:** expo-local-authentication (Face ID / huella)
- **Camara/Galeria:** expo-image-picker
- **PDF/Compartir:** expo-print + expo-sharing
- **IDs:** expo-crypto (UUID v4 + password hashing)
- **Haptics:** expo-haptics
- **Lenguaje:** JavaScript (JSX)
- **Tema:** Dark mode (palette Slate/Sky)

## Estructura del proyecto

```
meddoc-app/
├── App.js                            # Entry point — AuthProvider > DataProvider > RootNavigator
├── index.js                          # registerRootComponent (Expo)
├── app.json                          # Configuracion de Expo
├── package.json
├── assets/                           # Iconos y splash
└── src/
    ├── context/
    │   ├── AuthContext.js             # Autenticacion, sesion, biometria
    │   └── DataContext.js             # Estado global — lee/escribe SQLite via database/
    ├── database/
    │   ├── db.js                      # Conexion SQLite + migraciones automaticas
    │   ├── schema.js                  # Tablas y migraciones versionadas (v3)
    │   ├── users.js                   # CRUD de usuarios (registro, login, password)
    │   ├── patients.js                # CRUD de pacientes (SQL)
    │   ├── records.js                 # CRUD de registros (SQL)
    │   ├── images.js                  # CRUD de imagenes (SQL + filesystem)
    │   └── seed.js                    # Datos mock iniciales (solo si DB vacia)
    ├── navigation/
    │   └── RootNavigator.jsx          # Auth flow + Bottom Tabs + Stack
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.jsx        # Inicio de sesion
    │   │   ├── RegisterScreen.jsx     # Crear cuenta
    │   │   └── LockScreen.jsx         # Pantalla de bloqueo biometrico
    │   ├── DashboardScreen.jsx        # Estadisticas, categorias y actividad reciente
    │   ├── PatientsListScreen.jsx     # Lista con busqueda, ordenamiento, delete
    │   ├── PatientDetailScreen.jsx    # Perfil + registros + PDF + compartir
    │   ├── EditPatientScreen.jsx      # Crear/editar paciente (campos extendidos)
    │   ├── EditRecordScreen.jsx       # Crear/editar registro con fotos
    │   └── SettingsScreen.jsx         # Perfil, seguridad, datos, logout
    ├── components/
    │   ├── PatientCard.jsx            # Card de paciente con avatar + badge de registros
    │   ├── RecordCard.jsx             # Card de registro con dot de color + thumbnails de fotos
    │   ├── PrimaryButton.jsx          # Boton reutilizable (filled/outline/danger + loading)
    │   ├── ConfirmDialog.jsx          # Alert nativo con promesa (para eliminar)
    │   ├── Toast.jsx                  # Toast animado de feedback (success/error)
    │   ├── EmptyState.jsx             # Pantalla vacia con icono, titulo y accion
    │   ├── StatCard.jsx               # Card de estadistica numerica
    │   ├── ImageGrid.jsx              # Grid de fotos con add/remove/tap-to-view
    │   └── ImageViewer.jsx            # Visor fullscreen con swipe y paginacion
    ├── theme/
    │   ├── colors.js                  # Constantes de color centralizadas (25+ tokens)
    │   └── styles.js                  # Estilos compartidos (screen, card, input, etc.)
    ├── utils/
    │   ├── id.js                      # generateId() — UUID via expo-crypto
    │   ├── date.js                    # isValidDate(), todayString()
    │   ├── crypto.js                  # hashPassword(), generateSalt()
    │   ├── haptics.js                 # hapticSuccess/Error/Warning/Light
    │   ├── imageStorage.js            # saveImagePermanently(), deleteImageFile()
    │   └── pdfReport.js              # printPatientReport(), sharePatientReport()
    └── mock/
        └── patients.js                # Datos seed (se cargan solo la primera vez)
```

## Navegacion

```
Auth Flow (sin sesion)
├── Login
└── Register

Lock Flow (sesion + lock activado)
└── LockScreen (biometria)

Main Flow (sesion activa)
Bottom Tabs
├── Inicio (DashboardScreen)
│   └── Tap en actividad → Pacientes > PatientDetail
├── Pacientes (Stack)
│   ├── PatientsList
│   ├── PatientDetail (+ PDF + Compartir)
│   ├── EditPatient
│   └── EditRecord
└── Ajustes (SettingsScreen)
```

**Interacciones:**
- Tap en paciente → detalle
- Long-press en paciente → confirmar eliminacion
- Tap en registro → editar registro
- Long-press en registro → confirmar eliminacion

## Modelo de datos

### Paciente
| Campo       | Tipo   | Requerido |
|-------------|--------|-----------|
| id          | string | auto      |
| name        | string | si        |
| internalId  | string | si        |
| birthDate   | string | no        |
| gender      | string | no        |
| phone       | string | no        |
| bloodType   | string | no        |
| allergies   | string | no        |
| notes       | string | no        |
| createdAt   | string | auto      |

### Registro medico
| Campo       | Tipo     | Requerido |
|-------------|----------|-----------|
| id          | string   | auto      |
| patientId   | string   | si        |
| date        | string   | si        |
| category    | string   | no        |
| description | string   | si        |
| createdAt   | string   | auto      |

### Imagen
| Campo       | Tipo   | Requerido |
|-------------|--------|-----------|
| id          | string | auto      |
| recordId    | string | si (FK)   |
| uri         | string | si        |
| caption     | string | no        |
| position    | number | auto      |
| createdAt   | string | auto      |

## Base de datos (SQLite)

**Archivo:** `meddoc.db` (local en el dispositivo)

### Tablas

```sql
patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  internal_id TEXT NOT NULL,
  birth_date TEXT,
  gender TEXT,
  phone TEXT,
  blood_type TEXT,
  allergies TEXT,
  notes TEXT,
  created_at TEXT DEFAULT datetime('now')
)

records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  images TEXT DEFAULT '[]',   -- legacy, no se usa mas
  created_at TEXT DEFAULT datetime('now')
)

images (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  uri TEXT NOT NULL,           -- ruta en documentDirectory/meddoc-images/
  caption TEXT,
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT datetime('now')
)
```

**Indices:** `idx_records_patient`, `idx_records_date`, `idx_images_record`

**Migraciones:** Versionadas en `src/database/schema.js` (actualmente v2). Al arrancar, `db.js` compara `PRAGMA user_version` con las migraciones disponibles y ejecuta las pendientes.

**Almacenamiento de archivos:** Las fotos se copian desde el cache temporal de ImagePicker a `${documentDirectory}meddoc-images/` con un nombre UUID unico. La URI permanente se guarda en la tabla `images`. Al eliminar una imagen, se borra tanto el archivo como el registro en DB.

**Seed:** `seed.js` siembra datos mock solo si la tabla patients esta vacia (primera ejecucion).

**ON DELETE CASCADE:**
- Eliminar paciente → elimina sus records → elimina sus images (en DB)
- El DataContext tambien limpia los archivos del filesystem antes del delete

### Arquitectura de capas

```
Screens → useData() hook → DataContext → database/*.js → expo-sqlite
                                       → utils/imageStorage.js → expo-file-system
```

Las pantallas solo interactuan con `useData()`. El DataContext mantiene un cache en memoria (useState) y delega las escrituras a la capa `database/`. Esto permite lecturas instantaneas del state local y escrituras persistentes a SQLite.

## DataContext API

| Metodo | Descripcion |
|---|---|
| `patients` | Array de pacientes (cache en memoria) |
| `records` | Array de registros (cache en memoria) |
| `loading` | Boolean — true mientras inicializa SQLite |
| `addPatient(data)` | async — inserta en SQLite + actualiza cache |
| `updatePatient(id, data)` | async — actualiza en SQLite + cache |
| `deletePatient(id)` | async — elimina paciente + registros + imagenes (DB + archivos) |
| `getRecordsForPatient(id)` | Filtra del cache, ordenado por fecha desc |
| `addRecord(data)` | async — inserta en SQLite + actualiza cache |
| `updateRecord(id, data)` | async — actualiza en SQLite + cache |
| `deleteRecord(id)` | async — elimina registro + sus imagenes (DB + archivos) |
| `getImagesForRecord(id)` | async — imagenes de un registro desde DB |
| `getImagesForRecords(ids)` | async — batch, retorna Map<recordId, image[]> |
| `addImage(recordId, tempUri, caption, position)` | async — copia a storage permanente + inserta en DB |
| `removeImage(imageId)` | async — elimina archivo + registro en DB |
| `updateImageCaption(imageId, caption)` | async — actualiza caption |
| `resetAllData()` | async — vacia todas las tablas + elimina archivos de fotos |

## AuthContext API

| Metodo | Descripcion |
|---|---|
| `user` | Objeto del usuario logueado (null si no hay sesion) |
| `loading` | Boolean — true mientras restaura sesion de SecureStore |
| `locked` | Boolean — true si la app esta bloqueada (necesita biometria) |
| `register(data)` | async — crea usuario en SQLite + guarda sesion en SecureStore |
| `login(email, password)` | async — verifica credenciales + inicia sesion |
| `logout()` | async — elimina sesion de SecureStore |
| `updateProfile(data)` | async — actualiza nombre/especialidad |
| `changePassword(newPass)` | async — rehash con nuevo salt |
| `isLockAvailable()` | async — true si el dispositivo tiene biometria |
| `enableLock()` / `disableLock()` | async — activa/desactiva bloqueo |
| `unlock()` | async — lanza prompt biometrico nativo |
| `lockApp()` | Bloquea la app inmediatamente |

### Flujo de autenticacion

```
App abre → AuthProvider restaura sesion de SecureStore
  ├── No hay sesion → AuthNavigator (Login / Register)
  ├── Sesion + lock activado → LockScreen (biometria auto)
  └── Sesion sin lock → MainTabs
```

**Credenciales:** Email + password hasheado con SHA-256 + salt unico por usuario. Sesion almacenada en `expo-secure-store` (Keychain en iOS, Keystore en Android). Nunca se guarda password en texto plano.

## PDF y Compartir

`src/utils/pdfReport.js` genera reportes HTML que se convierten a PDF:

- **`printPatientReport(patient, records, imagesMap)`** — Abre el visor de impresion nativo con el PDF
- **`sharePatientReport(patient, records, imagesMap)`** — Genera PDF y abre el sheet de compartir (email, WhatsApp, AirDrop, etc.)

El reporte incluye: datos del paciente, badges medicos, notas, y todos los registros con sus fotos.

## Funcionalidades

### Dashboard
- 3 stat cards: total pacientes, total registros, registros esta semana
- Desglose por categoria con colores
- Feed de actividad reciente (ultimos 10 registros)
- Tap en actividad navega al detalle del paciente

### Lista de pacientes
- Busqueda por nombre o ID interno
- Ordenamiento: A-Z, recientes, por cantidad de registros
- Card con avatar (inicial), info y badge de conteo
- Long-press para eliminar con confirmacion
- Empty state con CTA para crear primer paciente

### Detalle de paciente
- Header con avatar grande, nombre, genero, edad calculada
- Badges medicos: tipo de sangre, alergias (con warning visual)
- Notas del paciente
- Boton "Llamar" si tiene telefono (abre dialer nativo)
- Lista de registros ordenados por fecha
- Long-press en registro para eliminar

### Formulario de paciente
- Campos: nombre*, ID interno*, genero (chips M/F/Otro), fecha nacimiento, telefono, tipo de sangre (chips), alergias, notas
- Validaciones: nombre e ID requeridos, ID duplicado, fecha YYYY-MM-DD valida (no futura, no >150 años), telefono formato basico, notas max 500 chars
- Errores inline en rojo debajo del campo con borde resaltado
- Focus encadenado: returnKey "next" entre campos, refs para auto-focus
- KeyboardAvoidingView + keyboardDismissMode="on-drag" + keyboardShouldPersistTaps="handled"
- Haptics: error en validacion, success al guardar, light al seleccionar chip

### Formulario de registro
- Campos: fecha* (default hoy), categoria (chips), descripcion* (max 1000), fotos (max 6)
- Validaciones: fecha requerida y valida (no futura), descripcion requerida
- Fotos: grid con agregar desde camara/galeria (ActionSheet nativo iOS), long-press para eliminar con confirmacion, tap para ver fullscreen
- Loading state mientras carga imagenes existentes al editar
- Mismos patrones de UX que formulario de paciente

### Ajustes
- Info de la app (version, conteos de pacientes/registros/fotos, tipo almacenamiento)
- Exportar resumen a consola
- Borrar todos los datos (con confirmacion destructiva + limpieza de archivos)

## Accesibilidad

- Todos los elementos interactivos tienen `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`
- Chips de seleccion usan `accessibilityRole="radio"` + `accessibilityState={{ checked }}`
- Botones reportan `accessibilityState={{ disabled, busy }}` durante carga
- Avatares y elementos decorativos usan `accessibilityElementsHidden`
- Badges de alergias usan `accessibilityRole="alert"`
- Colores pasan WCAG AA: `textMuted` subido a `#94a3b8` (6:1), `danger` a `#f87171` (5.5:1)
- Touch targets minimos: chips 44px min-height, botones 48px min-height, thumbs 48x48px
- Busqueda tiene boton de limpiar (✕) con hitSlop

## Feedback tactil (Haptics)

Se usa `expo-haptics` via `src/utils/haptics.js`:
- `hapticSuccess()` — al guardar exitosamente
- `hapticError()` — al fallar validacion
- `hapticWarning()` — antes de confirmar eliminacion
- `hapticLight()` — al seleccionar chip o agregar foto

## Comandos

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
```

## Convenciones

- Archivos de componentes/screens: PascalCase con extension `.jsx`
- Context/utils/theme: camelCase con extension `.js`
- Estilos: Compartidos desde `src/theme/styles.js`, especificos con `StyleSheet.create()` local
- Colores: Siempre importar desde `src/theme/colors.js`, nunca hardcodear hex
- Componentes: Reutilizar `PrimaryButton` (variant: filled/outline/danger), `PatientCard`, `RecordCard`, `EmptyState`, `StatCard`, `ImageGrid`
- Eliminacion: Siempre pedir confirmacion via `confirmDialog()`
- Feedback: Usar `Toast` despues de acciones + `haptics.js` para feedback tactil
- Accesibilidad: Siempre incluir accessibilityRole/Label/Hint en elementos interactivos
- Touch targets: Minimo 44px para chips, 48px para botones
- Busqueda: Normalizar acentos con `.normalize('NFD')` para busqueda tolerante
- Idioma de UI: Español

## Categorias de registro

| Categoria         | Color   |
|-------------------|---------|
| Consulta inicial  | #38bdf8 (azul)    |
| Seguimiento       | #22c55e (verde)   |
| Procedimiento     | #f59e0b (amarillo)|
| Urgencia          | #ef4444 (rojo)    |
| Control           | #8b5cf6 (morado)  |
