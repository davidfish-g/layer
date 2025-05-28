# Layer - AI Video Persona Transformation

An MVP web application for transforming videos using AI-powered face swapping, voice cloning, and lip-sync technology.

## Features

- **Persona Creation**: Upload face images and voice samples to create AI personas
- **Video Transformation**: Apply personas to source videos with face-swap, voice conversion, and lip-sync
- **Background Processing**: Scalable video processing pipeline using Google Cloud services
- **Real-time Updates**: Track processing status with live updates

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, React Query
- **Backend**: NextAuth, Prisma, PostgreSQL
- **Storage**: Google Cloud Storage
- **Queue**: Redis (development) / Google Cloud Pub/Sub (production)
- **AI Services**: ElevenLabs (voice cloning), FaceFusion, MuseTalk
- **Processing**: FFmpeg, Python AI tools


### Video Processing Worker

The video processing worker handles the AI transformation pipeline:

1. **Build the worker Docker image**:
   ```bash
   cd worker
   docker build -t layer-worker .
   ```

2. **Run the worker locally**:
   ```bash
   docker run --env-file ../.env layer-worker
   ```

3. **For production**, deploy the worker to:
   - Google Cloud Run
   - Google Kubernetes Engine
   - Google Compute Engine

## Project Structure

```
layer/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── personas/          # Persona management pages
│   └── auth/              # Authentication pages
├── lib/                   # Shared utilities
│   ├── prisma.ts         # Database client
│   ├── storage.ts        # Cloud Storage utilities
│   ├── elevenlabs.ts     # ElevenLabs integration
│   └── queue.ts          # Job queue management
├── prisma/               # Database schema
├── worker/               # Background processing
│   ├── video-processor.js # Main processing script
│   ├── Dockerfile        # Worker container
│   └── package.json      # Worker dependencies
├── docs/                 # Setup guides and documentation
│   ├── SETUP-CLOUD-SQL.md # Cloud SQL setup guide
│   └── SETUP-REDIS.md    # Redis setup guide
└── public/               # Static assets
```