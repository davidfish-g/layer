# Development Setup Guide

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- Docker & Docker Compose
- Google Cloud SDK (`gcloud` CLI)
- PostgreSQL access

### **1. Environment Setup**
```bash
# Copy environment variables
cp .env.local.example .env.local

# Edit with your actual values
nano .env.local
```

Required variables:
```bash
# Database
DATABASE_URL="postgresql://user:pass@host:port/db"

# ElevenLabs API
ELEVENLABS_API_KEY="your-elevenlabs-key"

# Google Cloud
GCP_PROJECT_ID="your-project-id"
GCS_BUCKET="your-storage-bucket"
PUBSUB_TOPIC="video-processing-topic"
PUBSUB_SUBSCRIPTION="video-processing-subscription"
```

### **2. Install Dependencies**
```bash
# Main app
npm install

# Worker dependencies
cd worker && npm install && cd ..

# Generate Prisma client
npx prisma generate
```

### **3. Database Setup**
```bash
# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### **4. Local Development**

#### **Option A: Frontend Only**
```bash
# Run Next.js development server
npm run dev
```
Visit http://localhost:3000

*Note: Jobs will be sent to Pub/Sub but won't be processed locally*

#### **Option B: Full Stack with Cloud Workers**
```bash
# 1. Deploy workers to cloud first
./setup-gcp-resources.sh
./deploy-cloud.sh

# 2. Run frontend locally
npm run dev
```
*Jobs submitted locally will be processed by cloud workers*

#### **Option C: Full Local with Docker**
```bash
# Run everything locally (requires Docker)
docker-compose up
```

## 🏗️ **Architecture**

### **Development Flow**
```
Local Frontend → Pub/Sub → Cloud Workers → Results
     ↓              ↓           ↓
   Port 3000    GCP Queue   Cloud Run
```

### **File Structure**
```
layer/
├── app/                 # Next.js app (frontend)
├── worker/              # AI processing workers
├── lib/                 # Shared utilities
├── prisma/              # Database schema
├── Dockerfile           # Production container
├── docker-compose.yml   # Local development
└── deploy-cloud.sh      # Cloud deployment
```

## 🔧 **Common Commands**

### **Database**
```bash
# Reset database
npx prisma db push --force-reset

# Generate types after schema changes
npx prisma generate

# View data
npx prisma studio
```

### **Development**
```bash
# Start frontend
npm run dev

# Build for production
npm run build

# Type checking
npm run lint
```

### **Cloud Deployment**
```bash
# Setup GCP resources (one-time)
./setup-gcp-resources.sh

# Deploy workers
./deploy-cloud.sh

# View logs
gcloud logs tail --project=YOUR_PROJECT --follow
```

### **Docker**
```bash
# Local development stack
docker-compose up

# Build production image
docker build -t layer:latest .

# Clean up
docker-compose down
```

## 🧪 **Testing**

### **Manual Testing**
1. Start the development server: `npm run dev`
2. Upload a video through the UI
3. Create a persona with face/voice
4. Submit a transformation job
5. Monitor job status in dashboard

### **Health Checks**
```bash
# Local frontend
curl http://localhost:3000/api/health

# Cloud workers (after deployment)
curl https://your-worker-url/health
```

## 🚨 **Troubleshooting**

### **Common Issues**

**❌ Database Connection Failed**
```bash
# Check DATABASE_URL in .env.local
# Ensure database is accessible
npx prisma db push
```

**❌ GCP Authentication**
```bash
# Login to gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Check service account
ls -la service-account.json
```

**❌ Pub/Sub Permissions**
```bash
# Verify topic exists
gcloud pubsub topics list

# Check subscriptions
gcloud pubsub subscriptions list
```

**❌ Build Errors**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

## 🎯 **Production Deployment**

### **Quick Deploy**
```bash
# One-time setup
./setup-gcp-resources.sh

# Deploy updates
./deploy-cloud.sh
```

### **Environment Variables for Production**
Set these in your cloud environment:
- `DATABASE_URL` - Production database
- `ELEVENLABS_API_KEY` - API key
- `GCP_PROJECT_ID` - Your GCP project
- `GCS_BUCKET` - Storage bucket
- `PUBSUB_TOPIC` - Message queue topic

## 📚 **Additional Resources**

- **[Cloud Deployment Guide](./CLOUD_DEPLOYMENT.md)** - Detailed cloud setup
- **[Prisma Docs](https://prisma.io/docs)** - Database ORM
- **[Next.js Docs](https://nextjs.org/docs)** - Frontend framework
- **[Google Cloud Run](https://cloud.google.com/run/docs)** - Serverless containers

---

**Happy coding! 🎉** 