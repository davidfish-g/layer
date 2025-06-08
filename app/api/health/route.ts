import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple health check - service is responding
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'layer-frontend'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed'
      },
      { status: 500 }
    )
  }
} 