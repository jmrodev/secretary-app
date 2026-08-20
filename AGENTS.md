# Estándares de Código - Secretary App 🩺💼

Este documento contiene las reglas de oro y estándares obligatorios para todo el código en el proyecto **Secretary App**. El Guardian Angel (GGA) validará cada commit contra estas reglas.

---

## 1. Reglas Generales del Repositorio
- **Manejo Seguro de Secretos**: Nunca hardcodees tokens, claves API, contraseñas o URLs de bases de datos. Usá variables de entorno (`process.env` en Node.js o `import.meta.env` en React) y listalas en `.env.example`.
- **Inmutabilidad**: Preferí siempre `const` sobre `let`. Nunca mutés variables u objetos globalmente de forma directa; utilizá copias limpias.
- **Manejo de Errores Obligatorio**: Nunca ignores errores. Los bloques `catch` vacíos o tragar errores en silencio están prohibidos. Todo error debe registrarse (`console.error` o logs específicos) o propagarse adecuadamente.
- **Mapeo con Graphify**: El repositorio cuenta con `graphify` instalado localmente (`~/.local/bin/graphify`). Para analizar flujos complejos o dependencias de código, se puede correr `graphify .` para regenerar el mapa interactivo de relaciones en `graphify-out/` o `graphify export callflow-html` para ver diagramas de flujo.


---

## 2. Frontend (React 19 & CSS)
- **Componentes de React**:
  - Usá siempre componentes funcionales y hooks modernos. Están estrictamente prohibidos los componentes basados en clases.
  - El estado compartido debe manejarse mediante **Context API** (`/src/context`) o Hooks personalizados (`/src/hooks`).
- **Imports/Exports**:
  - Preferí **exports nombrados** (`export const Component = ...`) sobre exports por defecto (`export default`).
- **Arquitectura de UI (Atomic Design)**:
  - Clasificá y ubicá los componentes estrictamente en su nivel jerárquico correspondiente:
    - **Atoms**: Componentes gráficos básicos e indivisibles (ej. `Button`, `Icon`, `Loading`).
    - **Molecules**: Combinación de átomos con lógica mínima (ej. `StatCard`, `ReminderItem`).
    - **Organisms**: Estructuras funcionales complejas (ej. `CashMonitorCard`, `DashboardReminders`).
    - **Templates**: Layouts estructurales (ej. `MainLayout`).
    - **Pages**: Vistas principales mapeadas por rutas.
- **Estilos y CSS**:
  - Seguí la metodología **BEM** (`bloque__elemento--modificador`) para escribir nombres de clases CSS.
  - Usá **CSS Modules** (`styles.module.css`) para evitar colisiones de selectores en el árbol global de estilos.
  - No abuses de estilos en línea (`style={{...}}`) a menos que los valores dependan estrictamente del estado dinámico de JS.
- **Internacionalización (i18n)**:
  - Todo texto visible para el usuario final debe pasar por el sistema de traducciones (`t('key')`). Prohibido colocar texto crudo directamente en el JSX.

### 2.1 Design Tokens (CSS Variables) — OBLIGATORIO

Todos los estilos deben usar los tokens definidos en `client/src/styles/variables.css` (default dark, light y dim vía `data-theme`). Prohibido hardcodear valores si existe un token equivalente.

**Colores semánticos (los más usados):**
- `--primary-color` / `--primary-hover` — color principal de acción (teal)
- `--accent-color` / `--accent-hover` — color de acento / links
- `--secondary-color` — dark slate de apoyo
- `--danger` / `--error` — errores y destrucción
- `--success` — éxito
- `--warning` — advertencias

**Superficies:**
- `--background-bg` — fondo de app
- `--dashboard-card-bg` — fondo de cards/navbar
- `--dashboard-card-border` — borde de cards
- `--modal-bg` / `--modal-bg-dark` — modales
- `--card-surface-bg` — interior de cards
- `--card-hover-bg` — hover de cards
- `--glass` / `--glass-dark` / `--glass-border` — superficies translúcidas

**Texto:**
- `--text-main` — texto principal
- `--text-secondary` — texto secundario
- `--text-muted` — texto atenuado

**Bordes y UI:**
- `--border-color` — borde genérico
- `--radius` / `--radius-sm` / `--radius-md` / `--radius-lg` — radios de borde
- `--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-premium` — sombras
- `--navbar-bg` / `--navbar-border` / `--navbar-link-color` — navbar

