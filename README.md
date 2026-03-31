# 👩‍⚕️ SECRETARY APP - Sistema de Gestión Médica

Sistema integral para la gestión de turnos, pacientes e integración con AFIP/ARCA, optimizado con una arquitectura de contenedores Docker y un entorno de desarrollo profesional.

---

## 🏗️ Estructura del Proyecto (Nueva Organización)

El proyecto está organizado como un **Multi-root Workspace** de VS Code para facilitar la navegación y el mantenimiento.

*   📂 `client/` - Frontend (React/Vite).
*   📂 `server/` - Backend (Node.js/Express).
*   📂 `android_native/` - Aplicación móvil nativa.
*   📂 `arca/` - Integraciones con los servicios de AFIP.
*   📂 `data/` - Datos persistentes, bases de datos y backups.
*   📂 `docs/` - Guías de configuración y planes de implementación.
*   📂 `scripts/` - Utilidades para despliegue, backups y mantenimiento.
*   📂 `builds/` - Compilaciones listas (APKs) y archivos heredados.

---

## 🚀 Inicio Rápido (Comandos Esenciales)

Todos los comandos deben ejecutarse desde la **raíz del proyecto** o utilizando los scripts de la carpeta `/scripts`.

### Iniciar la aplicación
```bash
bash scripts/start_app.sh
```

### Actualizar con GitHub y reconstruir
```bash
bash scripts/actualizar.sh
```

### Realizar un Backup Manual
*   **Producción:** `bash scripts/backup_prod.sh`
*   **Desarrollo:** `bash scripts/backup_dev.sh`
*   *(Nota: Los backups se guardan en `data/backups_*` y una copia comprimida en el Escritorio).*

### Compilar App Android
```bash
bash scripts/android_build.sh
```

---

## 📊 Mantenimiento y Operaciones

*   **Monitoreo de Recursos:** `bash scripts/monitor-docker.sh`
*   **Sincronizar Datos (Prod -> Dev):** `bash scripts/sync_prod_to_dev.sh`
*   **Ver Logs Generales:** `bash scripts/monitor-docker.sh` (o accede a Dozzle local en el puerto 8889).

---

## 🛠️ Configuración Avanzada

*   **IP Automática:** Al iniciar con `start_app.sh`, el sistema detecta tu IP LAN y configura automáticamente la base de datos para que el QR de los informes médicos funcione en la red local.
*   **Exclusiones:** Los archivos pesados de base de datos y `node_modules` están excluidos del explorador de archivos para mejorar el rendimiento del editor.

---

*Desarrollado para la clínica con ❤️ y eficiencia.*
