'use client'

import './globals.css'
import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from './providers/query-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Layer - AI Video Persona Transformation',
  description: 'Transform videos into personalized AI personas with face swapping and voice cloning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            <div className="min-h-screen bg-background">
              {children}
            </div>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
} 