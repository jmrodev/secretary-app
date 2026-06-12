# Secretary App 🩺💼

Una solución integral para la gestión de consultorios médicos, diseñada para optimizar la agenda, la comunicación con pacientes y la administración financiera.

## 🚀 Características Principales

- **Gestión de Turnos**: Agenda inteligente con estados dinámicos (completado, pendiente, ausente, etc.).
- **Comunicación vía WhatsApp**: Integración directa para envío de recordatorios y mensajería en vivo.
- **Ficha del Paciente**: Historial médico completo, recetas crónicas y gestión de documentos.
- **Administración Financiera**: Control de caja, gestión de deudas de pacientes e instituciones, y reportes de facturación.
- **Arquitectura Premium**: Interfaz moderna basada en *Atomic Design* y *Bento Box UI*.
- **Internacionalización**: Soporte nativo para múltiples idiomas (i18n).

## 🛠️ Tecnologías

### Frontend
- **React 19** (Vite)
- **Vanilla CSS** (BEM Methodology)
- **SPA** con React Router
- **Context API** para estado global

### Backend
- **Node.js** con Express
- **MySQL / SQLite** (según entorno)
- **Google Cloud Integration** (Calendar, Sheets, Contacts)
- **WhatsApp Bridge** (Go/Node)

## 📦 Instalación y Desarrollo

Este proyecto utiliza **npm workspaces**.

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/jmrodev/secretary-app.git
   cd secretary-app
   ```

2. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

3. **Configuración de entorno**:
   - Copia `.env.example` a `.env` en la raíz y configura las variables necesarias.

4. **Ejecutar en desarrollo**:
   - **Cliente**: `cd client && pnpm run dev`
   - **Servidor**: `cd server && pnpm start` (o similar)

## 📖 Documentación

Para detalles técnicos profundos, consulta la carpeta `docs/`:

- [**Arquitectura y Estándares**](docs/ARQUITECTURA.md): Reglas de oro, BEM, Atomic Design y MVC.
- [**Guía de Configuración**](docs/GUIA_CONFIGURACION_GENERAL.md): Pasos para la puesta en marcha inicial.

## 📐 Estándares de Código

Este proyecto sigue reglas estrictas de calidad:
- **BEM CSS**: `block__element--modifier`.
- **Atomic Design**: Clasificación en átomos, moléculas, organismos, templates y páginas.
- **MVC**: Clara separación entre Vista, Controlador y Modelo.
- **i18n**: Cero texto crudo en el código; todo debe pasar por el sistema de traducciones.

---
Desarrollado con ❤️ para profesionales de la salud.
