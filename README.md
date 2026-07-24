# Secretary App 🩺💼

Una solución integral para la gestión de consultorios médicos, diseñada para optimizar la agenda, la comunicación con pacientes y la administración financiera.

---

## 🚀 Características Principales

- **Gestión de Turnos**: Agenda inteligente con estados dinámicos (completado, pendiente, ausente, etc.).
- **Comunicación vía WhatsApp**: Integración directa para envío de recordatorios y mensajería en vivo.
- **Ficha del Paciente**: Historial médico completo, recetas crónicas y gestión de documentos.
- **Administración Financiera**: Control de caja, gestión de deudas de pacientes e instituciones, y reportes de facturación.
- **Arquitectura Premium**: Interfaz moderna basada en *Atomic Design* y *Bento Box UI*.
- **Internacionalización**: Soporte nativo para múltiples idiomas (i18n).

---

## 🛠️ Tecnologías

*   **Frontend**: React 19 (Vite), Vanilla CSS (BEM), Context API, React Router.
*   **Backend**: Node.js + Express v5, Knex (MySQL / MariaDB).
*   **WhatsApp Bridge**: Go 1.25 (whatsmeow, SQLite).

---

## 📖 Documentación y Guías

Toda la documentación detallada del proyecto se encuentra organizada dentro de la carpeta `docs/`:

*   [**Arquitectura y Estándares de Código**](docs/ARQUITECTURA.md): Reglas de oro del repositorio, Atomic Design, CSS Modules, BEM y patrones del backend.
*   [**Guía de Configuración General**](docs/GUIA_CONFIGURACION_GENERAL.md): Pasos para la instalación inicial, variables de entorno (.env) y comandos de ejecución.

---

## 📦 Inicio Rápido

1.  **Instalar dependencias**:
    ```bash
    pnpm install
    ```
2.  **Configurar entorno**:
    Copia `.env.example` a `.env` en la raíz y completa los valores.
3.  **Ejecutar en desarrollo**:
    *   Cliente: `pnpm --filter client dev`
    *   Servidor: `pnpm --filter server start`

---
Desarrollado con ❤️ para profesionales de la salud.
