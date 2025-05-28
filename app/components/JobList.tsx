'use client'

import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, Download, Play } from 'lucide-react'
import Image from 'next/image'

interface Job {
  id: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  progress: number
  srcUrl: string
  outUrl: string | null
  error: string | null
  createdAt: string
  persona: {
    id: string
    name: string | null
    faceUrl: string
  }
}

export default function JobList() {
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs')
      if (!response.ok) throw new Error('Failed to fetch jobs')
      return response.json() as Promise<Job[]>
    },
    refetchInterval: 5000, // Refetch every 5 seconds to get updates
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Play className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No transformations yet</h3>
        <p className="text-muted-foreground">
          Upload a video to start your first transformation
        </p>
      </div>
    )
  }

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'queued':
        return 'Queued'
      case 'processing':
        return 'Processing'
      case 'done':
        return 'Complete'
      case 'failed':
        return 'Failed'
    }
  }

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'queued':
        return 'text-yellow-600'
      case 'processing':
        return 'text-blue-600'
      case 'done':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
    }
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="card p-4">
          <div className="flex items-center space-x-4">
            {/* Persona Avatar */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
              <Image
                src={job.persona.faceUrl}
                alt={job.persona.name || 'Persona'}
                fill
                className="object-cover"
              />
            </div>

            {/* Job Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {job.persona.name || `Persona ${job.persona.id.slice(0, 8)}`}
                </h3>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(job.status)}
                  <span className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                    {getStatusText(job.status)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {(job.status === 'processing' || job.status === 'done') && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {job.status === 'failed' && job.error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {job.error}
                </p>
              )}

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground">
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Download Button */}
            {job.status === 'done' && job.outUrl && (
              <a
                href={job.outUrl}
                download
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 