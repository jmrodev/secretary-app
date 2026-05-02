# 🗄️ Configuración de MySQL MCP - Secretary App

Este documento contiene la configuración necesaria para activar el acceso directo a la base de datos MariaDB/MySQL a través de Gemini CLI.

## 🚀 Configuración del Servidor MCP

Para habilitar las herramientas de base de datos en esta sesión, la configuración debe estar presente en `~/.gemini/settings.json` bajo la sección `mcpServers`.

### Bloque de Configuración (Puerto 3307)

```json
"mysql": {
  "command": "/home/jmro/.gemini/extensions/mysql/toolbox",
  "args": [
    "--prebuilt",
    "mysql",
    "--stdio"
  ],
  "env": {
    "MYSQL_HOST": "127.0.0.1",
    "MYSQL_PORT": "3307",
    "MYSQL_DATABASE": "clinical_management",
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "cima1255"
  }
}
```

## 🛠️ Herramientas Disponibles

Una vez activado, tendrás acceso a:
- `mysql-list-tables`: Listar las tablas de la base de datos.
- `mysql-execute-sql`: Ejecutar consultas SQL (SELECT, INSERT, UPDATE, etc.).
- `mysql-describe-table`: Ver la estructura de una tabla.

## 🐳 Contenedor Docker
La base de datos corre en el contenedor: `secretary-db-dev`
- **Puerto Externo**: 3307
- **Imagen**: MariaDB 10.6

---
*Nota: Esta configuración es específica para el entorno de desarrollo local.*
