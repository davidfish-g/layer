'use client'

import { useQuery } from '@tanstack/react-query'
import { Plus, User, Mic } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Persona {
  id: string
  name: string | null
  faceUrl: string
  voiceId: string
  createdAt: string
}

export default function PersonaList() {
  const { data: personas, isLoading } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await fetch('/api/personas')
      if (!response.ok) throw new Error('Failed to fetch personas')
      return response.json() as Promise<Persona[]>
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link
        href="/personas/create"
        className="card p-6 border-dashed border-2 hover:border-primary/50 transition-colors flex items-center justify-center min-h-[120px] group"
      >
        <div className="text-center">
          <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
          <p className="text-sm font-medium">Create New Persona</p>
          <p className="text-xs text-muted-foreground">Upload face & voice</p>
        </div>
      </Link>

      {personas?.map((persona) => (
        <div key={persona.id} className="card p-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
              <Image
                src={persona.faceUrl}
                alt={persona.name || 'Persona'}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">
                {persona.name || `Persona ${persona.id.slice(0, 8)}`}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Face</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mic className="h-3 w-3" />
                  <span>Voice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 