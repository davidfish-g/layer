#!/bin/bash

# GCP Resource Setup Script for Video Processing
# Run this before deploying to ensure all resources exist

set -e

# Configuration from your .env.local
PROJECT_ID="layerid"
REGION="us-central1"
PUBSUB_TOPIC="video-processing-topic"
PUBSUB_SUBSCRIPTION="video-processing-subscription"
GCS_BUCKET="layer-storage-bucket"
SERVICE_ACCOUNT_NAME="video-processor-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🏗️ Setting up GCP resources for project: ${PROJECT_ID}"

# 1. Enable required APIs
echo "📡 Enabling required GCP APIs..."
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  pubsub.googleapis.com \
  storage.googleapis.com \
  --project=${PROJECT_ID}

# 2. Create Pub/Sub topic if it doesn't exist
echo "📨 Setting up Pub/Sub topic..."
gcloud pubsub topics create ${PUBSUB_TOPIC} --project=${PROJECT_ID} || echo "Topic already exists"

# 3. Create Pub/Sub subscription if it doesn't exist
echo "📥 Setting up Pub/Sub subscription..."
gcloud pubsub subscriptions create ${PUBSUB_SUBSCRIPTION} \
  --topic=${PUBSUB_TOPIC} \
  --project=${PROJECT_ID} || echo "Subscription already exists"

# 4. Verify GCS bucket exists
echo "🪣 Checking GCS bucket..."
gsutil ls gs://${GCS_BUCKET}/ > /dev/null 2>&1 || {
  echo "❌ GCS bucket gs://${GCS_BUCKET} not found. Creating it..."
  gsutil mb gs://${GCS_BUCKET}
  gsutil iam ch allUsers:objectViewer gs://${GCS_BUCKET}
}

# 5. Create service account for Cloud Run
echo "👤 Setting up service account..."
gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
  --display-name="Video Processor Service Account" \
  --project=${PROJECT_ID} || echo "Service account already exists"

# 6. Grant necessary permissions to service account
echo "🔐 Setting up permissions..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/pubsub.subscriber"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/cloudsql.client"

# 7. Update your .env.local with service account email
echo "📝 Your service account email: ${SERVICE_ACCOUNT_EMAIL}"

echo "✅ GCP resources setup complete!"
echo ""
echo "🔑 Make sure your service-account.json file has permissions for:"
echo "  • Pub/Sub Subscriber"
echo "  • Storage Object Admin" 
echo "  • Cloud SQL Client"
echo ""
echo "📋 Ready for deployment! Your configuration:"
echo "  Project ID: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Pub/Sub Topic: ${PUBSUB_TOPIC}"
echo "  Pub/Sub Subscription: ${PUBSUB_SUBSCRIPTION}"
echo "  GCS Bucket: ${GCS_BUCKET}"
echo "  Service Account: ${SERVICE_ACCOUNT_EMAIL}" 