# Guía de Configuración General - Secretary App 🩺💼

Este documento describe la puesta en marcha inicial, la configuración de variables de entorno y los comandos del flujo de desarrollo de **Secretary App**.

---

## 1. Requisitos Previos
Asegúrate de tener instalado en tu sistema:
- **Node.js** v20 o superior
- **pnpm** (gestor de paquetes del monorepo)
- **Go** v1.25 (para el puente de WhatsApp)
- **MySQL / MariaDB**

---

## 2. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto y completa las siguientes claves:

```env
# Servidor Express
PORT=5000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_super_segura

# Base de Datos (MariaDB/MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=secretary_db

# Integraciones de Google (Opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 3. Instalación Inicial y Comandos de Desarrollo

### Setup inicial automatizado (recomendado):
```bash
pnpm run setup
```
Este script realiza toda la configuración guiada:
- Verifica Node.js, pnpm, Docker, Go y Ollama.
- Genera el `.env` con claves seguras.
- Levanta MariaDB en Docker y prepara las tablas.
- Pregunta si se desean cargar datos de prueba (seeds) o una base limpia.
- Compila el WhatsApp Bridge y descarga el modelo Ollama (`qwen2.5-coder:3b`).

*Modo sin preguntas:* `pnpm run setup -- --seed` (con prueba) o `pnpm run setup -- --no-seed` (limpio).

### Ejecutar todo el entorno en desarrollo:
```bash
pnpm dev
```
*(Inicia Cliente Web y Servidor Express en simultáneo).*

---

## 4. Calidad de Código y Tests

### Ejecutar tests de Jest en el backend:
```bash
pnpm --filter server test
```

### Ejecutar linting y formateo automático:
```bash
pnpm lint
```
*(Corre ESLint, Stylelint, Oxlint y React Doctor en paralelo).*
