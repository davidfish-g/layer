#!/bin/bash

# GCP Resource Setup Script for Video Processing
# Run this before deploying to ensure all resources exist

set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
    echo "📋 Loading configuration from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Configuration with defaults (can be overridden by environment variables)
PROJECT_ID="${GCP_PROJECT_ID:-layerid}"
REGION="${GCP_REGION:-us-central1}"
PUBSUB_TOPIC="${PUBSUB_TOPIC:-video-processing-topic}"
PUBSUB_SUBSCRIPTION="${PUBSUB_SUBSCRIPTION:-video-processing-subscription}"
GCS_BUCKET="${GCS_BUCKET:-layer-storage-bucket}"
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-video-processor-sa}"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🏗️ Setting up GCP resources with the following configuration:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Pub/Sub Topic: ${PUBSUB_TOPIC}"
echo "  Pub/Sub Subscription: ${PUBSUB_SUBSCRIPTION}"
echo "  GCS Bucket: ${GCS_BUCKET}"
echo "  Service Account: ${SERVICE_ACCOUNT_NAME}"
echo ""

# Validate required configuration
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: GCP_PROJECT_ID is required. Set it in .env or as environment variable."
    exit 1
fi

# Check if gcloud is authenticated and project is set
echo "🔐 Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with gcloud first:"
    echo "   gcloud auth login"
    echo "   gcloud config set project ${PROJECT_ID}"
    exit 1
fi

# Set the project
gcloud config set project ${PROJECT_ID}

# 1. Enable required APIs
echo "📡 Enabling required GCP APIs..."
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  pubsub.googleapis.com \
  storage.googleapis.com \
  sqladmin.googleapis.com \
  --project=${PROJECT_ID}

# 2. Create Pub/Sub topic if it doesn't exist
echo "📨 Setting up Pub/Sub topic: ${PUBSUB_TOPIC}..."
if gcloud pubsub topics describe ${PUBSUB_TOPIC} --project=${PROJECT_ID} >/dev/null 2>&1; then
    echo "✅ Topic '${PUBSUB_TOPIC}' already exists"
else
    gcloud pubsub topics create ${PUBSUB_TOPIC} --project=${PROJECT_ID}
    echo "✅ Created topic '${PUBSUB_TOPIC}'"
fi

# 3. Create Pub/Sub subscription if it doesn't exist
echo "📥 Setting up Pub/Sub subscription: ${PUBSUB_SUBSCRIPTION}..."
if gcloud pubsub subscriptions describe ${PUBSUB_SUBSCRIPTION} --project=${PROJECT_ID} >/dev/null 2>&1; then
    echo "✅ Subscription '${PUBSUB_SUBSCRIPTION}' already exists"
else
    gcloud pubsub subscriptions create ${PUBSUB_SUBSCRIPTION} \
      --topic=${PUBSUB_TOPIC} \
      --project=${PROJECT_ID}
    echo "✅ Created subscription '${PUBSUB_SUBSCRIPTION}'"
fi

# 4. Create/verify GCS bucket
echo "🪣 Setting up GCS bucket: ${GCS_BUCKET}..."
if gcloud storage buckets describe gs://${GCS_BUCKET} --project=${PROJECT_ID} >/dev/null 2>&1; then
    echo "✅ Bucket 'gs://${GCS_BUCKET}' already exists"
else
    echo "📦 Creating GCS bucket..."
    gcloud storage buckets create gs://${GCS_BUCKET} \
      --project=${PROJECT_ID} \
      --location=${REGION} \
      --uniform-bucket-level-access
    # Make bucket publicly readable for result videos
    gcloud storage buckets add-iam-policy-binding gs://${GCS_BUCKET} \
      --member=allUsers \
      --role=roles/storage.objectViewer
    echo "✅ Created bucket 'gs://${GCS_BUCKET}'"
fi

# 5. Create service account for Cloud Run
echo "👤 Setting up service account: ${SERVICE_ACCOUNT_NAME}..."
if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_EMAIL} --project=${PROJECT_ID} >/dev/null 2>&1; then
    echo "✅ Service account '${SERVICE_ACCOUNT_NAME}' already exists"
else
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
      --display-name="Video Processor Service Account" \
      --description="Service account for AI video processing workers" \
      --project=${PROJECT_ID}
    echo "✅ Created service account '${SERVICE_ACCOUNT_NAME}'"
fi

# 6. Grant necessary permissions to service account
echo "🔐 Setting up IAM permissions..."
ROLES=(
    "roles/pubsub.subscriber"
    "roles/storage.objectAdmin"
    "roles/cloudsql.client"
)

for role in "${ROLES[@]}"; do
    echo "  Granting ${role}..."
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
      --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
      --role="${role}" \
      --quiet
done

# 7. Create service account key if it doesn't exist
SERVICE_ACCOUNT_KEY_FILE="service-account.json"
if [ ! -f "${SERVICE_ACCOUNT_KEY_FILE}" ]; then
    echo "🔑 Creating service account key file..."
    gcloud iam service-accounts keys create ${SERVICE_ACCOUNT_KEY_FILE} \
      --iam-account=${SERVICE_ACCOUNT_EMAIL} \
      --project=${PROJECT_ID}
    echo "✅ Created ${SERVICE_ACCOUNT_KEY_FILE}"
else
    echo "✅ Service account key file already exists: ${SERVICE_ACCOUNT_KEY_FILE}"
fi

echo ""
echo "✅ GCP resources setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Pub/Sub Topic: ${PUBSUB_TOPIC}"
echo "  Pub/Sub Subscription: ${PUBSUB_SUBSCRIPTION}"
echo "  GCS Bucket: gs://${GCS_BUCKET}"
echo "  Service Account: ${SERVICE_ACCOUNT_EMAIL}"
echo "  Service Account Key: ${SERVICE_ACCOUNT_KEY_FILE}"
echo ""
echo "🔑 Service account has the following permissions:"
echo "  • Pub/Sub Subscriber (receive processing jobs)"
echo "  • Storage Object Admin (upload/download videos)"
echo "  • Cloud SQL Client (database access)"
echo ""
echo "🚀 Ready for deployment! Run:"
echo "  ./deploy-cloud.sh" 