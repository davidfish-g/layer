#!/bin/bash

# Cloud Deployment Script for AI Video Processing Worker
# This script deploys to Google Cloud Run

set -e

# Configuration from your .env.local
PROJECT_ID="layerid"
REGION="us-central1"
SERVICE_NAME="video-processor"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
SERVICE_ACCOUNT_EMAIL="video-processor-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🚀 Deploying AI Video Processor to Google Cloud Run"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "❌ Please authenticate with gcloud first:"
  echo "   gcloud auth login"
  echo "   gcloud config set project ${PROJECT_ID}"
  exit 1
fi

# 1. Configure Docker for GCR
echo "🔐 Configuring Docker for Google Container Registry..."
gcloud auth configure-docker --quiet

# 2. Build and push Docker image
echo "📦 Building Docker image..."
docker build -f Dockerfile -t ${IMAGE_NAME}:latest .

echo "⬆️ Pushing image to Google Container Registry..."
docker push ${IMAGE_NAME}:latest

# 3. Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 16Gi \
  --cpu 4 \
  --timeout 3600 \
  --concurrency 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="PORT=8080" \
  --set-env-vars="GCP_PROJECT_ID=layerid" \
  --set-env-vars="DATABASE_URL=postgresql://postgres:LayerDB2024!@34.121.132.193:5432/layer" \
  --set-env-vars="ELEVENLABS_API_KEY=sk_ff2fa55def0be04312c1e2075c1f0a1e1cc93b5f70b8a4e6" \
  --set-env-vars="GCS_BUCKET=layer-storage-bucket" \
  --set-env-vars="PUBSUB_TOPIC=video-processing-topic" \
  --set-env-vars="PUBSUB_SUBSCRIPTION=video-processing-subscription" \
  --service-account="${SERVICE_ACCOUNT_EMAIL}"

echo "✅ Deployment complete!"

# 4. Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --format 'value(status.url)')

echo "🔗 Service URL: ${SERVICE_URL}"
echo "🏥 Health check: ${SERVICE_URL}/health"

# 5. Test health endpoint
echo "🧪 Testing health endpoint..."
sleep 10  # Give service time to start
curl -f "${SERVICE_URL}/health" && echo "✅ Health check passed!" || echo "⚠️ Health check failed (service may still be starting)"

echo "🎉 Deployment successful!"
echo ""
echo "📊 Next steps:"
echo "  1. Monitor logs: gcloud logs tail --project=${PROJECT_ID} --filter='resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}'"
echo "  2. View service: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}?project=${PROJECT_ID}"
echo "  3. Test with a video processing job from your web app!"
echo ""
echo "💡 Scaling tips:"
echo "  • Keep warm: gcloud run services update ${SERVICE_NAME} --min-instances=1 --region=${REGION}"
echo "  • Scale up: gcloud run services update ${SERVICE_NAME} --max-instances=50 --region=${REGION}" 