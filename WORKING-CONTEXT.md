# Working Context (Secretary App)

Last updated: 2026-06-02

## Purpose
Registro de memoria persistente basado en ECC (Everything Code Context) para mantener el contexto entre sesiones y evitar la pérdida de información en este proyecto complejo.

## Current Truth
- **Proyecto**: Secretary App (Gestión de consultorios médicos)
- **Estado**: Sesión inicial (Contexto base cargado).
- **Arquitectura**: Monorepo (`pnpm`), React 19 Frontend (`client`), Node.js Backend (`server`), Base de datos MariaDB, WhatsApp Bridge.

## Active Queues
- [x] **Refactorización de i18n (Lenguaje):** Extraer la dependencia de traducción (i18n) de los átomos/componentes menores. La traducción debe ejecutarse a nivel de Página (o Template) y los textos ya traducidos deben pasarse como props a los componentes menores.
- [x] **Rendimiento React 19:** Eliminar llamadas `setState` síncronas dentro de `useEffect` (Cascading Renders) en `useAgendaState.js` y `useSystemConfigController.js`.
- [x] **Modularización de i18n:** Dividir los archivos `en.js` (946 líneas) y `es.js` (1071 líneas) por dominio o *feature* para respetar el límite de 350 líneas.
- [x] **Limpieza de Componentes:** Rediseñar `MedicalRequirementManager` (eliminar sobrecarga de props booleanas) y refactorizar estado derivado en `Calendar.jsx`.

## Constraints & Rules (Recordatorio)
- Seguir estrictamente Atomic Design y BEM en Frontend.
- Prohibido Tailwind y CSS Inline. Lógica de UI en custom hooks.
- Consultas SQL parametrizadas, lógica priorizada en vistas/SP en MariaDB.
- Usar SIEMPRE `pnpm` (no npm).

## Latest Execution Notes
- **2026-06-02**: Inicialización del `WORKING-CONTEXT.md` a petición del usuario para habilitar `/save-session` y `/resume-session` a la manera de ECC.
- **2026-06-02**: Refactorización de átomos y moléculas (`LanguageSelector`, `CompactHeaderStats`, `PhoneNumbersManager`, `ProtectedRoute`) para eliminar el acoplamiento con `useLanguage`. Ahora reciben sus strings y el estado del idioma vía props inyectadas desde el nivel de página/plantilla (como `Navbar`). Ejecutada validación mediante `pnpm lint`.
- **2026-06-02**: Subagente `i18n Refactorer` refactorizó exitosamente `GlobalWhatsappMessenger` y `App.jsx`, logrando un 100% de cumplimiento en la desvinculación de traducciones de la capa de componentes menores. Linter validado (0 errores).
