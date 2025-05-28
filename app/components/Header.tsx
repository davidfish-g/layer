'use client'

import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Video } from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Video className="h-6 w-6" />
          <h1 className="text-xl font-bold">Layer</h1>
        </div>
        
        {session && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{session.user?.email}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="btn-secondary flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
} 