**Tipografía:**
- `--font-main` (Nunito Sans) — fuente por defecto
- `--font-manrope` — títulos/logo
- `--font-newsreader` — serif (académico)
- `--font-nunito` — cuerpo

**Escalas de color (usar cuando el semántico no aplique):** `--gray-50..950`, `--blue-50..800`, `--red-*`, `--green-*`, `--amber-*`, `--sky-*`, `--teal-*`, `--purple-*`, `--violet-*`, `--indigo-*`, `--pink-*`, `--rose-*`, `--orange-*`, `--cyan-*`, `--yellow-*`.

**Espaciado:** `--spacing-xs` (4px), `--spacing-sm` (8px), `--spacing-md` (16px), `--spacing-lg` (24px), `--spacing-xl` (32px).

Regla: nunca uses valores hardcodeados (ej. `#333`, `15px`) si existe un token equivalente. Si un valor no tiene token, preferí agregarlo como token nuevo en `variables.css` antes que inline.

### 2.2 Distribución en el Paño (Layout & Estilo) — OBLIGATORIO

1. **Mobile-First**: Diseñá siempre pensando en componentes responsivos; partí del layout móvil y expandí con media queries.
2. **Contenedores**: Usá **Flexbox** para distribuciones unidimensionales (filas/columnas simples) y **CSS Grid** para estructuras bidimensionales complejas (tableros, mallas de tarjetas). `display: grid` con `grid-template-columns` para grillas de componentes.
3. **Espaciado Consistente**: Prohibido usar valores aleatorios para `margin`/`padding`. Usá exclusivamente la propiedad `gap` en los contenedores padres y los tokens `--spacing-*` (múltiplos de 4px: 4, 8, 16, 24, 32).
4. **Alineación**: Usá `place-items: center`, `justify-content: space-between` o `align-items` de forma explícita para evitar que los elementos colapsen o se encimen en pantallas de diferentes tamaños.

---

## 3. Backend (Node.js & Express)
- **Patrón Arquitectónico (MVC + Repository)**:
  - Mantené la separación clara de responsabilidades:
    - **Routes**: Mapean los endpoints de Express hacia los controladores.
    - **Controllers**: Manejan el ciclo request/response, parsean inputs y llaman a los servicios.
    - **Services**: Albergan la lógica de negocio del dominio.
    - **Repositories**: Encapsulan las consultas a la base de datos (usando Knex o consultas SQL directas si es necesario).
- **Control de Acceso y Validación**:
  - Las rutas críticas deben protegerse obligatoriamente con los middlewares de autenticación (`authMiddleware`) y autorización (`authorize`).
  - Validá los cuerpos de las peticiones (`req.body`) usando middlewares de validación específicos.
- **Consultas a Base de Datos**:
  - Asegurá que todas las consultas SQL dinámicas estén parametrizadas para evitar ataques de SQL Injection.

---

## 4. Go (WhatsApp Bridge)
- **Prácticas de Go**:
  - El código debe estar formateado obligatoriamente con `go fmt`.
  - Manejo clásico de errores: Siempre chequeá `if err != nil`. No uses panics innecesarios en producción.
  - Gestión de Concurrencia: Asegurá que las goroutines e hilos terminen de forma segura y que no haya fugas de memoria o recursos.

---

## 5. Git y Flujo de Trabajo
- **Conventional Commits**: Los mensajes de commit deben seguir estrictamente el formato estándar:
  - `feat: <descripción>` para nuevas funcionalidades.
  - `fix: <descripción>` para corrección de bugs.
  - `refactor: <descripción>` para cambios en el código que no alteran comportamiento.
  - `style: <descripción>` para cambios estéticos o de formateo.
  - `test: <descripción>` para añadir o corregir tests.
- **Política de Ramas y Despliegue**:
  - **Ramas Protegidas (Prohibido Borrar)**: `main`, `release-v1.0-cima`, `staging` y `development`.
  - **Producción**: La rama activa en producción es `release-v1.0-cima`. **Está estrictamente prohibido realizar cambios o commits sobre esta rama**.
  - **Flujo de Cambios**: Los cambios se integran en `development`, `staging` y `main`.
  - **Protección de Rama `development`**: Nunca intentes subir cambios directos a `development`. Todos los cambios deben integrarse obligatoriamente mediante Pull Requests (PR) utilizando la herramienta `gh` (GitHub CLI) autenticada.

