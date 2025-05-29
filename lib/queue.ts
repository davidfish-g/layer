import { PubSub } from '@google-cloud/pubsub'

interface JobPayload {
  jobId: string
  userId: string
  personaId: string
  videoUrl: string
}

// Initialize Pub/Sub (cloud-native messaging)
const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
})

const topic = pubsub.topic(process.env.PUBSUB_TOPIC!)

export async function enqueueJob(payload: JobPayload): Promise<void> {
  // Use Pub/Sub for both development and production
  const message = Buffer.from(JSON.stringify(payload))
  await topic.publishMessage({ data: message })
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