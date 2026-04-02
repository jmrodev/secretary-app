# Arquitectura del Proyecto - Secretary App

## Principios Fundamentales

### 1. DRY (Don't Repeat Yourself)
- **No repetir código**: Extraer lógica común en funciones/componentes reutilizables.
- **Centralizar flujos de lógica**: En los hooks de lógica (`useLogic.js`), si múltiples acciones (como `login` y `register`) comparten el mismo proceso final de actualización de estado y almacenamiento, usar un manejador interno genérico (ej: `handleAuthResponse`).
- **Centralizar configuraciones**: Variables, constantes y configuraciones en un solo lugar.
- **Reutilizar componentes**: Crear componentes genéricos y parametrizables.

### 2. BEM CSS (Block Element Modifier)
- **Nomenclatura estricta**: `block__element--modifier`
- **Ejemplos**:
  ```css
  .appointment-report { }                    /* Block */
  .appointment-report__table { }             /* Element */
  .appointment-report__row--weekend { }      /* Modifier */
  ```
- **NO usar**: camelCase, PascalCase, o nombres genéricos en CSS

### 3. Atomic Design
- **Estructura de componentes**:
  ```
  atoms/       → Componentes básicos (Button, Input, Badge, Icon)
  molecules/   → Combinación de átomos (SearchBar, FormField)
  organisms/   → Secciones complejas (Header, ReportTable)
  templates/   → Layouts de página
  pages/       → Páginas completas
  ```
- **Uso Obligatorio de Átomos**: Todos los botones deben usar el componente `<Button />` y todos los iconos deben usar el componente `<Icon />`. PROHIBIDO usar emojis o elementos nativos (como `<button>` o `<span>` con clases de iconos) directamente para estos propósitos.

### 4. Modularidad por Características (Features)
- **Encapsulamiento**: Agrupar lógica, servicios, estilos y componentes específicos de un dominio en una carpeta dentro de `src/features/`.
- **Estructura Estándar** (Ej: `src/features/appointments/`):
  ```
  components/  → Componentes específicos (solo usados en esta feature)
  hooks/       → Lógica de estado y side-effects (model/controller local)
  index.js     → Barrel file que exporta el orquestador y hooks clave
  FeaturePage.jsx → Page principal (Orquestador)
  FeaturePage.css → Estilos globales de la página
  ```
- **Barrel Files**: Cada característica debe tener un `index.js` para exponer solo lo necesario al resto de la aplicación.
- **Independencia**: Las características deben ser lo más autónomas posible. Los componentes generales (Atoms/Molecules/Organisms) se reservan para piezas reutilizables entre múltiples features.
- **Separación de Lógica en React Hooks**: Para evitar componentes "cargados", la lógica de estado y efectos debe extraerse a hooks especializados dentro de la feature (ej: `useAppointmentsLogic.js`).

### 5. NO Tailwind CSS
- **Solo CSS vanilla/puro**
- **Cada componente tiene su propio archivo CSS**
- **Variables CSS para temas**: Usar `var(--color-primary)` en lugar de valores hardcoded
- **Mantenimiento**: Revisar periódicamente `index.css` y extraer estilos específicos a sus respectivos componentes para evitar colisiones y mantener la modularidad.
- **CSS Compartido**: Si un estilo o clase CSS se utiliza en más de una página, componente o átomo, DEBE estar en `index.css` (o en un archivo de utilidades global importado allí) para evitar duplicación, marcándolo claramente como compartido.
- **Unidades Relativas**: Priorizar el uso de unidades relativas (`rem`, `em`, `%`) para `font-size`, `padding`, `margin`, `width`, `height` en lugar de píxeles (`px`) absolutos. Esto garantiza que el diseño sea adaptable y accesible (1rem = 16px por defecto).
- **PROHIBIDO usar `!important`**: Nunca utilizar `!important` para sobrescribir estilos. Si hay conflictos, mejorar la especificidad del selector o reestructurar el CSS.

### 6. MVC (Model-View-Controller)
- **Frontend**:
  ```
  components/  → View (presentación siguiendo Atomic Design)
  controllers/ → Controller (hooks de lógica de UI genérica)
  features/    → Módulos por característica (agrupan logic, services y context de un dominio)
  hooks/       → Model (estado y hooks de datos compartidos)
  ```
- **Backend**:
  ```
  routes/      → Rutas HTTP
  controllers/ → Lógica de negocio
  services/    → Servicios especializados
  models/      → Acceso a datos (queries)
  ```

### 7. Un Componente = Un CSS
- **Regla estricta**: Cada archivo `.jsx` tiene su correspondiente `.css`
- **Ejemplo**:
  ```
  AppointmentReportTable.jsx
  AppointmentReportTable.css
  ```
