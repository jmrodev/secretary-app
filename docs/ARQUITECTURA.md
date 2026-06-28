# Arquitectura y Estándares de Código - Secretary App 🩺💼

Este documento detalla los estándares de diseño, arquitectura y convenciones técnicas aplicados en el proyecto **Secretary App**.

---

## 1. Arquitectura de UI (Atomic Design)
Clasificamos y ubicamos los componentes estrictamente en su nivel jerárquico correspondiente dentro de `client/src/components/` y carpetas de características (`features/`):

- **Atoms (Átomos)**: Componentes gráficos básicos e indivisibles (ej. `Button`, `Icon`, `Loading`, `Input`). No contienen lógica de negocio.
- **Molecules (Moléculas)**: Combinación de átomos con lógica mínima o de estado local (ej. `ReminderItem`, `SearchBar`, `FormGroup`).
- **Organisms (Organismos)**: Estructuras funcionales complejas que agrupan moléculas y átomos, a menudo conectados a contextos (ej. `CashMonitorCard`, `DashboardReminders`, `GlobalWhatsappMessenger`).
- **Templates (Plantillas)**: Layouts estructurales que definen la disposición espacial de la página (ej. `MainLayout`).
- **Pages (Páginas)**: Vistas principales mapeadas directamente por el enrutador de React (`react-router-dom`).

---

## 2. Estilos y CSS
- **CSS Modules**: Usamos exclusivamente CSS Modules (`styles.module.css`) para todos los componentes de React, previniendo colisiones de selectores en el árbol global.
- **Metodología BEM**: Los nombres de clases dentro del CSS deben seguir la convención BEM (`bloque__elemento--modificador`).
- **Sin Estilos inline**: Está estrictamente prohibido usar estilos en línea (`style={{...}}`) salvo para valores dinámicos calculados por JavaScript en tiempo de ejecución.

---

## 3. Backend (MVC + Repository)
El servidor Express en `server/` sigue una separación de responsabilidades estricta:

- **Routes (Rutas)**: Definen los endpoints HTTP de Express y aplican middlewares (autenticación, autorización, validación de esquemas).
- **Controllers (Controladores)**: Manejan el ciclo de petición/respuesta (`req`, `res`), validan datos iniciales y delegan en los servicios.
- **Services (Servicios)**: Contienen toda la lógica de negocio y reglas del dominio.
- **Repositories (Repositorios)**: Encapsulan el acceso a datos y las consultas a la base de datos (mediante Knex o SQL directo parametrizado).

---

## 4. Internacionalización (i18n)
- **Cero Texto Plano**: Todo texto visible para el usuario final en la interfaz debe pasar por el helper de traducción `t('key')`. 
- **Estructura**: Las traducciones se organizan en archivos JSON/JS dentro de `client/src/constants/languages/`.
