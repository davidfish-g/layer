import { Storage } from '@google-cloud/storage'

// Lazy initialization - only create storage client when actually needed
let storage: Storage | null = null
let bucket: any = null

function getStorage() {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    })
  }
  return storage
}

function getBucket() {
  if (!bucket) {
    if (!process.env.GCS_BUCKET) {
      throw new Error('GCS_BUCKET environment variable is required')
    }
    bucket = getStorage().bucket(process.env.GCS_BUCKET)
  }
  return bucket
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const blob = getBucket().file(fileName)
  
  const stream = blob.createWriteStream({
    metadata: {
      contentType: mimeType,
    },
    resumable: false,
  })

  return new Promise((resolve, reject) => {
    stream.on('error', reject)
    stream.on('finish', () => {
      resolve(`https://storage.googleapis.com/${process.env.GCS_BUCKET}/${fileName}`)
    })
    stream.end(file)
  })
}

export async function generateSignedUrl(fileName: string): Promise<string> {
  const [url] = await getBucket().file(fileName).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  })
  
  return url
}

export async function deleteFile(fileName: string): Promise<void> {
  await getBucket().file(fileName).delete()
} 