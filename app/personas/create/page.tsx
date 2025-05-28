'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, User, Mic, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreatePersonaPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [voiceFile, setVoiceFile] = useState<File | null>(null)

  const createPersonaMutation = useMutation({
    mutationFn: async (data: { name: string; faceFile: File; voiceFile: File }) => {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('face', data.faceFile)
      formData.append('voice', data.voiceFile)

      const response = await fetch('/api/personas/create', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to create persona')
      return response.json()
    },
    onSuccess: () => {
      router.push('/')
    },
  })

  const faceDropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (files) => {
      if (files.length > 0) {
        setFaceFile(files[0])
      }
    },
  })

  const voiceDropzone = useDropzone({
    accept: {
      'audio/wav': ['.wav'],
      'audio/mp3': ['.mp3'],
      'audio/mpeg': ['.mp3'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (files) => {
      if (files.length > 0) {
        setVoiceFile(files[0])
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && faceFile && voiceFile) {
      createPersonaMutation.mutate({ name, faceFile, voiceFile })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Link href="/" className="btn-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create Persona</h1>
              <p className="text-muted-foreground">
                Upload a face image and voice sample to create your AI persona
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Persona Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-input rounded-md bg-background"
                placeholder="Enter persona name"
                required
              />
            </div>

            {/* Face Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Face Image (512x512 recommended)
              </label>
              <div
                {...faceDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  faceDropzone.isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...faceDropzone.getInputProps()} />
                <div className="space-y-4">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {faceDropzone.isDragActive
                        ? 'Drop your face image here'
                        : 'Drag & drop a face image, or click to select'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG up to 10MB
                    </p>
                  </div>
                  {faceFile && (
                    <p className="text-sm text-primary">
                      Selected: {faceFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Voice Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Voice Sample (1 minute recommended)
              </label>
              <div
                {...voiceDropzone.getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  voiceDropzone.isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...voiceDropzone.getInputProps()} />
                <div className="space-y-4">
                  <Mic className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {voiceDropzone.isDragActive
                        ? 'Drop your voice sample here'
                        : 'Drag & drop a voice sample, or click to select'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      WAV, MP3 up to 50MB
                    </p>
                  </div>
                  {voiceFile && (
                    <p className="text-sm text-primary">
                      Selected: {voiceFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!name || !faceFile || !voiceFile || createPersonaMutation.isPending}
              className="btn-primary w-full"
            >
              {createPersonaMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  <span>Creating Persona...</span>
                </div>
              ) : (
                'Create Persona'
              )}
            </button>

            {createPersonaMutation.isError && (
              <p className="text-destructive text-sm text-center">
                Failed to create persona. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
} 