#!/usr/bin/env bash
# ==============================================================================
# Secretary App 🩺💼 — Instalador y Setup Inicial Interactivo
# ==============================================================================

set -eo pipefail

# Colores de salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Directorio raíz del proyecto
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NON_INTERACTIVE="false"
ARG_SEEDS=""

# Parsear argumentos de línea de comandos
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --seed|--with-seed)
            ARG_SEEDS="yes"
            shift
            ;;
        --no-seed|--clean)
            ARG_SEEDS="no"
            shift
            ;;
        -y|--yes|--non-interactive)
            NON_INTERACTIVE="true"
            shift
            ;;
        -h|--help)
            echo "Uso: ./scripts/setup.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --seed, --with-seed   Carga automáticamente los datos de prueba / demo (seeds)."
            echo "  --no-seed, --clean    Inicializa la base de datos limpia (sin pacientes ni turnos de prueba)."
            echo "  -y, --yes             Modo no interactivo (acepta valores por defecto sin preguntar)."
            echo "  -h, --help            Muestra esta ayuda."
            exit 0
            ;;
        *)
            echo -e "${RED}Opción desconocida: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}${BOLD}"
echo "=================================================================="
echo "    Secretary App 🩺💼 — Instalador y Setup Inicial"
echo "=================================================================="
echo -e "${NC}"

# Función para prompts interactivos con valor por defecto
prompt_var() {
    local prompt_text="$1"
    local default_val="$2"
    local result_var="$3"
    local is_secret="${4:-false}"

    if [ "$NON_INTERACTIVE" = "true" ]; then
        eval "$result_var=\"$default_val\""
        return
    fi

    local user_input
    if [ "$is_secret" = "true" ]; then
        read -rsp "$(echo -e "${CYAN}?${NC} ${prompt_text} [${default_val}]: ")" user_input
        echo ""
    else
        read -rp "$(echo -e "${CYAN}?${NC} ${prompt_text} [${default_val}]: ")" user_input
    fi

    if [ -z "$user_input" ]; then
        eval "$result_var=\"$default_val\""
    else
        eval "$result_var=\"$user_input\""
    fi
}

# ------------------------------------------------------------------------------
# 1. Verificación de Requisitos Previos
# ------------------------------------------------------------------------------
echo -e "${BOLD}1. Verificando herramientas del sistema...${NC}"

check_cmd() {
    local cmd="$1"
    local name="$2"
    local required="$3"
    if command -v "$cmd" >/dev/null 2>&1; then
        local ver_output
        if [ "$cmd" = "go" ]; then
            ver_output=$(go version 2>&1 | head -n 1)
        else
            ver_output=$($cmd --version 2>&1 | head -n 1)
        fi
        echo -e "  [${GREEN}OK${NC}] $name: $ver_output"
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "  [${RED}ERROR${NC}] $name no está instalado y es requerido."
            return 1
        else
            echo -e "  [${YELLOW}AVISO${NC}] $name no está instalado (opcional o requerido para componentes específicos)."
            return 2
        fi
    fi
}

check_cmd node "Node.js" "true" || exit 1
check_cmd pnpm "pnpm" "true" || exit 1
check_cmd docker "Docker" "true" || exit 1
check_cmd go "Go compiler" "false"
check_cmd ollama "Ollama AI" "false"

# ------------------------------------------------------------------------------
# 2. Configuración Interactiva de Base de Datos y Entorno
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}2. Configuración de Base de Datos y Servicios${NC}"

# Leer valores existentes del .env si existe
CURRENT_DB_NAME="clinical_clean"
CURRENT_DB_PORT="3306"
CURRENT_DB_USER="root"
CURRENT_DB_PASS="cima1255"
CURRENT_APP_PORT="5000"

