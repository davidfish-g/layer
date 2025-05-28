#!/usr/bin/env node

/**
 * Simple Video Processing Worker (Demo)
 * 
 * This is a simplified worker that processes jobs from Redis
 * and updates their status in the database to demonstrate
 * the job processing pipeline without requiring AI dependencies.
 */

const { createClient } = require('redis')
const { PrismaClient } = require('../node_modules/@prisma/client')

const prisma = new PrismaClient()

// Initialize Redis for local development
let redisClient = null
if (process.env.NODE_ENV === 'development') {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })
  redisClient.connect()
}

class SimpleVideoProcessor {
  async processJob(jobPayload) {
    const { jobId, userId, personaId, videoUrl } = jobPayload
    
    try {
      console.log(`Processing job ${jobId}`)
      
      // Update job status to processing
      await this.updateJobStatus(jobId, 'processing', 0)
      
      // Simulate processing steps with delays
      console.log(`Step 1: Downloading video for job ${jobId}`)
      await this.sleep(2000)
      await this.updateJobStatus(jobId, 'processing', 20)
      
      console.log(`Step 2: Extracting audio for job ${jobId}`)
      await this.sleep(2000)
      await this.updateJobStatus(jobId, 'processing', 40)
      
      console.log(`Step 3: Face swapping for job ${jobId}`)
      await this.sleep(3000)
      await this.updateJobStatus(jobId, 'processing', 60)
      
      console.log(`Step 4: Voice conversion for job ${jobId}`)
      await this.sleep(2000)
      await this.updateJobStatus(jobId, 'processing', 80)
      
      console.log(`Step 5: Lip sync for job ${jobId}`)
      await this.sleep(2000)
      await this.updateJobStatus(jobId, 'processing', 90)
      
      console.log(`Step 6: Uploading result for job ${jobId}`)
      await this.sleep(1000)
      
      // Mark job as complete (with a demo output URL)
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'done',
          outUrl: `https://storage.googleapis.com/layer-storage-bucket/results/${jobId}_result.mp4`,
          progress: 100,
        },
      })
      
      console.log(`Job ${jobId} completed successfully`)
      
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error)
      
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error.message,
        },
      })
    }
  }

  async updateJobStatus(jobId, status, progress) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status, progress },
    })
    console.log(`Job ${jobId}: ${status} (${progress}%)`)
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Main worker loop
async function main() {
  const processor = new SimpleVideoProcessor()
  
  if (process.env.NODE_ENV === 'development' && redisClient) {
    console.log('Starting Simple Redis worker...')
    
    while (true) {
      try {
        const result = await redisClient.brPop('video-processing-queue', 10)
        if (result) {
          const jobPayload = JSON.parse(result.element)
          await processor.processJob(jobPayload)
        }
      } catch (error) {
        console.error('Redis worker error:', error)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  } else {
    console.log('This worker only supports development mode with Redis')
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...')
  if (redisClient) {
    await redisClient.disconnect()
  }
  await prisma.$disconnect()
  process.exit(0)
})

// Start the worker
main().catch(console.error) 