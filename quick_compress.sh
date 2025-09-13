#!/bin/bash

# Quick compression script - minimal version
PROJECT_NAME=$(basename "$(pwd)")
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="${PROJECT_NAME}_${TIMESTAMP}.tar.gz"

echo "Compressing project to: $ARCHIVE_NAME"

tar --exclude='node_modules' \
    --exclude='venv' \
    --exclude='.next' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.DS_Store' \
    --exclude='*.log' \
    --exclude='*.tar.gz' \
    -czf "$ARCHIVE_NAME" .

echo "Archive created: $ARCHIVE_NAME"
echo "Size: $(du -h "$ARCHIVE_NAME" | cut -f1)"