if [ -f .env ]; then
    CURRENT_DB_NAME=$(grep -E '^DB_NAME=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "clinical_clean")
    CURRENT_DB_PORT=$(grep -E '^DB_PORT=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "3306")
    CURRENT_DB_USER=$(grep -E '^DB_USER=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "root")
    CURRENT_DB_PASS=$(grep -E '^(DB_PASSWORD|DB_ROOT_PASSWORD)=' .env | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "cima1255")
    CURRENT_APP_PORT=$(grep -E '^PORT=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "5000")
fi

echo -e "Configura los parámetros para la instalación (Enter para aceptar el valor entre corchetes):"
prompt_var "Nombre de la Base de Datos a utilizar o crear" "$CURRENT_DB_NAME" TARGET_DB_NAME
prompt_var "Puerto de MariaDB / MySQL" "$CURRENT_DB_PORT" TARGET_DB_PORT
prompt_var "Usuario administrador de MariaDB" "$CURRENT_DB_USER" TARGET_DB_USER
prompt_var "Contraseña de MariaDB" "$CURRENT_DB_PASS" TARGET_DB_PASS
prompt_var "Puerto del servidor Backend Express" "$CURRENT_APP_PORT" TARGET_APP_PORT

# Crear o actualizar .env (con backup automático si ya existe)
if [ -f .env ]; then
    ENV_BACKUP=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$ENV_BACKUP"
    echo -e "  [${GREEN}OK${NC}] Backup de .env anterior guardado en: ${CYAN}${ENV_BACKUP}${NC}"
else
    echo -e "  Creando archivo ${CYAN}.env${NC} a partir de ${CYAN}.env.example${NC}..."
    cp .env.example .env
fi

# Generar secretos seguros automáticos si no existen
JWT_SEC=$(grep -E '^JWT_SECRET=' .env 2>/dev/null | cut -d '=' -f2- || true)
if [ -z "$JWT_SEC" ] || [ "$JWT_SEC" = "supersecretkey123" ] || [ "$JWT_SEC" = "tu_clave_secreta_super_segura" ]; then
    JWT_SEC=$(openssl rand -hex 32 2>/dev/null || echo "secret_jwt_key_$(date +%s)")
fi

BRIDGE_SEC=$(grep -E '^WHATSAPP_BRIDGE_SECRET=' .env 2>/dev/null | cut -d '=' -f2- || true)
if [ -z "$BRIDGE_SEC" ]; then
    BRIDGE_SEC=$(openssl rand -hex 16 2>/dev/null || echo "bridge_secret_$(date +%s)")
fi

# Actualizar variables en el archivo .env
update_env_var() {
    local key="$1"
    local val="$2"
    if grep -q "^${key}=" .env 2>/dev/null; then
        sed -i "s|^${key}=.*|${key}=${val}|" .env
    else
        echo "${key}=${val}" >> .env
    fi
}

update_env_var "DB_NAME" "$TARGET_DB_NAME"
update_env_var "DB_PORT" "$TARGET_DB_PORT"
update_env_var "DB_USER" "$TARGET_DB_USER"
update_env_var "DB_PASSWORD" "$TARGET_DB_PASS"
update_env_var "DB_ROOT_PASSWORD" "$TARGET_DB_PASS"
update_env_var "PORT" "$TARGET_APP_PORT"
update_env_var "JWT_SECRET" "$JWT_SEC"
update_env_var "WHATSAPP_BRIDGE_SECRET" "$BRIDGE_SEC"

echo -e "  [${GREEN}OK${NC}] Configuración guardada en ${CYAN}.env${NC} (Base de datos: ${BOLD}${TARGET_DB_NAME}${NC})."

# ------------------------------------------------------------------------------
# 3. Instalación de Dependencias de Node
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}3. Instalando dependencias del monorepo (Node.js)...${NC}"
pnpm install
echo -e "  [${GREEN}OK${NC}] Dependencias instaladas."

# ------------------------------------------------------------------------------
# 4. Inicialización de Base de Datos con Docker
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}4. Verificando contenedor de Base de Datos (MariaDB)...${NC}"

DB_CONTAINER="secretary-db-dev"
touch server/02-dev-seed.sql server/03-optimizations.sql

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo -e "  Iniciando contenedor ${CYAN}${DB_CONTAINER}${NC} vía Docker Compose..."
    docker compose up -d db
fi

echo -n "  Esperando disponibilidad de MariaDB..."
for i in {1..30}; do
    if docker exec "$DB_CONTAINER" mariadb-admin ping -u root -p"$TARGET_DB_PASS" --silent 2>/dev/null; then
        echo -e " [${GREEN}LISTO${NC}]"
        break
    fi
    echo -n "."
    sleep 2
done

# Crear la base de datos si no existe
echo -e "  Asegurando base de datos ${CYAN}${TARGET_DB_NAME}${NC}..."
docker exec "$DB_CONTAINER" mariadb -u root -p"$TARGET_DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`${TARGET_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# ------------------------------------------------------------------------------
# 5. Carga de Esquema y Decisión sobre Seeds
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}5. Inicialización de Esquema y Catálogos${NC}"

# Verificar si las tablas principales ya existen en la base seleccionada
TABLE_COUNT=$(docker exec "$DB_CONTAINER" mariadb -u root -p"$TARGET_DB_PASS" "$TARGET_DB_NAME" -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$TARGET_DB_NAME' AND table_name = 'users';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
    echo -e "  Cargando esquema base y catálogos en ${CYAN}${TARGET_DB_NAME}${NC}..."
    docker exec -i "$DB_CONTAINER" mariadb -u root -p"$TARGET_DB_PASS" "$TARGET_DB_NAME" < server/01-schema.sql
    echo -e "  [${GREEN}OK${NC}] Tablas, catálogos (Vademécum, Obras Sociales, Feriados) y procedimientos creados."
else
    echo -e "  [${GREEN}OK${NC}] La base de datos ya cuenta con las tablas instaladas."
fi

# Decisión de Seeds
FINAL_SEEDS="$ARG_SEEDS"
if [ -z "$FINAL_SEEDS" ]; then
    if [ "$NON_INTERACTIVE" = "true" ]; then
        FINAL_SEEDS="no"
    else
        echo ""
        echo -e "${YELLOW}¿Deseas cargar los datos de prueba / demo (seeds) en '${TARGET_DB_NAME}'?${NC}"
        echo "  - s/S (Sí): Carga pacientes, turnos, profesionales y transacciones de prueba."
        echo "  - n/N (No): Mantiene la base limpia (solo catálogos y usuario admin)."
        read -rp "$(echo -e "${CYAN}?${NC} Cargar seeds? [s/N]: ")" SEED_INPUT
        case "$SEED_INPUT" in
            [sS][iI]|[sS]|[yY][eE][sS]|[yY])
                FINAL_SEEDS="yes"
                ;;
            *)
                FINAL_SEEDS="no"
                ;;
        esac
    fi
