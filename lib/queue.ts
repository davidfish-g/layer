import { PubSub } from '@google-cloud/pubsub'
import { createClient } from 'redis'

interface JobPayload {
  jobId: string
  userId: string
  personaId: string
  videoUrl: string
}

// Initialize Redis client for local development
let redisClient: any = null

if (process.env.NODE_ENV === 'development') {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })
  redisClient.connect()
}

// Initialize Pub/Sub for production
const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
})

const topic = pubsub.topic(process.env.PUBSUB_TOPIC!)

export async function enqueueJob(payload: JobPayload): Promise<void> {
  if (process.env.NODE_ENV === 'development' && redisClient) {
    // Use Redis for local development
    await redisClient.lPush('video-processing-queue', JSON.stringify(payload))
  } else {
    // Use Pub/Sub for production
    const message = Buffer.from(JSON.stringify(payload))
    await topic.publishMessage({ data: message })
  }
}

export async function updateJobProgress(
  jobId: string,
  progress: number,
  status?: string
): Promise<void> {
  // This would typically update the database
  // Implementation depends on your specific requirements
  console.log(`Job ${jobId} progress: ${progress}%`, status)
} 