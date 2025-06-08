# Layer - AI Video Persona Transformation

A cloud-native web application for transforming videos using AI-powered face swapping, voice cloning, and lip-sync technology.

## Features

- **Persona Creation**: Upload face images and voice samples to create AI personas
- **Video Transformation**: Apply personas to source videos with face-swap, voice conversion, and lip-sync
- **Cloud Processing**: Scalable serverless video processing on Google Cloud Run
- **Real-time Updates**: Track processing status with live updates

## Architecture

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

**Development vs Production:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Local Dev     │    │   Cloud Services │    │   Production    │
│ localhost:3000  │───▶│  Cloud SQL DB    │◀───│  Deployed App   │
│ (Frontend)      │    │  Cloud Storage   │    │  (Cloud Run)    │
│                 │    │  Worker Service  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Tech Stack

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, NextAuth.js  
**Database:** PostgreSQL (Cloud SQL), Prisma ORM  
**Cloud:** Google Cloud Run, Pub/Sub, Cloud Storage, Cloud SQL  
**AI Processing:** FaceFusion, MuseTalk, ElevenLabs API, FFmpeg  

## Quick Start

### Development
```bash
npm run dev:cloud    # Full cloud connection (recommended)
npm run dev          # Basic development
```

### Deployment
```bash
npm run deploy       # Deploy frontend only
npm run deploy:cloud # Deploy full stack
```

## Project Structure

```
layer/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── components/     # React components
│   └── personas/       # Persona management
├── worker/             # Cloud AI Workers
│   ├── video-processor.js
│   └── python/         # AI tool wrappers
├── lib/                # Shared utilities
├── prisma/             # Database schema
├── deploy-*.sh         # Deployment scripts
└── start-local-dev.sh  # Local development
```

## Development Workflow

### Setup
1. **Prerequisites:**
   ```bash
   gcloud auth login
   gcloud config set project layerid
   # Ensure service-account.json is in project root
   ```

2. **Start Development:**
   ```bash
   npm run dev:cloud
   ```
   This automatically:
   - Installs Cloud SQL Proxy if needed
   - Connects to cloud database securely
   - Starts Next.js dev server
   - Handles cleanup on exit

3. **Make Changes:** Edit code, see changes instantly at `localhost:3000`

4. **Deploy:** `npm run deploy` when ready to ship

### Environment Files
- `.env.development` - Local development (gitignored)
- `.env.local` - Auto-generated from development config
- `.env` - Production configuration

### Database Management
```bash
npm run db:studio    # View database in browser
npm run db:push      # Apply schema changes
npm run db:generate  # Generate Prisma client
```

## Deployment

### First Time Setup
```bash
./setup-gcp-resources.sh  # Create infrastructure (once)
./deploy-cloud.sh         # Deploy backend worker
./deploy-frontend.sh      # Deploy frontend
```

### Regular Updates
```bash
./deploy-frontend.sh      # Frontend changes only
./deploy-cloud.sh         # Backend/worker changes
```

### What Each Script Does

**`setup-gcp-resources.sh`** (run once):
- Enables required GCP APIs
- Creates Pub/Sub topics and subscriptions
- Sets up service accounts and permissions
- Creates GCS storage bucket

**`deploy-cloud.sh`** (backend):
- Builds AI worker with Docker
- Deploys to Cloud Run with auto-scaling
- Handles AI model downloads in cloud

**`deploy-frontend.sh`** (frontend):
- Builds Next.js application
- Deploys to Cloud Run
- Configures environment variables

## Configuration

Required environment variables in `.env`:

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

# AI Services
ELEVENLABS_API_KEY="..."
```

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev:cloud` | Start development with cloud backend |
| `npm run dev` | Basic development server |
| `npm run deploy` | Deploy frontend |
| `npm run deploy:cloud` | Deploy full stack |
| `npm run db:studio` | Database management UI |
| `npm run build` | Build for production |
| `npm run lint` | Type checking and linting |

## Monitoring

```bash
# Frontend logs
gcloud logs tail --filter='resource.labels.service_name=layer-frontend'

# Backend logs
gcloud logs tail --filter='resource.labels.service_name=video-processor'

# Storage usage
gcloud storage du gs://layer-storage-bucket --summarize
```

## Troubleshooting

### Database Connection Issues
```bash
# Check Cloud SQL Proxy is running
ps aux | grep cloud-sql-proxy

# Restart development environment
npm run dev:cloud
```

### OAuth Issues
- Verify Google OAuth credentials in environment files
- Check `http://localhost:3000` is authorized in Google OAuth console

### Deployment Issues
- **"Worker service not found"** → Deploy backend first: `./deploy-cloud.sh`
- **"Build failed"** → Check Docker build logs and machine types
- **"Authentication error"** → Verify service account permissions

### General Issues
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install

# Check service status
gcloud run services list
```

## Security

- Environment files properly gitignored
- Database access via secure proxy
- Service accounts with minimal permissions
- Sensitive data removed from git history

Your development environment provides local development speed with cloud infrastructure power.
