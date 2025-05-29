#!/usr/bin/env node

/**
 * Video Processing Worker - Cloud Ready
 * 
 * This worker processes video transformation jobs:
 * 1. Downloads source video from GCS
 * 2. Extracts audio using FFmpeg
 * 3. Performs face swapping with FaceFusion CLI
 * 4. Converts voice using ElevenLabs speech-to-speech
 * 5. Lip syncs with MuseTalk
 * 6. Assembles final video with FFmpeg
 * 7. Uploads result to GCS
 */

const { PubSub } = require('@google-cloud/pubsub')
const { PrismaClient } = require('@prisma/client')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs').promises
const path = require('path')
const axios = require('axios')
const http = require('http')

const execAsync = promisify(exec)
const prisma = new PrismaClient()

// Initialize Pub/Sub (cloud-native message queue)
const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
})

class VideoProcessor {
  constructor() {
    this.workDir = '/tmp/video-processing'
    this.ensureWorkDir()
  }

  async ensureWorkDir() {
    try {
      await fs.mkdir(this.workDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create work directory:', error)
    }
  }

  async processJob(jobPayload) {
    const { jobId, userId, personaId, videoUrl } = jobPayload
    
    try {
      console.log(`Processing job ${jobId}`)
      
      // Update job status
      await this.updateJobStatus(jobId, 'processing', 0)
      
      // Step 1: Download source video
      const videoPath = await this.downloadVideo(videoUrl, jobId)
      await this.updateJobStatus(jobId, 'processing', 10)
      
      // Step 2: Extract audio
      const audioPath = await this.extractAudio(videoPath, jobId)
      await this.updateJobStatus(jobId, 'processing', 20)
      
      // Step 3: Get persona data
      const persona = await prisma.persona.findUnique({
        where: { id: personaId }
      })
      
      if (!persona) {
        throw new Error('Persona not found')
      }
      
      // Step 4: Face swap with FaceFusion
      const faceSwappedPath = await this.performFaceSwap(videoPath, persona.faceUrl, jobId)
      await this.updateJobStatus(jobId, 'processing', 50)
      
      // Step 5: Voice conversion with ElevenLabs
      const convertedAudioPath = await this.convertVoice(audioPath, persona.voiceId, jobId)
      await this.updateJobStatus(jobId, 'processing', 70)
      
      // Step 6: Lip sync with MuseTalk
      const lipSyncedPath = await this.performLipSync(faceSwappedPath, convertedAudioPath, jobId)
      await this.updateJobStatus(jobId, 'processing', 90)
      
      // Step 7: Upload result
      const resultUrl = await this.uploadResult(lipSyncedPath, jobId)
      
      // Step 8: Update job as complete
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'done',
          outUrl: resultUrl,
          progress: 100,
        },
      })
      
      // Cleanup
      await this.cleanup(jobId)
      
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

  async downloadVideo(url, jobId) {
    const videoPath = path.join(this.workDir, `${jobId}_source.mp4`)
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    })
    
    const writer = require('fs').createWriteStream(videoPath)
    response.data.pipe(writer)
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(videoPath))
      writer.on('error', reject)
    })
  }

  async extractAudio(videoPath, jobId) {
    const audioPath = path.join(this.workDir, `${jobId}_audio.wav`)
    await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${audioPath}"`)
    return audioPath
  }

  async performFaceSwap(videoPath, faceUrl, jobId) {
    // Download face image
    const facePath = path.join(this.workDir, `${jobId}_face.jpg`)
    const response = await axios({
      method: 'GET',
      url: faceUrl,
      responseType: 'stream',
    })
    
    const writer = require('fs').createWriteStream(facePath)
    response.data.pipe(writer)
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
    
    // Perform face swap using FaceFusion wrapper
    const outputPath = path.join(this.workDir, `${jobId}_faceswapped.mp4`)
    const wrapperPath = path.join(__dirname, 'python', 'facefusion_wrapper.py')
    
    await execAsync(`python3 "${wrapperPath}" --source "${facePath}" --target "${videoPath}" --output "${outputPath}"`)
    
    return outputPath
  }

  async convertVoice(audioPath, voiceId, jobId) {
    // Use ElevenLabs speech-to-speech API
    const FormData = require('form-data')
    const formData = new FormData()
    const audioBuffer = await fs.readFile(audioPath)
    
    formData.append('audio', audioBuffer, {
      filename: 'input.wav',
      contentType: 'audio/wav'
    })
    formData.append('model_id', 'eleven_multilingual_v2')

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`,
      formData,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer',
      }
    )

    const convertedAudioPath = path.join(this.workDir, `${jobId}_converted_audio.wav`)
    await fs.writeFile(convertedAudioPath, Buffer.from(response.data))
    
    return convertedAudioPath
  }

  async performLipSync(videoPath, audioPath, jobId) {
    // Use MuseTalk for lip synchronization
    const outputPath = path.join(this.workDir, `${jobId}_final.mp4`)
    const wrapperPath = path.join(__dirname, 'python', 'musetalk_wrapper.py')
    
    await execAsync(`python3 "${wrapperPath}" --video "${videoPath}" --audio "${audioPath}" --output "${outputPath}"`)
    
    return outputPath
  }

  async uploadResult(filePath, jobId) {
    // Upload to Google Cloud Storage
    const { Storage } = require('@google-cloud/storage')
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    })
    
    const bucket = storage.bucket(process.env.GCS_BUCKET)
    const fileName = `results/${jobId}_result.mp4`
    
    await bucket.upload(filePath, {
      destination: fileName,
      metadata: {
        contentType: 'video/mp4',
      },
    })
    
    // Make file public
    await bucket.file(fileName).makePublic()
    
    return `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${fileName}`
  }

  async updateJobStatus(jobId, status, progress) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status, progress },
    })
  }

  async cleanup(jobId) {
    // Remove temporary files
    const files = await fs.readdir(this.workDir)
    const jobFiles = files.filter(file => file.startsWith(jobId))
    
    for (const file of jobFiles) {
      await fs.unlink(path.join(this.workDir, file))
    }
  }
}

// Health check server for cloud deployment
function createHealthServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'video-processor'
      }))
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  })
  
  const port = process.env.PORT || 8080
  server.listen(port, () => {
    console.log(`Health check server running on port ${port}`)
  })
  
  return server
}

// Main worker loop
async function main() {
  // Start health check server
  createHealthServer()
  
  const processor = new VideoProcessor()
  
  // Pub/Sub for production
  console.log('Starting Pub/Sub worker...')
  
  const subscription = pubsub.subscription(process.env.PUBSUB_SUBSCRIPTION)
  
  subscription.on('message', async (message) => {
    try {
      const jobPayload = JSON.parse(message.data.toString())
      await processor.processJob(jobPayload)
      message.ack()
    } catch (error) {
      console.error('Pub/Sub worker error:', error)
      message.nack()
    }
  })
  
  subscription.on('error', (error) => {
    console.error('Subscription error:', error)
  })
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { VideoProcessor } 