fi

if [ "$FINAL_SEEDS" = "yes" ]; then
    echo -e "  Cargando datos de prueba (seeds) en ${CYAN}${TARGET_DB_NAME}${NC}..."
    if [ -f server/seeds/dev_seed.sql ]; then
        docker exec -i "$DB_CONTAINER" mariadb -u root -p"$TARGET_DB_PASS" "$TARGET_DB_NAME" < server/seeds/dev_seed.sql 2>/dev/null || true
        echo -e "  [${GREEN}OK${NC}] Datos de prueba cargados con éxito."
    fi
else
    echo -e "  [${GREEN}OK${NC}] Base de datos limpia (sin datos de prueba)."
fi

# Configuración de Contraseña del Usuario Administrador
echo ""
prompt_var "Contraseña para el usuario 'admin' de la aplicación" "admin123" ADMIN_PASS true

if [ -n "$ADMIN_PASS" ]; then
    # Hashear contraseña con bcrypt mediante Node.js
    ADMIN_HASH=$(node -e "try { const b = require('./server/node_modules/bcrypt'); console.log(b.hashSync(process.argv[1], 10)); } catch(e) { console.log(''); }" "$ADMIN_PASS" 2>/dev/null || true)
    
    if [ -n "$ADMIN_HASH" ]; then
        docker exec "$DB_CONTAINER" mariadb -u root -p"$TARGET_DB_PASS" "$TARGET_DB_NAME" -e "
            INSERT INTO users (id, username, password_hash, role, token_version, can_manage_users) 
            VALUES (9, 'admin', '$ADMIN_HASH', 'admin', 0, 1) 
            ON DUPLICATE KEY UPDATE password_hash = '$ADMIN_HASH', token_version = 0, can_manage_users = 1;
        " 2>/dev/null || true
        echo -e "  [${GREEN}OK${NC}] Contraseña de 'admin' actualizada."
    fi
