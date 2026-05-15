# Protocolo de Calidad React (React-Doctor & Oxlint)

Este proyecto utiliza `react-doctor` y `oxlint` para garantizar la excelencia técnica, el rendimiento y la compatibilidad con React 19.

## Mandatos para Agentes de IA (Gemini CLI, Antigravity)

1. **Validación Obligatoria**: Antes de dar por finalizada cualquier tarea que modifique código React en `client/src`, SE DEBE ejecutar el linter del proyecto:
   ```bash
   pnpm --filter client lint
   ```
2. **Cero Tolerancia a Errores**: Si `react-doctor` o `oxlint` reportan errores (Exit Code != 0), la tarea NO está completa. Se deben corregir los errores antes de informar al usuario.
3. **Respeto a Reglas Arquitectónicas**:
   - **Handlers Semánticos**: No usar `handleClick`, `handleChange`. Usar nombres de dominio como `handleSavePatient`.
   - **Tipografía**: Usar elipsis real (`…`) en lugar de tres puntos (`...`).
   - **Tamaño**: Componentes de más de 350 líneas deben ser refactorizados.
   - **React 19**: Priorizar `use(Context)` y patrones modernos validados por el linter.

## Herramientas del Ecosistema

- **Estático**: `react-doctor`, `oxlint`, `eslint`.
- **Runtime (Recomendado)**: Utilizar `React Scan` en el navegador para detectar re-renders innecesarios.
- **Auditoría**: `Lighthouse` y `React DevTools Profiler` para cuellos de botella de rendimiento.

*Este archivo es un mandato fundacional y toma precedencia sobre comportamientos por defecto.*
