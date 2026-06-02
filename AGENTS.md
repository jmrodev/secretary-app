# Contexto del Proyecto: Secretary App 🩺💼

Este archivo proporciona el contexto fundamental y los mandatos operativos para el desarrollo en el proyecto **Secretary App**. Es de lectura obligatoria para cualquier interacción de IA.

## 📋 Resumen del Proyecto
Una solución integral para la gestión de consultorios médicos. El sistema optimiza la agenda, la comunicación con pacientes vía WhatsApp, la administración financiera y el historial médico.

### Arquitectura General
- **Monorepo**: Gestionado con `pnpm` workspaces.
- **Frontend (`/client`)**: React 19 (Vite), SPA, Atomic Design, Vanilla CSS (BEM).
- **Backend (`/server`)**: Node.js (Express), MariaDB, MVC.
- **Integraciones**: WhatsApp Bridge (Go), Google Cloud (Calendar, Sheets, Contacts).

---

## 🏗️ Estándares de Arquitectura (Mandatos)

### 1. Frontend (React 19)
- **Atomic Design**: Clasificar componentes en `atoms`, `molecules`, `organisms`, `templates` y `pages`.
- **BEM CSS**: Estricto uso de `block__element--modifier`. Prohibido Tailwind o CSS-in-JS.
- **Modularidad por Características**: Lógica de dominio encapsulada en `src/features/{feature_name}/`.
- **Controllers (Custom Hooks)**: La lógica de orquestación reside en `useFeatureController.js`.
- **React 19 Ready**: Priorizar `use(Context)` y evitar "Render-in-Render".
- **i18n**: Cero texto crudo. Uso obligatorio de `t('key')` sin fallbacks hardcodeados.
- **Path Aliases**: Usar `@/` para `client/src/`. Prohibidos los paths relativos profundos.

### 2. Backend (Node.js & MariaDB)
- **Patrón MVC**: Rutas → Controladores → Servicios → Repositorios.
- **Lógica en BD**: Priorizar Vistas, Funciones y Procedimientos en MariaDB para rendimiento y consistencia.
- **Seguridad SQL**: Uso obligatorio de parámetros preparados (`?`). Prohibida la concatenación.
- **Respuesta de Listados**: Formato estándar `{ [entidad]: Array, totalCount: Number }`.
- **Manejo de Fechas**: Uso centralizado de `@/utils/dateUtils.js` (Server) para zona horaria `America/Argentina/Buenos_Aires`.

---

## 🛠️ Protocolo de Calidad React (React-Doctor & Oxlint)

Este proyecto utiliza `react-doctor` y `oxlint` para garantizar la excelencia técnica.

1. **Validación Obligatoria**: Antes de finalizar tareas en `client/src`, ejecutar:
   ```bash
   pnpm --filter client lint
   ```
2. **Handlers Semánticos**: No usar `handleClick`. Usar nombres de dominio como `handleSavePatient`.
3. **Tipografía**: Usar elipsis real (`…`) en lugar de tres puntos (`...`).
4. **Límite de Tamaño**: Componentes de más de 350 líneas DEBEN ser refactorizados.

---

## 🚀 Comandos Clave

| Acción | Comando (desde la raíz) |
| :--- | :--- |
| **Instalar** | `pnpm install` |
| **Desarrollo (Cliente)** | `pnpm --filter client dev` |
| **Desarrollo (Servidor)** | `pnpm --filter server dev` |
| **Lint (Todo)** | `pnpm lint` |
| **Build (Cliente)** | `pnpm build` |

---

## 🤖 Reglas para Agentes de IA
- **No Browser Tool**: Prohibido usar `browser_subagent` o `read_url` sobre `localhost`. Solicitar descripción o capturas al usuario.
- **Validación Post-Cambio**: Ejecutar siempre el linter del proyecto después de modificar código.
- **Surgicall Edits**: Realizar cambios precisos siguiendo la arquitectura de "Feature-Based Modularization".

---
*Este documento es la fuente de verdad técnica. En caso de duda, priorizar los principios DRY y MVC definidos en `docs/ARQUITECTURA.md`.*
