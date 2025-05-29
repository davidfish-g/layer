# Layer - AI Video Persona Transformation

A cloud-native web application for transforming videos using AI-powered face swapping, voice cloning, and lip-sync technology.

## ✨ Features

- **🎭 Persona Creation**: Upload face images and voice samples to create AI personas
- **🎬 Video Transformation**: Apply personas to source videos with face-swap, voice conversion, and lip-sync
- **☁️ Cloud Processing**: Scalable serverless video processing on Google Cloud Run
- **📊 Real-time Updates**: Track processing status with live updates

## 🏗️ **Cloud-Native Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Message Queue   │    │  AI Worker      │
│   (Next.js)     │───▶│  (Pub/Sub)       │───▶│  (Cloud Run)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                              ┌─────────────────┐
│    Database     │                              │  File Storage   │
│  (Cloud SQL)    │                              │     (GCS)       │
└─────────────────┘                              └─────────────────┘
```

## 🚀 **Core Tech Stack**

### **Frontend & Web Framework**
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with modern hooks
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Optimized form handling
- **TanStack Query** - Server state management

### **Authentication**
- **NextAuth.js** - Full-featured auth framework
- **Google OAuth** - Social authentication
- **Prisma Adapter** - Session persistence

### **Database & ORM**
- **PostgreSQL** - Cloud SQL managed database
- **Prisma** - Type-safe ORM with migrations
- **Connection Pooling** - Optimized for serverless

### **Cloud Infrastructure (Google Cloud)**
- **Cloud Run** - Serverless container platform for AI workers
- **Pub/Sub** - Cloud-native message queuing
- **Cloud Storage** - Scalable file storage
- **Cloud SQL** - Managed PostgreSQL
- **Service Accounts** - Secure GCP authentication

### **AI Processing Pipeline**
- **FaceFusion** - State-of-the-art face swapping
- **MuseTalk** - Real-time lip synchronization
- **ElevenLabs API** - High-quality voice conversion
- **FFmpeg** - Video/audio processing

## 📁 **Project Structure**

```
layer/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   ├── dashboard/               # Dashboard pages
│   └── layout.tsx               # Root layout
│
├── worker/                      # Cloud AI Workers
│   ├── video-processor.js       # Main processing worker
│   └── python/                  # AI tool wrappers
│       ├── facefusion_wrapper.py
│       └── musetalk_wrapper.py
│
├── lib/                         # Shared utilities
│   ├── auth.ts                  # NextAuth configuration
│   ├── queue.ts                 # Pub/Sub job queuing
│   └── utils.ts                 # Helper functions
│
├── prisma/                      # Database layer
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Version control for DB
│
├── Dockerfile.cloud             # Optimized production container
├── docker-compose.cloud.yml     # Cloud deployment config
├── deploy-cloud.sh              # GCP deployment script
├── CLOUD_DEPLOYMENT.md          # Detailed deployment guide
└── package.json                 # Dependencies
```

## 🤖 **AI Processing Workflow**

### **Transformation Pipeline**
1. **📤 Upload** → User uploads video via Next.js frontend
2. **📋 Queue** → Job enqueued to Cloud Pub/Sub
3. **⚡ Process** → Cloud Run worker picks up job:
   - Downloads source video from GCS
   - Extracts audio with FFmpeg
   - Performs face swap with FaceFusion
   - Converts voice using ElevenLabs API
   - Lip syncs with MuseTalk
   - Assembles final video
4. **💾 Store** → Result uploaded to Google Cloud Storage
5. **🔔 Notify** → Database updated, user receives real-time notification

### **Scalability Features**
- **Auto-scaling**: 0 to 1000+ concurrent workers
- **Cost-effective**: Pay only for actual processing time
- **Fault-tolerant**: Automatic retries and error handling
- **Fast startup**: Pre-cached AI models in containers

## 📦 **Key Dependencies**

### **Frontend**
```json
{
  "next": "14.0.0",
  "react": "^18",
  "@tanstack/react-query": "^5.8.0",
  "next-auth": "^4.24.5",
  "tailwindcss": "^3.3.0"
}
```

### **Cloud Integration**
```json
{
  "@google-cloud/pubsub": "^4.1.0",
  "@google-cloud/storage": "^7.6.0",
  "@prisma/client": "^5.7.0",
  "axios": "^1.6.0"
}
```

### **AI Processing (Containerized)**
- **PyTorch** - Deep learning framework
- **FaceFusion** - Face swapping AI
- **MuseTalk** - Lip sync technology
- **OpenCV** - Computer vision
- **FFmpeg** - Media processing

## 🚀 **Deployment**

### **Quick Start**
```bash
# 1. Setup GCP resources
./setup-gcp-resources.sh

# 2. Deploy to Cloud Run
./deploy-cloud.sh

# 3. Your AI workers are now running serverless! 🎉
```

### **Environment Setup**
```bash
# Required environment variables
GCP_PROJECT_ID="your-project"
DATABASE_URL="postgresql://..."
ELEVENLABS_API_KEY="your-key"
PUBSUB_TOPIC="video-processing-topic"
GCS_BUCKET="your-bucket"
```

## 🔐 **Security & Performance**

### **Authentication**
- ✅ Google OAuth integration
- ✅ Secure session management
- ✅ Service account authentication for GCP

### **Performance Optimizations**
- ✅ **Serverless scaling**: 0→∞ based on demand
- ✅ **Container optimization**: Multi-stage builds, cached models
- ✅ **CDN**: Global content delivery
- ✅ **Connection pooling**: Optimized database connections

### **Cost Management**
- ✅ **Pay-per-use**: Only pay for actual processing time
- ✅ **Auto-shutdown**: Workers scale to zero when idle
- ✅ **Efficient caching**: Pre-built AI models in containers

## 📊 **Monitoring & Observability**

- **Health checks**: `/health` endpoint for all services
- **Structured logging**: Cloud Logging integration
- **Metrics**: Built-in Cloud Run monitoring
- **Alerts**: Automatic notifications for failures

## 🎯 **Production Ready**

This is a **production-ready, cloud-native AI video processing platform** featuring:

- ⚡ **Serverless architecture** with automatic scaling
- 🛡️ **Enterprise security** with service accounts and VPC
- 📈 **High availability** with multi-region deployment support
- 💰 **Cost-optimized** with usage-based pricing
- 🔧 **DevOps ready** with CI/CD deployment scripts

---

**Ready to transform videos with AI at scale? Deploy to the cloud in minutes! ☁️✨**
