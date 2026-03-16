#!/bin/bash
TARGET_DIR="/home/cima/Documentos/secretary-app/client/src/components"
echo "Fixing tables in $TARGET_DIR..."

find "$TARGET_DIR" -type f -name "*.jsx" -exec sed -i 's/<table className="\([^"]*\)"/&/g' {} + # touch
# Replace static classNames
find "$TARGET_DIR" -type f -name "*.jsx" -exec sed -i 's/<table className="\([^"} table-base]*\)"/<table className="\1 table-base"/g' {} +

echo "Done!"
