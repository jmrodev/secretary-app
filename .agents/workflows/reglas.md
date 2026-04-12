---
description: Flujo de trabajo para aplicar los estándares de calidad del proyecto
---

# Workflow: Cumplimiento de Estándares (Secretary App)

Sigue este flujo de trabajo para cualquier tarea de desarrollo para garantizar que el código cumpla con los estándares premium del proyecto.

## Paso 1: Análisis y Planificación
- [ ] Confirma si el cambio es estructural o una nueva característica.
- [ ] Si es estructura, revisa `docs/ARQUITECTURA.md`.
- [ ] Identifica qué nivel de **Atomic Design** requiere (atom, molecule, organism).

## Paso 2: Creación de Componentes
- [ ] Crea el archivo `.jsx` y su correspondiente `.css` homónimo en la misma carpeta.
- [ ] Usa **BEM CSS** estrictamente (`block__element--modifier`).
- [ ] Verifica que NO estás usando **TailwindCSS** ni estilos inline.
- [ ] Usa obligatoriamente los átomos `<Button />` e `<Icon />` de `@/components/atoms/`.

## Paso 3: Lógica y Datos
- [ ] Extrae la lógica compleja a un hook controlador (ej: `useFeatureController.js`).
- [ ] Usa `@/hooks/useFetch` para peticiones al backend.
- [ ] Asegura que no haya variables crudas; usa `t('key')` para todo texto visible.
- [ ] Usa **Path Aliases** (`@/`) para todas las importaciones.

## Paso 4: Integración y Navegación
- [ ] Si es una página nueva, regístrala en `AppRouter.jsx` usando `React.lazy()`.
- [ ] Envuelve la carga en un `Suspense`.
- [ ] Verifica el contraste visual siguiendo la **Regla Anti-Camuflaje** (tarjetas blancas sobre fondos grises).

## Paso 5: Backend (Si aplica)
- [ ] Usa placeholders `?` o `sqlUtils` para consultas MariaDB.
- [ ] Asegura que los errores devuelvan **keys** de i18n, no texto.

## Paso 6: Verificación de IA
- [ ] 🚫 **PROHIBIDO** usar `browser_subagent` o `read_url` para localhost.
- [ ] Solicita logs de consola o capturas al USER para validar la UI.
- [ ] Realiza un commit semántico (ej: `feat: ...`, `fix: ...`).