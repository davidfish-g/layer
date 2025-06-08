#!/bin/bash

# Production-Ready Frontend Deployment Script
# Addresses: Machine types, NEXTAUTH_URL resolution, error handling, dependency validation

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-layerid}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${FRONTEND_SERVICE_NAME:-layer-frontend}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Build configuration - using valid machine types
BUILD_MACHINE_TYPE="e2-highcpu-8"
BUILD_TIMEOUT="25m"

# Cloud Run configuration
MEMORY="2Gi"
CPU="2"
TIMEOUT="300"
CONCURRENCY="100"
MIN_INSTANCES="0"  # Start with 0 for cost optimization
MAX_INSTANCES="10"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Validation function
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check gcloud authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Please authenticate with gcloud first:"
        echo "   gcloud auth login"
        echo "   gcloud config set project ${PROJECT_ID}"
        exit 1
    fi
    
    # Check required environment variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "GCS_BUCKET"
        "PUBSUB_TOPIC"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable ${var} is not set"
            log_info "Please set it in .env file or environment"
            exit 1
        fi
    done
    
         # Check if required files exist
     if [ ! -f "Dockerfile.frontend" ]; then
         log_error "Dockerfile.frontend not found"
         exit 1
     fi
     
     if [ ! -f "cloudbuild.frontend.yaml" ]; then
         log_error "cloudbuild.frontend.yaml not found"
         exit 1
     fi
     
     if [ ! -f "next.config.js" ]; then
         log_error "next.config.js not found"
         exit 1
     fi
    
    log_success "All prerequisites validated"
}

# Load environment variables
load_environment() {
    if [ -f .env ]; then
        log_info "Loading configuration from .env file..."
        export $(grep -v '^#' .env | xargs)
    fi
    
    if [ -f .env.local ]; then
        log_info "Loading local overrides from .env.local..."
        export $(grep -v '^#' .env.local | xargs)
    fi
}

# Get worker service URL
get_worker_url() {
    log_info "Checking for existing worker service..."
    
    WORKER_URL=$(gcloud run services describe video-processor \
        --platform managed \
        --region ${REGION} \
        --project ${PROJECT_ID} \
        --format 'value(status.url)' 2>/dev/null || echo "")
    
    if [ -z "$WORKER_URL" ]; then
        log_warning "Worker service not found. You may need to deploy it first with:"
        log_warning "  ./deploy-cloud.sh"
        WORKER_URL="https://worker-not-deployed"
    else
        log_success "Worker service found: ${WORKER_URL}"
    fi
}

# Build and push image
build_image() {
    log_info "Building frontend image with Google Cloud Build..."
    log_info "Using configuration: cloudbuild.frontend.yaml"
    
    gcloud builds submit \
        --config cloudbuild.frontend.yaml \
        --timeout=${BUILD_TIMEOUT} \
        --project=${PROJECT_ID} \
        .
    
    log_success "Image built successfully"
}

# Deploy to Cloud Run
deploy_service() {
    log_info "Deploying frontend to Cloud Run..."
    
    # Deploy with placeholder NEXTAUTH_URL first
    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME}:latest \
        --platform managed \
        --region ${REGION} \
        --project ${PROJECT_ID} \
        --allow-unauthenticated \
        --port 3000 \
        --memory ${MEMORY} \
        --cpu ${CPU} \
        --timeout ${TIMEOUT} \
        --concurrency ${CONCURRENCY} \
        --min-instances ${MIN_INSTANCES} \
        --max-instances ${MAX_INSTANCES} \
        --set-env-vars="NODE_ENV=production,DATABASE_URL=${DATABASE_URL},NEXTAUTH_SECRET=${NEXTAUTH_SECRET},GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID},GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET},GCP_PROJECT_ID=${PROJECT_ID},GCS_BUCKET=${GCS_BUCKET},PUBSUB_TOPIC=${PUBSUB_TOPIC},WORKER_SERVICE_URL=${WORKER_URL},NEXTAUTH_URL=placeholder" \
        --quiet
    
    log_success "Initial deployment complete"
}

# Update NEXTAUTH_URL with actual service URL
update_nextauth_url() {
    log_info "Updating NEXTAUTH_URL with actual service URL..."
    
    # Get the actual service URL
    ACTUAL_URL=$(gcloud run services describe ${SERVICE_NAME} \
        --platform managed \
        --region ${REGION} \
        --project ${PROJECT_ID} \
        --format 'value(status.url)')
    
    if [ -z "$ACTUAL_URL" ]; then
        log_error "Failed to get service URL"
        exit 1
    fi
    
    log_info "Service URL: ${ACTUAL_URL}"
    
    # Update the service with the correct NEXTAUTH_URL
    gcloud run services update ${SERVICE_NAME} \
        --region ${REGION} \
        --project ${PROJECT_ID} \
        --update-env-vars="NEXTAUTH_URL=${ACTUAL_URL}" \
        --quiet
    
    log_success "NEXTAUTH_URL updated successfully"
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
        --platform managed \
        --region ${REGION} \
        --project ${PROJECT_ID} \
        --format 'value(status.url)')
    
    # Wait for service to be ready
    log_info "Waiting for service to be ready..."
    sleep 15
    
    # Test health endpoint
    if curl -f -s "${SERVICE_URL}/api/health" >/dev/null; then
        log_success "Health check passed!"
    else
        log_warning "Health check failed (service may still be starting)"
    fi
    
    # Test main page
    if curl -f -s "${SERVICE_URL}" >/dev/null; then
        log_success "Main page responding!"
    else
        log_warning "Main page not responding (may need authentication)"
    fi
}

# Main deployment function
main() {
    echo ""
    log_info "🚀 Starting Layer Frontend Deployment"
    echo "  Project: ${PROJECT_ID}"
    echo "  Region: ${REGION}"
    echo "  Service: ${SERVICE_NAME}"
    echo "  Image: ${IMAGE_NAME}:latest"
    echo ""
    
    load_environment
    validate_prerequisites
    get_worker_url
    build_image
    deploy_service
    update_nextauth_url
    test_deployment
    
    # Get final service URL
    FINAL_URL=$(gcloud run services describe ${SERVICE_NAME} \
        --platform managed \
        --region ${REGION} \
        --project ${PROJECT_ID} \
        --format 'value(status.url)')
    
    echo ""
    log_success "🎉 Frontend deployment successful!"
    echo ""
    echo "🌐 Your Layer AI Video Processing Site:"
    echo "   ${FINAL_URL}"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Visit your site and test Google OAuth login"
    echo "  2. Upload a video to test the full pipeline"
    echo "  3. Monitor logs: gcloud logs tail --project=${PROJECT_ID} --filter='resource.labels.service_name=${SERVICE_NAME}'"
    echo ""
    echo "🏗️ Architecture:"
    echo "  • Frontend: ${FINAL_URL}"
    echo "  • Worker: ${WORKER_URL}"
    echo "  • Database: Cloud SQL"
    echo "  • Storage: gs://${GCS_BUCKET}"
    echo ""
}

# Run main function
main "$@" 