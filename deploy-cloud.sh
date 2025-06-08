#!/bin/bash

# Cloud Deployment Script for AI Video Processing Worker
# This script deploys to Google Cloud Run

set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
    echo "📋 Loading configuration from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Configuration with defaults (can be overridden by environment variables)
PROJECT_ID="${GCP_PROJECT_ID:-layerid}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-video-processor}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-video-processor-sa}"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Cloud Run configuration
MEMORY="${CLOUD_RUN_MEMORY:-16Gi}"
CPU="${CLOUD_RUN_CPU:-4}"
TIMEOUT="${CLOUD_RUN_TIMEOUT:-3600}"
CONCURRENCY="${CLOUD_RUN_CONCURRENCY:-1}"
MIN_INSTANCES="${CLOUD_RUN_MIN_INSTANCES:-0}"
MAX_INSTANCES="${CLOUD_RUN_MAX_INSTANCES:-10}"

echo "🚀 Deploying AI Video Processor to Google Cloud Run"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Service: ${SERVICE_NAME}"
echo "  Image: ${IMAGE_NAME}:latest"
echo "  Memory: ${MEMORY}, CPU: ${CPU}, Timeout: ${TIMEOUT}s"
echo "  Scaling: ${MIN_INSTANCES}-${MAX_INSTANCES} instances"
echo ""

# Validate required configuration
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: GCP_PROJECT_ID is required. Set it in .env or as environment variable."
    exit 1
fi

# Validate required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "ELEVENLABS_API_KEY"
    "GCS_BUCKET"
    "PUBSUB_TOPIC"
    "PUBSUB_SUBSCRIPTION"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: ${var} is required. Set it in .env file."
        echo "📋 Required environment variables: ${REQUIRED_VARS[*]}"
        exit 1
    fi
done

# Check if gcloud is authenticated
echo "🔐 Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with gcloud first:"
    echo "   gcloud auth login"
    echo "   gcloud config set project ${PROJECT_ID}"
    exit 1
fi

# Set the project
gcloud config set project ${PROJECT_ID}

# 1. Build and push using Google Cloud Build (fully cloud-based)
echo "☁️ Building Docker image using Google Cloud Build..."
echo "  This builds entirely in Google's cloud infrastructure"
echo "  - Faster network for downloading AI models"
echo "  - More powerful build machines"
echo "  - No local Docker dependencies"
echo ""

gcloud builds submit \
  --tag ${IMAGE_NAME}:latest \
  --timeout=30m \
  --machine-type=e2-highcpu-8 \
  --project=${PROJECT_ID} \
  .

# 3. Prepare environment variables for deployment
ENV_VARS=""
ENV_VARS="${ENV_VARS}NODE_ENV=production,"
ENV_VARS="${ENV_VARS}GCP_PROJECT_ID=${PROJECT_ID},"
ENV_VARS="${ENV_VARS}DATABASE_URL=${DATABASE_URL},"
ENV_VARS="${ENV_VARS}ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY},"
ENV_VARS="${ENV_VARS}GCS_BUCKET=${GCS_BUCKET},"
ENV_VARS="${ENV_VARS}PUBSUB_TOPIC=${PUBSUB_TOPIC},"
ENV_VARS="${ENV_VARS}PUBSUB_SUBSCRIPTION=${PUBSUB_SUBSCRIPTION}"

# Add optional environment variables if they exist
if [ ! -z "$CLOUD_SQL_CONNECTION_STRING" ]; then
    ENV_VARS="${ENV_VARS},CLOUD_SQL_CONNECTION_STRING=${CLOUD_SQL_CONNECTION_STRING}"
fi

# Remove trailing comma
ENV_VARS=$(echo $ENV_VARS | sed 's/,$//')

# 4. Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --allow-unauthenticated \
  --port 8080 \
  --memory ${MEMORY} \
  --cpu ${CPU} \
  --timeout ${TIMEOUT} \
  --concurrency ${CONCURRENCY} \
  --min-instances ${MIN_INSTANCES} \
  --max-instances ${MAX_INSTANCES} \
  --set-env-vars="${ENV_VARS}" \
  --service-account="${SERVICE_ACCOUNT_EMAIL}" \
  --quiet

echo "✅ Deployment complete!"

# 5. Get service URL
echo "🔍 Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --format 'value(status.url)')

echo "🔗 Service URL: ${SERVICE_URL}"
echo "🏥 Health check: ${SERVICE_URL}/health"

# 6. Test health endpoint
echo "🧪 Testing health endpoint..."
sleep 10  # Give service time to start

if curl -f -s "${SERVICE_URL}/health" >/dev/null; then
    echo "✅ Health check passed!"
    echo "🎉 Deployment successful!"
else
    echo "⚠️ Health check failed (service may still be starting)"
    echo "📋 Check logs: gcloud logs tail --project=${PROJECT_ID} --filter='resource.labels.service_name=${SERVICE_NAME}'"
fi

echo ""
echo "📊 Next steps:"
echo "  1. Monitor logs:"
echo "     gcloud logs tail --project=${PROJECT_ID} --filter='resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}'"
echo ""
echo "  2. View service in console:"
echo "     https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}?project=${PROJECT_ID}"
echo ""
echo "  3. Test with a video processing job from your web app!"
echo ""
echo "⚙️ Configuration management:"
echo "  • Update scaling: gcloud run services update ${SERVICE_NAME} --min-instances=1 --max-instances=50 --region=${REGION}"
echo "  • View current config: gcloud run services describe ${SERVICE_NAME} --region=${REGION}"
echo ""
echo "💡 Monitoring:"
echo "  • View metrics: https://console.cloud.google.com/monitoring"
echo "  • Set up alerts: https://console.cloud.google.com/monitoring/alerting" 