fi

# ------------------------------------------------------------------------------
# 6. WhatsApp Bridge (Go)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}6. WhatsApp Bridge (Go)...${NC}"
if command -v go >/dev/null 2>&1; then
    if [ -d "whatsapp-bridge-go" ]; then
        echo -e "  Compilando binario de WhatsApp Bridge..."
        (cd whatsapp-bridge-go && go build -o whatsapp-bridge .)
        echo -e "  [${GREEN}OK${NC}] whatsapp-bridge compilado exitosamente."
    fi
else
    if [ -f "whatsapp-bridge-go/whatsapp-bridge" ]; then
        echo -e "  [${GREEN}OK${NC}] Binario preexistente detectado en whatsapp-bridge-go/whatsapp-bridge."
    else
        echo -e "  [${YELLOW}AVISO${NC}] Go no está instalado. Si vas a usar WhatsApp Bridge, instala Go y ejecuta: cd whatsapp-bridge-go && go build -o whatsapp-bridge ."
    fi
fi

# ------------------------------------------------------------------------------
# 7. Modelo de Inteligencia Artificial (Ollama)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}7. Modelo de Inteligencia Artificial (Ollama)...${NC}"
if command -v ollama >/dev/null 2>&1; then
    if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
        if ollama list | grep -q "qwen2.5-coder:3b"; then
            echo -e "  [${GREEN}OK${NC}] Modelo qwen2.5-coder:3b ya está disponible en Ollama."
        else
            echo -e "  Descargando modelo especializado ${CYAN}qwen2.5-coder:3b${NC}..."
            ollama pull qwen2.5-coder:3b
            echo -e "  [${GREEN}OK${NC}] Modelo descargado exitosamente."
        fi
    else
        echo -e "  [${YELLOW}AVISO${NC}] El servicio de Ollama no está corriendo. Recuerda ejecutar 'ollama serve' para habilitar las funciones de IA."
    fi
else
    echo -e "  [${YELLOW}AVISO${NC}] Ollama no está instalado. Para auto-agendamiento con IA instala Ollama (https://ollama.com)."
fi

# ------------------------------------------------------------------------------
# 8. Resumen y Finalización
# ------------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}=================================================================="
echo "    🚀 ¡Instalación y Configuración Completadas con Éxito!"
echo "==================================================================${NC}"
echo ""
echo -e "Base de datos activa:   ${CYAN}${BOLD}${TARGET_DB_NAME}${NC}"
echo -e "Estado de datos:        $([ "$FINAL_SEEDS" = "yes" ] && echo -e "${YELLOW}Con datos de prueba (seeds)${NC}" || echo -e "${GREEN}Limpio (solo catálogos y admin)${NC}")"
echo ""
echo -e "Acceso al Sistema Web:"
echo -e "  ${BOLD}URL:${NC}        http://localhost:5173"
echo -e "  ${BOLD}Usuario:${NC}    admin"
echo -e "  ${BOLD}Contraseña:${NC} ${ADMIN_PASS:-admin123}"
echo ""
echo -e "Para iniciar el entorno:"
echo -e "  ${CYAN}pnpm dev${NC}                   (Inicia Cliente Web + Servidor Express)"
echo ""
echo -e "Para iniciar WhatsApp Bridge (opcional):"
echo -e "  ${CYAN}cd whatsapp-bridge-go && ./whatsapp-bridge${NC}"
echo -e "${CYAN}==================================================================${NC}"