- **NO usar**: CSS inline, styled-components, o CSS-in-JS

### 8. Optimización con Memoización (`useMemo` / `useCallback`)
- **Uso Justificado**: NO memorizar todo por defecto. Usar solo cuando:
    - Hay cálculos costosos (ej: filtrado de grandes volúmenes de datos, transformaciones complejas).
    - Se requiere **igualdad referencial** para evitar re-renders innecesarios en componentes hijos envueltos en `React.memo`.
    - Se pasan objetos, arrays o funciones como dependencias a otros hooks (`useEffect`, `useMemo`, `useCallback`).
- **Contextos**: Los valores de los Context Providers DEBEN estar memorizados con `useMemo` para evitar renderizados en toda la aplicación cuando el estado global cambia.
- **Dependencias**: Siempre incluir todas las dependencias utilizadas dentro del hook. NUNCA omitir dependencias para "forzar" que no se actualice.

### 9. Gestión de Errores y Feedback de Interacción
- **Aislamiento de Estado**: Los errores de formularios deben ser **locales** al controlador de cada característica (Feature Controller) para garantizar la independencia total. Lo que sucede en un formulario no debe afectar a otros (ej: el Usuario B no debe borrar el error del Usuario A).
- **Limpieza por Interacción**: Los mensajes de error en formularios DEBEN limpiarse tan pronto como el usuario empiece a interactuar con los campos (evento `onChange`, escritura de teclado). Esto indica al usuario que el sistema está esperando su nueva entrada antes de volver a validar.
- **Toasts vs Errores Locales**:
    - **Toasts (Contexto Global)**: Reservados para mensajes asíncronos persistentes, notificaciones de sistema o confirmaciones transversales (ej: "Conexión perdida", "Cita creada con éxito").
    - **Errores Locales (Controladores)**: Para validaciones de entrada de datos y respuestas de error específicas de un formulario.

### 10. Orquestadores vs Ejecutores
- **Componentes Orquestadores**: Son componentes de alto nivel (`App.jsx`, `Dashboard.jsx`, Routers, Layouts) que NO implementan lógica de negocio ni UI compleja. Su único propósito es **coordinar** otros componentes y hooks (ej: definir la estructura de rutas o envolver el contenido en una rejilla).
- **Componentes Ejecutores**: Son los que "hacen el trabajo". Aquí se incluyen:
    - **Atoms/Molecules/Organisms**: Los que renderizan la UI siguiendo BEM.
    - **Logic Hooks (`useXXXLogic`)**: Los que ejecutan la lógica, llamadas a API y cambios de estado.
- **Regla de Oro**: Si un orquestador empieza a tener lógica de `useEffect`, cálculos de datos o estados locales complejos, debe ser refactorizado extrayendo esa ejecución a un hook o componente especializado.



## Estructura del Proyecto

```
secretary-app/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── atoms/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Button.css
│   │   │   │   ├── TabButton.jsx
│   │   │   │   └── TabButton.css
│   │   │   ├── molecules/
│   │   │   ├── organisms/
│   │   │   │   ├── AppointmentReportTable.jsx
│   │   │   │   ├── AppointmentReportTable.css
│   │   │   │   ├── PrescriptionReportTable.jsx
│   │   │   │   ├── PrescriptionReportTable.css
│   │   │   │   ├── LicenseReportTable.jsx
│   │   │   │   ├── CertificateReportTable.jsx
│   │   │   │   └── MedicalReportTable.css (compartido)
│   │   │   └── pages/
│   │   │       ├── Reports.jsx
│   │   │       └── Reports.css
│   │   ├── controllers/
│   │   ├── features/
│   │   │   ├── auth/           → Autenticación y sesión
│   │   │   ├── appointments/   → Gestión de agenda y turnos
│   │   │   ├── finances/       → Gestión de caja y reportes financieros (migrado)
│   │   │   ├── institutions/   → Gestión de instituciones (migrado)
│   │   │   ├── insurances/     → Gestión de convenios y obras sociales (migrado)
│   │   │   └── patients/       → Gestión integral de pacientes (migrado)
│   │   │       ├── hooks/       → usePatientsPageController, usePatientFormController
│   │   │       ├── index.js     → API Pública de la feature
│   │   │       └── PatientsPage.jsx
│   │   ├── hooks/
│   │   ├── context/            → Solo contextos transversales (Idiomas, Modales)
│   │   └── utils/
│   └── public/
├── server/
│   ├── routes/
│   │   ├── appointmentRoutes.js
│   │   ├── medicalRoutes.js
│   │   └── financeRoutes.js
│   ├── controllers/
│   │   ├── appointmentController.js
│   │   ├── financeController.js
│   │   ├── google/
│   │   │   ├── googleAuthController.js
│   │   │   ├── googleCalendarController.js
│   │   │   ├── googleContactController.js
│   │   │   └── googleSpreadsheetController.js
│   │   └── medical/
│   │       ├── medicationController.js
│   │       ├── prescriptionController.js
│   │       ├── medicalRequestController.js
│   │       ├── medicalFileController.js
│   │       └── medicalExportController.js
│   ├── services/
│   │   ├── appointments/
│   │   │   ├── bookingService.js
│   │   │   ├── modificationService.js
│   │   │   └── retrievalService.js
│   │   ├── google/
│   │   │   ├── GoogleAuthService.js
│   │   │   ├── GoogleCalendarService.js
│   │   │   ├── GoogleContactService.js
│   │   │   └── GoogleSpreadsheetService.js
│   │   ├── medical/
│   │   │   ├── medicationService.js
│   │   │   └── prescriptionService.js
│   │   └── finance/
│   │       └── statsService.js
│   └── middleware/
└── docs/
    ├── ARQUITECTURA.md (este archivo)
    ├── MANUAL_OPERACIONES.html
    └── GUIA_CONFIGURACION_GENERAL.md
```

