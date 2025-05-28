'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, Video, AlertCircle } from 'lucide-react'

interface Persona {
  id: string
  name: string | null
  faceUrl: string
}

export default function VideoUpload() {
  const [selectedPersona, setSelectedPersona] = useState<string>('')
  const queryClient = useQueryClient()

  const { data: personas } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await fetch('/api/personas')
      if (!response.ok) throw new Error('Failed to fetch personas')
      return response.json() as Promise<Persona[]>
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ file, personaId }: { file: File; personaId: string }) => {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('personaId', personaId)

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'video/mp4': ['.mp4'],
      'video/mov': ['.mov'],
      'video/avi': ['.avi'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDrop: (files) => {
      if (files.length > 0 && selectedPersona) {
        uploadMutation.mutate({ file: files[0], personaId: selectedPersona })
      }
    },
  })

  const handleUpload = () => {
    if (acceptedFiles.length > 0 && selectedPersona) {
      uploadMutation.mutate({ file: acceptedFiles[0], personaId: selectedPersona })
    }
  }

  return (
    <div className="space-y-6">
      {/* Persona Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Persona</label>
        <select
          value={selectedPersona}
          onChange={(e) => setSelectedPersona(e.target.value)}
          className="w-full p-3 border border-input rounded-md bg-background"
        >
          <option value="">Choose a persona...</option>
          {personas?.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.name || `Persona ${persona.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${!selectedPersona ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={!selectedPersona} />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-muted-foreground">
            {uploadMutation.isPending ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            ) : (
              <Upload className="w-full h-full" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragActive
                ? 'Drop your video here'
                : 'Drag & drop a video, or click to select'}
            </p>
            <p className="text-sm text-muted-foreground">
              MP4, MOV, AVI up to 100MB
            </p>
          </div>
          {acceptedFiles.length > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Video className="h-4 w-4" />
              <span>{acceptedFiles[0].name}</span>
            </div>
          )}
        </div>
      </div>

      {uploadMutation.isError && (
        <div className="flex items-center space-x-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Upload failed. Please try again.</span>
        </div>
      )}

      {acceptedFiles.length > 0 && selectedPersona && !uploadMutation.isPending && (
        <button
          onClick={handleUpload}
          className="btn-primary w-full"
        >
          Start Transformation
        </button>
      )}

      {!selectedPersona && (
        <p className="text-sm text-muted-foreground text-center">
          Please select a persona first
        </p>
      )}
    </div>
  )
} 