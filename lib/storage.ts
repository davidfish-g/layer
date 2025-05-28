import { Storage } from '@google-cloud/storage'

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})

const bucket = storage.bucket(process.env.GCS_BUCKET!)

export async function uploadFile(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const blob = bucket.file(fileName)
  
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
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  })
  
  return url
}

export async function deleteFile(fileName: string): Promise<void> {
  await bucket.file(fileName).delete()
} 