## Reglas de Código

## Reglas de Herramientas de IA
- 🚫 **PROHIBICIÓN DEL BROWSER TOOL**: Está TERMINANTEMENTE PROHIBIDO que la IA utilice la herramienta `browser_subagent` o `read_url` para intentar observar o depurar la aplicación local (localhost). Este proceso consume recursos innecesarios y es propenso a fallos de red. 
- **Fuente de Verdad Visual**: La ÚNICA forma de validar la interfaz es solicitando al USER una descripción detallada, compartiendo capturas de pantalla o pidiendo logs específicos de la consola. No se debe intentar navegar por el sitio de forma autónoma.

### Frontend (React)

#### Componentes
```jsx
// ✅ CORRECTO
import React from 'react';
import './ComponentName.css';

const ComponentName = ({ prop1, prop2 }) => {
    return (
        <div className="component-name">
            <h1 className="component-name__title">Título</h1>
            <button className="component-name__button component-name__button--primary">
                Acción
            </button>
        </div>
    );
};

export default ComponentName;
```

```jsx
// ❌ INCORRECTO
const ComponentName = ({ prop1, prop2 }) => {
    return (
        <div className="flex justify-center bg-blue-500"> {/* NO Tailwind */}
            <h1 style={{ color: 'red' }}> {/* NO inline styles */}
                Título
            </h1>
        </div>
    );
};
```

#### CSS
```css
/* ✅ CORRECTO - BEM */
.appointment-report { }
.appointment-report__table { }
.appointment-report__row { }
.appointment-report__row--weekend { }
.appointment-report__cell-amount { }

/* ❌ INCORRECTO */
.appointmentReport { }        /* NO camelCase */
.AppointmentReport { }        /* NO PascalCase */
.table { }                    /* NO nombres genéricos */
.row-weekend { }              /* NO guiones simples para modificadores */
```

#### Controllers
```javascript
// ✅ CORRECTO - Custom Hook Controller
export const useReportsController = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('appointments');
    const [reportData, setReportData] = useState(null);

    const handleGenerateReport = async () => {
        // Lógica de negocio
    };

    return {
        activeTab,
        setActiveTab,
        reportData,
        handleGenerateReport
    };
};
```

### Backend (Node.js/Express)

#### Rutas
```javascript
// ✅ CORRECTO
const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerName');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/resource', verifyToken, controller.getResource);
router.post('/resource', verifyToken, controller.createResource);

module.exports = router;
```

#### Controladores
```javascript
// ✅ CORRECTO
exports.getResource = async (req, res) => {
    let conn;
    try {
        const { param1, param2 } = req.query;
        conn = await pool.getConnection();
        
        // Lógica de negocio
        const result = await service.getData(param1, param2);
        
        res.json(result);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server Error' });
    } finally {
        if (conn) conn.release();
    }
};
```

