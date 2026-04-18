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
- **Estandarización de Datos**: Todos los controladores de features DEBEN utilizar el hook `@/hooks/useFetch` para la obtención de datos, asegurando un manejo consistente de estados de carga, error y sincronización.
- **Barrel Files**: Cada característica debe tener un `index.js` para exponer solo lo necesario al resto de la aplicación.
- **Separación de Lógica**: La lógica de orquestación reside en `useFeatureController.js`, mientras que las acciones se dividen en `useFeatureHandlers.js` si la complejidad lo requiere.

### 5. Estilo y Rutas Limpias
- **Solo CSS vanilla/puro**: Cada componente tiene su propio archivo CSS.
- **Variables CSS**: Usar `var(--color-primary)` para temas.
- **Path Aliases**: Utilizar siempre el alias `@/` para referencias a `src/` (ej: `@/api/axios`, `@/context/ConfigContext`). PROHIBIDO el uso de paths relativos profundos (`../../../../`).
- **Lazy Loading**: TODAS las páginas y componentes pesados deben cargarse mediante `React.lazy()` y enviarse dentro de un `Suspense` con un fallback de carga. Esto se centraliza en `AppRouter.jsx`.
- **Unidades Relativas**: Priorizar el uso de unidades relativas (`rem`, `em`, `%`).
- **PROHIBIDO usar `!important`**.

### 6. MVC (Model-View-Controller)
- **Frontend**:
  ```
  components/  → View (Atomic Design)
  controllers/ → Lógica de UI genérica
  features/    → Controller de dominio (hooks orquestadores)
  hooks/       → Model (useFetch para datos, Contextos para estado global)
  ```
