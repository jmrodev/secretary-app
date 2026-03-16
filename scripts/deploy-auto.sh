#!/bin/bash

# Automatic deployment script (non-interactive)
# This script builds and deploys to production without user prompts

PROJECT_NAME="secretary-app"
PROD_COMPOSE="docker-compose.prod.yml"

# Ensure we are in the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR" || exit 1

echo "🚀 Starting automatic deployment to production..."

# Step 0: Sync changes with Git Remote
if [ -n "$(git status --porcelain)" ]; then
    echo "🔄 Unstaged changes found. Committing and pushing to Remote..."
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git add .
    git commit -m "Auto-commit before deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    # Ignore push failures (e.g. if authentication is required or no upstream)
    git push origin "$CURRENT_BRANCH" || echo "⚠️  Could not push to remote. Continuing with deploy..."
else
    echo "✅ Git is already up to date."
fi

# Step 1: Build production images
echo "🏗️  Building production images..."
docker compose -f $PROD_COMPOSE build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Step 2: Create backup
echo "🛡️  Creating safety backup before deployment..."
./scripts/backup_prod.sh

if [ $? -ne 0 ]; then
    echo "⚠️  Backup failed, but continuing with deployment..."
fi

# Step 3: Deploy to production
echo "🔥 Deploying to Production..."
docker compose -f $PROD_COMPOSE up -d

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed."
    exit 1
fi

# Step 4: Cleanup
echo "🧹 Cleaning up unused Docker resources to save disk space..."
docker system prune -f

echo "🎉 Deployment completed successfully!"
echo "✅ Application is now running in production."
