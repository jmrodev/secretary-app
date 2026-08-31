# Estándares de Código - Secretary App 🩺💼

Este documento contiene las reglas de oro y estándares obligatorios para todo el código en el proyecto **Secretary App**. El AI Agent validará cada cambio contra estas reglas.

---

## 1. Reglas Generales del Repositorio
- **Alcance de Revisión (Diff-only)**: Las revisiones automáticas (GGA / AI Agent) deben validar **exclusivamente las líneas modificadas en el diff del cambio**. Está prohibido bloquear un commit por deuda técnica preexistente en código no tocado por la tarea.
- **Manejo Seguro de Secretos**: Nunca hardcodees tokens, claves API, contraseñas o URLs de bases de datos. Usá variables de entorno (`process.env` en Node.js o `import.meta.env` en React) y listalas en `.env.example`.
- **Inmutabilidad**: Preferí siempre `const` sobre `let`. Nunca mutés variables u objetos globalmente de forma directa; utilizá copias limpias.
- **Manejo de Errores Obligatorio**: Nunca ignores errores. Los bloques `catch` vacíos o tragar errores en silencio están prohibidos. Todo error debe registrarse (`console.error` o logs específicos) o propagarse adecuadamente.
- **Mapeo con Graphify**: El repositorio cuenta con `graphify` instalado localmente (`~/.local/bin/graphify`). Para analizar flujos complejos o dependencias de código, se puede correr `graphify .` para regenerar el mapa interactivo de relaciones en `graphify-out/` o `graphify export callflow-html` para ver diagramas de flujo.


---

## 2. Frontend (React 19 & CSS)
- **Componentes de React**:
  - Usá siempre componentes funcionales y hooks modernos. Están estrictamente prohibidos los componentes basados en clases, **con la única excepción de `ErrorBoundary` (obligatorio por diseño de la API de React)**.
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

