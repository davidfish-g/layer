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

## 🚀 **Tech Stack**

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
│   ├── components/              # React components
│   ├── personas/                # Persona management pages
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
├── Dockerfile                   # Production container
├── docker-compose.yml           # Local development
├── setup-gcp-resources.sh       # GCP infrastructure setup
├── deploy-cloud.sh              # Cloud deployment script
└── package.json                 # Dependencies
```


### **Common Development Commands**

```bash
# Frontend Development
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm run lint            # Type checking and linting

# Database
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema changes
npx prisma studio       # Database GUI

### **What the Scripts Do**

**`setup-gcp-resources.sh`**:
- Enables required GCP APIs (Cloud Run, Cloud Build, Pub/Sub, Storage)
- Creates Pub/Sub topics and subscriptions for job queuing
- Sets up service accounts with proper permissions
- Creates/verifies GCS storage bucket for video files
- Configures IAM roles for secure cloud access

**`deploy-cloud.sh`**:
- **Builds Docker image using Google Cloud Build** (100% cloud-based)
- Uses powerful cloud machines for faster AI model downloads
- Automatically pushes to Google Container Registry
- Deploys to Cloud Run with production configuration
- Sets up auto-scaling, health checks, and monitoring
