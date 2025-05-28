import axios from 'axios'

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1'

const elevenlabsClient = axios.create({
  baseURL: ELEVENLABS_API_BASE,
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
  },
})

export async function createVoice(
  name: string,
  voiceSample: Buffer
): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('files', new Blob([voiceSample], { type: 'audio/wav' }), 'sample.wav')
    formData.append('description', `Voice clone for ${name}`)

    const response = await elevenlabsClient.post('/voices/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data.voice_id
  } catch (error: any) {
    console.error('ElevenLabs API error:', error.response?.data || error.message)
    throw new Error(`Failed to create voice: ${error.response?.data?.detail || error.message}`)
  }
}

export async function speechToSpeech(
  voiceId: string,
  audioBuffer: Buffer
): Promise<Buffer> {
  const formData = new FormData()
  formData.append('audio', new Blob([audioBuffer], { type: 'audio/wav' }), 'input.wav')
  formData.append('model_id', 'eleven_multilingual_v2')

  const response = await elevenlabsClient.post(
    `/speech-to-speech/${voiceId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'arraybuffer',
    }
  )

  return Buffer.from(response.data)
}

export async function deleteVoice(voiceId: string): Promise<void> {
  await elevenlabsClient.delete(`/voices/${voiceId}`)
} 