import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/storage'
import { createVoice } from '@/lib/elevenlabs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email: session.user.email },
      })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const faceFile = formData.get('face') as File
    const voiceFile = formData.get('voice') as File

    if (!name || !faceFile || !voiceFile) {
      return NextResponse.json(
        { error: 'Name, face image, and voice sample are required' },
        { status: 400 }
      )
    }

    // Validate face image
    if (!faceFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Face file must be an image' },
        { status: 400 }
      )
    }

    // Validate voice file
    if (!voiceFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Voice file must be an audio file' },
        { status: 400 }
      )
    }

    // Upload face image to storage
    const faceFileName = `faces/${user.id}/${Date.now()}-${faceFile.name}`
    const faceBuffer = Buffer.from(await faceFile.arrayBuffer())
    const faceUrl = await uploadFile(faceBuffer, faceFileName, faceFile.type)

    // Create voice with ElevenLabs
    const voiceBuffer = Buffer.from(await voiceFile.arrayBuffer())
    const voiceId = await createVoice(name, voiceBuffer)

    // Create persona in database
    const persona = await prisma.persona.create({
      data: {
        userId: user.id,
        name,
        faceUrl,
        voiceId,
      },
    })

    return NextResponse.json({
      id: persona.id,
      name: persona.name,
      faceUrl: persona.faceUrl,
      voiceId: persona.voiceId,
    })
  } catch (error) {
    console.error('Error creating persona:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 