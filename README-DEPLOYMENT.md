# 🚀 Layer AI Deployment Guide

## **Architecture Overview**

Your Layer AI video processing application has **two main components**:

```
🌐 Frontend (Next.js Web App)           🤖 Backend (Video Processor Worker)
├── User interface                      ├── AI video processing
├── Google OAuth login                  ├── Face swapping
├── Video upload                        ├── Voice cloning  
├── Job management                      ├── Background processing
└── API routes                          └── Pub/Sub integration

📱 Users visit Frontend → Submit jobs → Backend processes → Results stored
```

## **Deployment Scripts**

### **1. `setup-gcp-resources.sh` - Infrastructure Setup**
**Run this FIRST** (only once or when adding new resources)

**What it creates:**
- ✅ Pub/Sub topics and subscriptions for job queuing
- ✅ Google Cloud Storage bucket for video files  
- ✅ Service accounts with proper permissions
- ✅ Enables required Google Cloud APIs

**When to run:**
- Initial setup
- Adding new team members
- Recreating infrastructure

```bash
./setup-gcp-resources.sh
```

### **2. `deploy-cloud.sh` - Backend Worker Deployment**
**Deploy the AI video processing worker**

**What it deploys:**
- ✅ Video processing worker (Python + Node.js)
- ✅ AI models for face swapping and voice cloning
- ✅ Background job processing from Pub/Sub queue
- ✅ Runs on Google Cloud Run (scales automatically)

**When to run:**
- Initial backend deployment
- Updating AI processing logic
- Scaling worker capacity

```bash
./deploy-cloud.sh
```

### **3. `deploy-frontend.sh` - Website Deployment**
**Deploy the user-facing website**

**What it deploys:**
- ✅ Next.js web application
- ✅ Google OAuth authentication
- ✅ Video upload interface
- ✅ Job status monitoring
- ✅ User dashboard

**When to run:**
- Initial frontend deployment  
- Updating UI/UX
- Adding new features

```bash
./deploy-frontend.sh
```

## **🎯 Complete Deployment Process**

### **First Time Setup:**
```bash
# 1. Set up infrastructure
./setup-gcp-resources.sh

# 2. Deploy backend worker
./deploy-cloud.sh

# 3. Deploy frontend website
./deploy-frontend.sh
```

### **Updates:**
```bash
# Update backend only
./deploy-cloud.sh

# Update frontend only  
./deploy-frontend.sh

# Both (in order)
./deploy-cloud.sh && ./deploy-frontend.sh
```

## **🔧 Configuration**

All scripts read from `.env` file. Required variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication  
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Google Cloud
GCP_PROJECT_ID="layerid"
GCS_BUCKET="layer-storage-bucket"
PUBSUB_TOPIC="video-processing-topic"
PUBSUB_SUBSCRIPTION="video-processing-subscription"

# AI Services
ELEVENLABS_API_KEY="..."
```

## **🌐 After Deployment**

Your site will be live at:
```
Frontend: https://layer-frontend-xxxxx-uc.a.run.app
Backend:  https://video-processor-xxxxx-uc.a.run.app
```

## **📊 Monitoring**

```bash
# Frontend logs
gcloud logs tail --project=layerid --filter='resource.labels.service_name=layer-frontend'

# Backend logs  
gcloud logs tail --project=layerid --filter='resource.labels.service_name=video-processor'

# Storage usage
gcloud storage du gs://layer-storage-bucket --summarize
```

## **💡 Troubleshooting**

**Common Issues:**

1. **"Worker service not found"** → Deploy backend first: `./deploy-cloud.sh`
2. **"Database connection failed"** → Check `DATABASE_URL` in `.env`
3. **"Authentication error"** → Verify Google OAuth credentials
4. **"Build failed"** → Check Docker build logs and machine types

**Cost Optimization:**
- Frontend auto-scales to 0 when not used
- Backend processes jobs on-demand
- Storage costs scale with usage 