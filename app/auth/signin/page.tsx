'use client'

import { signIn } from 'next-auth/react'
import { Chrome } from 'lucide-react'

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome to Layer</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Transform videos with AI personas
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Chrome className="h-5 w-5" />
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  )
} 