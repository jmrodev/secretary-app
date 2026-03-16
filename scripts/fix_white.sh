#!/bin/bash
TARGET_DIR="/home/cima/Documentos/secretary-app/client/src"
echo "Fixing hardcoded white backgrounds in $TARGET_DIR..."

find "$TARGET_DIR" -type f -name "*.css" -exec sed -i 's/background: white;/background: var(--white);/g' {} +
find "$TARGET_DIR" -type f -name "*.css" -exec sed -i 's/background-color: white;/background-color: var(--white);/g' {} +
find "$TARGET_DIR" -type f -name "*.css" -exec sed -i 's/background: #fff;/background: var(--white);/g' {} +
find "$TARGET_DIR" -type f -name "*.css" -exec sed -i 's/background-color: #fff;/background-color: var(--white);/g' {} +
find "$TARGET_DIR" -type f -name "*.css" -exec sed -i 's/background: #ffffff;/background: var(--white);/g' {} +
find "$TARGET_DIR" -type f -name "*.css" -exec sed -i 's/background-color: #ffffff;/background-color: var(--white);/g' {} +

echo "Done!"
