import { PubSub } from '@google-cloud/pubsub'

interface JobPayload {
  jobId: string
  userId: string
  personaId: string
  videoUrl: string
}

// Lazy initialization - only create PubSub client when actually needed
let pubsub: PubSub | null = null
let topic: any = null

function getPubSub() {
  if (!pubsub) {
    pubsub = new PubSub({
      projectId: process.env.GCP_PROJECT_ID,
    })
  }
  return pubsub
}

function getTopic() {
  if (!topic) {
    if (!process.env.PUBSUB_TOPIC) {
      throw new Error('PUBSUB_TOPIC environment variable is required')
    }
    topic = getPubSub().topic(process.env.PUBSUB_TOPIC)
  }
  return topic
}

export async function enqueueJob(payload: JobPayload): Promise<void> {
  // Use Pub/Sub for both development and production
  const message = Buffer.from(JSON.stringify(payload))
  await getTopic().publishMessage({ data: message })
  console.log(`Job ${payload.jobId} enqueued to Pub/Sub topic: ${process.env.PUBSUB_TOPIC}`)
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