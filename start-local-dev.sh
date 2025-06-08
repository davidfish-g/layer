#!/bin/bash

# Local Development Startup Script
# This script sets up the proper environment for local development

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo ""
log_info "🚀 Starting Layer Local Development Environment"
echo ""

# Check if Cloud SQL Proxy is installed
if ! command -v cloud-sql-proxy &> /dev/null; then
    log_warning "Cloud SQL Proxy not found. Installing..."
    
    # Check if we're on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install cloud-sql-proxy
        else
            log_warning "Please install Homebrew first or manually install Cloud SQL Proxy"
            echo "Manual installation: https://cloud.google.com/sql/docs/postgres/sql-proxy"
            exit 1
        fi
    else
        log_warning "Please install Cloud SQL Proxy manually"
        echo "Installation guide: https://cloud.google.com/sql/docs/postgres/sql-proxy"
        exit 1
    fi
fi

log_success "Cloud SQL Proxy is available"

# Check if service account exists
if [ ! -f "service-account.json" ]; then
    log_warning "service-account.json not found"
    echo "Please ensure your service account JSON is in the project root"
    exit 1
fi

log_success "Service account found"

# Start Cloud SQL Proxy in the background
log_info "Starting Cloud SQL Proxy..."
cloud-sql-proxy layerid:us-central1:layer-db \
    --credentials-file=service-account.json \
    --port=5432 \
    --quiet &

PROXY_PID=$!
echo $PROXY_PID > .cloud-sql-proxy.pid

log_success "Cloud SQL Proxy started (PID: $PROXY_PID)"

# Wait for proxy to be ready
log_info "Waiting for database connection..."
sleep 3

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
fi

# Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate

# Start the development server
log_info "Starting Next.js development server..."
log_success "🌐 Your app will be available at http://localhost:3000"
echo ""
echo "📋 Development environment ready:"
echo "  • Database: Connected via Cloud SQL Proxy"
echo "  • Authentication: Google OAuth configured"
echo "  • Storage: Google Cloud Storage"
echo "  • Worker: Cloud Run service"
echo ""
echo "🛑 To stop: Ctrl+C (this will also stop the database proxy)"

# Cleanup function
cleanup() {
    if [ -f .cloud-sql-proxy.pid ]; then
        PROXY_PID=$(cat .cloud-sql-proxy.pid)
        log_info "Stopping Cloud SQL Proxy (PID: $PROXY_PID)..."
        kill $PROXY_PID 2>/dev/null || true
        rm .cloud-sql-proxy.pid
        log_success "Cloud SQL Proxy stopped"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Start the Next.js dev server
npm run dev 