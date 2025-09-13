#!/bin/bash

# ============================================================================
# PROJECT COMPRESSION SCRIPT
# ============================================================================
# This script compresses the entire project directory while excluding
# common module files, build artifacts, and other unnecessary files.
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the current directory name for the archive
PROJECT_NAME=$(basename "$(pwd)")
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="${PROJECT_NAME}_${TIMESTAMP}.tar.gz"

print_status "Starting project compression..."
print_status "Project: $PROJECT_NAME"
print_status "Archive: $ARCHIVE_NAME"

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "This doesn't appear to be the project root directory."
    print_error "Please run this script from the tarazoo project root."
    exit 1
fi

# Create a temporary file to store exclusion patterns
EXCLUDE_FILE=$(mktemp)

# Define exclusion patterns
cat > "$EXCLUDE_FILE" << 'EXCLUDE_PATTERNS'
# Node.js modules
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm
.yarn-integrity

# Python virtual environments
venv/
env/
.venv/
.env/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
pip-log.txt
pip-delete-this-directory.txt

# Build artifacts
.next/
out/
build/
dist/
*.tgz
*.tar.gz

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Coverage and test artifacts
coverage/
.nyc_output/
.coverage
htmlcov/

# Temporary files
tmp/
temp/
.tmp/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Git (optional - uncomment if you want to exclude .git)
# .git/
# .gitignore

# Docker (optional - uncomment if you want to exclude Docker files)
# Dockerfile
# docker-compose.yml
# .dockerignore
EXCLUDE_PATTERNS

print_status "Exclusion patterns created"

# Create the archive
print_status "Creating compressed archive..."

if tar --exclude-from="$EXCLUDE_FILE" \
       --exclude="$ARCHIVE_NAME" \
       -czf "$ARCHIVE_NAME" \
       .; then
    print_success "Archive created successfully: $ARCHIVE_NAME"
else
    print_error "Failed to create archive"
    rm -f "$EXCLUDE_FILE"
    exit 1
fi

# Clean up temporary file
rm -f "$EXCLUDE_FILE"

# Get archive size
ARCHIVE_SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)
print_success "Archive size: $ARCHIVE_SIZE"

# Show what was included/excluded
print_status "Archive contents:"
tar -tzf "$ARCHIVE_NAME" | head -20
if [ $(tar -tzf "$ARCHIVE_NAME" | wc -l) -gt 20 ]; then
    echo "... and $(( $(tar -tzf "$ARCHIVE_NAME" | wc -l) - 20 )) more files"
fi

echo ""
print_success "Compression complete!"
print_status "Archive location: $(pwd)/$ARCHIVE_NAME"
print_status "You can extract it with: tar -xzf $ARCHIVE_NAME"

# Optional: Show excluded directories that were found
print_status "Checking for excluded directories in project..."
EXCLUDED_DIRS=()
for dir in node_modules venv env .next out build dist; do
    if [ -d "$dir" ]; then
        EXCLUDED_DIRS+=("$dir")
    fi
done

if [ ${#EXCLUDED_DIRS[@]} -gt 0 ]; then
    print_warning "Excluded directories found: ${EXCLUDED_DIRS[*]}"
    print_warning "These were not included in the archive (as intended)"
fi

echo ""
print_status "Script completed successfully!"