- **Backend**:
  ```
  routes/       → Rutas HTTP
  controllers/  → Orquestación de peticiones
  services/     → Lógica de negocio pura
  repositories/ → Acceso a datos con saneamiento (SQL protection)
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
- **Componentes Orquestadores**: Son componentes de alto nivel (`App.jsx`, Routers, FeaturePage) que coordinan componentes y hooks.
- **Componentes Ejecutores**: Átomos, Moléculas y Hooks de Lógica (`useFetch`, `useHandlers`).
- **Regla de Oro**: Si un orquestador tiene lógica compleja, debe extraerse a un hook controlador.

### 11. Estrategia de Ramas (Git Flow)
- **main**: Rama de producción. Contiene código estable y desplegable.
- **development**: Rama de integración principal. Todo el desarrollo se realiza y se une aquí antes de pasar a `main`.
- **Limpieza**: Una vez que una funcionalidad se integra en `development` y se valida, su rama de origen DEBE ser borrada tanto local como remotamente.

### 12. Seguridad y Repositorios (Backend)
- **Protección SQL**: PROHIBIDO concatenar variables en strings de SQL.
- **Whitelisting**: Los métodos `update` deben usar una lista blanca de campos permitidos (`ALLOWED_FIELDS`) para evitar inyecciones de parámetros no deseados.
- **sqlUtils**: Utilizar la utilidad centralizada `@/utils/sqlUtils.js` para construir consultas dinámicas de forma segura.

### 13. CI/CD y Despliegue (Cloudflare)
- **Gestión Externa**: El sistema de despliegue principal ("Workers Builds: secretary-app") se gestiona externamente a través del dashboard de Cloudflare vinculado al repositorio.
- **Configuración (wrangler)**: Se utiliza `wrangler.jsonc` en la raíz para definir un despliegue de tipo "assets-only" (`client/dist`), desactivando los bindings por compatibilidad.
- **Arquitectura de Workspaces**: El proyecto está configurado con **npm workspaces**. Los comandos de construcción y linting deben ejecutarse desde la raíz (`npm run build --workspace=client`) para garantizar la integridad del `package-lock.json` unificado.
- **Workaround de Rollup**: Para evitar errores de "Module not found" en GitHub Actions, las variantes de `@rollup/rollup-*` para distintas plataformas se declaran explícitamente como `optionalDependencies` en `client/package.json`.

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
│   │   │   ├── reports/        → Orquestador de reportes mensuales y Auditoría (migrado)
│   │   │   ├── medical_documents/ → Gestión de recetas (migrado)
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

#### Semántica HTML5 (A11y & SEO)
- **Cero "Div-soup"**: Queda estrictamente prohibido el uso indiscriminado de `<div>` genéricos para representar regiones estructurales del DOM.
- **Estructura lógica**: Las vistas y componentes grandes deben emplear etiquetas semánticas validadas como `<section>`, `<article>`, `<aside>`, `<header>`, `<main>` o `<footer>` según corresponda la naturaleza de su contenido.
- **Jerarquía y Títulos**: Todo elemento estructural de tipo `<section>` o `<article>` debería (en la medida de lo posible) estar introducido por un tag de encabezado (`<h1>` - `<h6>`), respetando el flujo de accesibilidad. Ejemplo: `AppointmentActionModal` se dividirá en un `<section>` general, y cada una de sus pestañas/módulos independientes en `<article>` o `<section>` subordinados.

#### Estructura de Contraste Visual (Bento Box)
- **Regla Anti-Camuflaje**: Nunca se deben encadenar fondos grises sobre contenedores grises (ej: `gray-100` sobre `card-bg` o `gray-50`). Esto destruye la división visual en monitores de bajo contraste.
- **Jerarquía de Cajas (Modales y Vistas)**: El fondo central (modal o app base) utiliza `var(--card-bg)` o un gris apagado. Los paneles interactivos y grupos de acción interiores (`<article>` o `<section>`) **deben forzar un contraste brillante**, habitualmente utilizando `var(--white)` puro acompañado de `border: 1px solid var(--gray-300)` y `box-shadow: var(--shadow-sm)`.
- **Zonas Semánticas**: Las únicas excepciones a la regla de tarjeta blanca son las alertas funcionales graves o destacadas, las cuales consumen fondos pálidos propios (`var(--red-50)`, `var(--blue-50)`) y marcos oscurecidos.

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

#### CSS (Tokens y BEM)
**Sistema de Tokens (Custom Properties)**
La aplicación sigue una arquitectura de 3 niveles para `var(--)`:
1. **Tokens Globales / Primitivos**: Sólo colores crudos (`--blue-500`, `--white`). Residen en `variables.css`.
2. **Tokens Semánticos**: Definen roles genéricos a nivel de app (`--modal-bg`, `--card-bg`, `--text-main`). Residen en `variables.css`.
3. **Tokens de Componente (Locales)**: Las variables específicas de un componente (ej. `--panel-group-bg`) **NUNCA deben polucionar `variables.css`**. Deben declararse al inicio de la clase raíz BEM del componente en su archivo local, apuntando a los globales.

```css
/* ✅ CORRECTO - Tokens Locales y BEM */
.appointment-admin-panel {
    --panel-bg: var(--white);
    --panel-border: var(--gray-300);
}
.appointment-admin-panel__group {
    background-color: var(--panel-bg);
}
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

    // Group all action handlers in a 'handlers' object
    const handlers = {
        handleGenerateReport,
        setActiveTab
    };

    return {
        activeTab,
        reportData,
        handlers,
        t
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

- **Cero Fallbacks (Frontend)**: Está TERMINANTEMENTE PROHIBIDO el uso de fallbacks hardcodeados en la función `t()` (ej: `t('key') || 'Texto'`). 
    - Si una clave no existe, **debe crearse** en los archivos de idioma correspondientes (`es.js`, `en.js`).
    - El JSX debe mantenerse limpio de literales para asegurar que la aplicación sea 100% localizable dinámicamente.

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
- [ ] ¿Cero fallbacks en traducciones? (Prohibido `t('key') || 'Texto'`)

## Recursos

- [BEM Methodology](http://getbem.com/)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [MVC Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)

---

**Última actualización**: 2026-04-06
**Mantenedor**: Equipo de Desarrollo (Estandarización de useFetch, Lazy Loading y Git Flow completada)
