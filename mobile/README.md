# Secretary App - Mobile Companion 📱🩺

Aplicación móvil complementaria para profesionales médicos de **Secretary App**, construida con **React Native**, **Expo SDK 57** y **TypeScript**.

Permite a los profesionales consultar su agenda médica diaria, gestionar estados de turnos, y acceder a la ficha clínica del paciente (medicaciones, prescripciones con vademécum, consultas anteriores y archivos médicos).

---

## 🛠️ Stack Tecnológico

- **Framework:** React Native `0.86.3` + Expo SDK `57`
- **Ruteo:** Expo Router `57.0.24` (File-based Routing con Thin Routes)
- **Lenguaje:** TypeScript (`strict` mode)
- **Persistencia Local:** `@react-native-async-storage/async-storage`
- **Gestión de Sesión:** Context API (`AuthContext`) con tokens JWT
- **Comunicación con Backend:** Cliente HTTP tipado con inyección de headers (`Authorization`, `x-doctor-id`)

---

## 📂 Arquitectura del Proyecto (`src/`)

El proyecto sigue una arquitectura guiada por dominio (**Feature-Driven / Screaming Architecture**) con rutas delgadas (*Thin Routes*):

```text
mobile/src/
├── app/                          # SOLO ruteo delgado (Expo Router)
│   ├── _layout.tsx               # Root Layout con AuthProvider y StatusBar
│   ├── index.tsx                 # Redirección según estado de autenticación
│   ├── (auth)/
│   │   ├── _layout.tsx           # Stack de autenticación (guardia inversa)
│   │   └── login.tsx             # Wrapper de <LoginForm />
│   └── (app)/
│       ├── _layout.tsx           # Stack protegido (requiere sesión activa)
│       ├── index.tsx             # Redirección a /appointments
│       ├── appointments.tsx      # Agenda diaria (<AppointmentsView />)
│       └── patient/
│           └── [id].tsx          # Ficha del paciente (<PatientDetailView />)
│
├── features/                     # Módulos de dominio aislados
│   ├── auth/
│   │   └── components/LoginForm.tsx
│   ├── appointments/
│   │   ├── AppointmentsView.tsx
│   │   ├── components/           # WeeklyCalendarBar, AppointmentCard, AppointmentsHeader
│   │   └── hooks/useDailyAppointments.ts
│   └── patients/
│       ├── PatientDetailView.tsx
│       ├── components/           # PatientHeader, MedicationsTab, VisitsTab, FilesTab, Modales
│       └── hooks/usePatientDetail.ts
│
├── shared/                       # Infraestructura y utilidades compartidas
│   ├── context/AuthContext.tsx   # Proveedor global de autenticación
│   ├── services/api.ts           # Cliente HTTP tipado
│   └── theme/colors.ts           # Paleta de diseño y tokens visuales
│
└── types/                        # Definiciones TypeScript de dominio
    ├── auth.ts                   # User, LoginCredentials, AuthResponse
    ├── appointments.ts           # Appointment, AppointmentStats
    └── patients.ts               # Patient, Prescription, MedicalFile, VademecumItem
```

---

## 🚀 Puesta en Marcha

### Prerrequisitos
1. **Node.js** `20+` o `22+`.
2. Servidor backend de **Secretary App** corriendo (por defecto en `http://localhost:5000` o IP de red local).

### 1. Instalación de dependencias
```bash
cd mobile
npm install --legacy-peer-deps
```

### 2. Ejecutar la aplicación

- **En navegador web (la opción más rápida para desarrollo):**
  ```bash
  npm run web
  ```
  Abre la aplicación en `http://localhost:8081`.

- **En teléfono físico (con Expo Go):**
  1. Instalar la app **Expo Go** desde Google Play o App Store.
  2. Conectar la compu y el celular a la **misma red Wi-Fi**.
  3. Ejecutar:
     ```bash
     npm run dev
     # o
     npm start
     ```
  4. Escanear el código QR impreso en la terminal desde la app Expo Go.

- **En emulador Android:**
  ```bash
  npm run android
  ```

---

## ⚙️ Conectividad con el Backend

El cliente de API en [`src/shared/services/api.ts`](src/shared/services/api.ts) resuelve automáticamente el host:
1. Detecta la IP del host donde corre Metro (`Constants.expoConfig?.hostUri`).
2. Utiliza fallback a la IP local configurada en el archivo.
3. Se comunica con el backend a través del puerto `5000` (`/api`).

---

## 🔍 Comprobación de Tipos y Calidad

Para validar que todo el código TypeScript compile sin errores:

```bash
npx tsc --noEmit
```