#### Servicios
```javascript
// ✅ CORRECTO - Lógica de negocio separada
const pool = require('../db');

exports.getData = async (param1, param2) => {
    const conn = await pool.getConnection();
    try {
        const query = `SELECT * FROM table WHERE field = ?`;
        const result = await conn.query(query, [param1]);
        return result;
    } finally {
        if (conn) conn.release();
    }
};
## Internacionalización (i18n)

Para garantizar la correcta traducción de mensajes:

### Backend
- **NUNCA** devolver cadenas de texto crudo (`"Server Error"`, `"Actualizado"`) para respuestas que deban ser leídas por el usuario.
- **DEBEN** devolver una **clave (key)** en formato JSON que el Frontend pueda mapear.
  ```javascript
  // ✅ CORRECTO
  res.status(500).json({ error: 'server_error' });
  ```

### Frontend
- En los bloques `catch`, utiliza la clave del backend con la función `t()`.
  ```javascript
  // ✅ CORRECTO
  try {
      await api.put(`/resource`);
  } catch (err) {
      const errorMsg = err.response?.data?.error ? t(err.response.data.error) : t('failed_update');
      showMessage(errorMsg, 'error');
  }
  ```

## Convenciones de Nombres

### Archivos
- **Componentes React**: `PascalCase.jsx` (ej: `AppointmentReportTable.jsx`)
- **CSS**: `PascalCase.css` (ej: `AppointmentReportTable.css`)
- **Controllers**: `camelCase.js` (ej: `useReportsController.js`)
- **Services**: `camelCase.js` (ej: `bookingService.js`)
- **Utilities**: `camelCase.js` (ej: `reportPrintHelper.js`)

### Variables y Funciones
- **JavaScript**: `camelCase` (ej: `handleGenerateReport`, `reportData`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `MAX_RETRIES`, `API_BASE_URL`)
- **CSS Classes**: `kebab-case` con BEM (ej: `appointment-report__table`)

### Base de Datos
- **Tablas**: `snake_case` plural (ej: `appointments`, `medical_requests`)
- **Columnas**: `snake_case` (ej: `patient_id`, `appointment_date`)

## Patrones Comunes

### Reportes
Todos los reportes siguen la misma estructura:

1. **Resumen Diario** (arriba):
   - Tabla con totales por día
   - Columnas: Fecha, Efectivo, Otros Métodos, Total
   - Footer con subtotales mensuales

2. **Detalle Diario** (abajo):
   - Desglose completo por día
   - Agrupado por fecha
   - Información detallada de cada transacción

### Componentes de Tabla
```jsx
<div className="report-name">
    {/* Summary */}
    <div className="report-name__summary">
        <h3 className="report-name__summary-title">Resumen Diario</h3>
        <table className="report-name__table">
            {/* ... */}
        </table>
    </div>

    {/* Detail */}
    <div className="report-name__group">
        <h3 className="report-name__date-header">Fecha</h3>
        <table className="report-name__table">
            {/* ... */}
        </table>
    </div>
</div>
```

## Reglas de Negocio

### Finanzas y Deudores
- **Turnos Futuros**: Los turnos agendados a futuro cuyos pagos estén marcados como “pendientes” NO deben considerarse deuda exigible hasta que el turno haya ocurrido (estado `completed`, `attended`, `arrived`, `absent`).
- **Deuda Visible**: En los reportes financieros y listas de pacientes, la deuda mostrada debe ser solo la vencida (turnos pasados o completados). Los turnos futuros con saldo pendiente no suman a la deuda total hasta que se concreten.

### Co-pago y Responsabilidad de Instituciones
- **Independencia de Pago**: Los pacientes derivados de una institución pueden pagar una parte, el total o nada de su consulta. La institución se hace cargo del resto pactado por convenio.
- **Fechas de Pago**: Tanto el paciente como la institución pueden abonar en fechas separadas, independientes de la fecha del turno.
- **Estructura de Deuda**: Una vez que el paciente paga lo que le corresponde (su fracción pactada), queda liberado de deuda. El resto de la deuda se deriva y recae sobre la Institución.
- **Topes de Cobertura**: Si la institución tiene un tope pactado y el paciente incurre en un gasto extra no cubierto, esa porción extra es deuda del PACIENTE. Las instituciones solo absorben lo acordado en su tarifa.

## Checklist de Revisión

Antes de hacer commit, verificar:

- [ ] ¿Sigue BEM CSS?
- [ ] ¿Cada componente tiene su CSS?
- [ ] ¿Usa los átomos `<Button />` e `<Icon />` en lugar de elementos nativos o emojis?
- [ ] ¿No usa Tailwind?
- [ ] ¿No usa `!important`?
- [ ] ¿No hay código repetido (DRY)?
- [ ] ¿Sigue la estructura Atomic Design?
- [ ] ¿Sigue el patrón MVC?
- [ ] ¿Los nombres son consistentes?
- [ ] ¿El código está documentado?
- [ ] ¿Las variables CSS están centralizadas?
- [ ] ¿Los estilos son reutilizables?

## Recursos

- [BEM Methodology](http://getbem.com/)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [MVC Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

---

**Última actualización**: 2026-04-02
**Mantenedor**: Equipo de Desarrollo (Modularización de Feature Finances completada)
