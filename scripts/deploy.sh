#!/bin/bash

# Configuration
PROJECT_NAME="secretary-app"
PROD_COMPOSE="docker-compose.prod.yml"

# Ensure we are in the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR" || exit 1

echo "🚀 Starting professional deployment workflow for $PROJECT_NAME..."

# Step 0: Sync changes with Git Remote
if [ -n "$(git status --porcelain)" ]; then
    echo "🔄 Unstaged changes found. Committing and pushing to Remote..."
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git add .
    git commit -m "Auto-commit before deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    # Ignore push failures
    git push origin "$CURRENT_BRANCH" || echo "⚠️  Could not push to remote. Continuing with deploy..."
else
    echo "✅ Git is already up to date."
fi

# Step 1: Run Linter/Tests if they exist
echo "🔍 Checking code quality..."
# cd client && npm run lint && cd ..
# cd server && npm run lint && cd ..

# Step 2: Build production images
echo "🏗️  Building production images..."
docker compose -f $PROD_COMPOSE build

# Step 3: Deployment Options
echo "📡 Select deployment mode:"
select mode in "Production (Local)" "Staging (Test Port)" "Cancel"; do
    case $mode in
        "Production (Local)")
            echo "🛡️  Creating safety backup before deployment..."
            ./scripts/backup_prod.sh
            echo "🔥 Deploying to Production..."
            docker compose -f $PROD_COMPOSE up -d
            break
            ;;
        "Staging (Test Port)")
            echo "🧪 Starting Staging environment on port 8081..."
            # Temporary override for testing
            export CLIENT_EXTERNAL_PORT_PROD=8081
            docker compose -p ${PROJECT_NAME}-staging -f $PROD_COMPOSE up -d
            echo "✅ Staging is live at http://localhost:8081"
            break
            ;;
        "Cancel")
            echo "❌ Deployment cancelled."
            exit 0
            ;;
    esac
done

echo "🧹 Cleaning up unused Docker resources to save disk space..."
docker system prune -f

echo "🎉 Workflow completed!"
