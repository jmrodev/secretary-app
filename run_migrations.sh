#!/bin/bash
set -e

# Configuration
CONTAINER_NAME="secretary-db-dev"
DB_USER="root"
DB_PASS="cima1255"
DB_NAME="clinical_management"
MIGRATIONS_DIR="server/scripts/migrations"

echo "🚀 Starting database migrations..."

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: docker command not found."
    exit 1
fi

# Check if the container is running
if [ "$(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME 2>/dev/null)" != "true" ]; then
    echo "❌ Error: Container '$CONTAINER_NAME' is not running."
    echo "Please start the database container first with: docker compose up -d db"
    exit 1
fi

# Run the single consolidated migration file
echo "👉 Applying consolidated migrations..."
docker exec -i "$CONTAINER_NAME" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$MIGRATIONS_DIR/consolidated_migrations.sql"

echo "✅ All migrations applied successfully!"
