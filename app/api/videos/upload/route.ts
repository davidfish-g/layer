import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/storage'
import { enqueueJob } from '@/lib/queue'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const personaId = formData.get('personaId') as string

    if (!videoFile || !personaId) {
      return NextResponse.json(
        { error: 'Video file and persona ID are required' },
        { status: 400 }
      )
    }

    // Validate file size and type
    if (videoFile.size > 100 * 1024 * 1024) { // 100MB
      return NextResponse.json(
        { error: 'File size must be less than 100MB' },
        { status: 400 }
      )
    }

    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi']
    if (!allowedTypes.includes(videoFile.type)) {
      return NextResponse.json(
        { error: 'Only MP4, MOV, and AVI files are allowed' },
        { status: 400 }
      )
    }

    // Verify persona belongs to user
    const persona = await prisma.persona.findFirst({
      where: {
        id: personaId,
        userId: session.user.id,
      },
    })

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      )
    }

    // Upload video to storage
    const fileName = `videos/${Date.now()}-${videoFile.name}`
    const buffer = Buffer.from(await videoFile.arrayBuffer())
    const videoUrl = await uploadFile(buffer, fileName, videoFile.type)

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId: session.user.id,
        personaId,
        srcUrl: videoUrl,
        status: 'queued',
      },
    })

    // Enqueue background job
    await enqueueJob({
      jobId: job.id,
      userId: session.user.id,
      personaId,
      videoUrl,
    })

    return NextResponse.json({ jobId: job.id, status: 'queued' })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 