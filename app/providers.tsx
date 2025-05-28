'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/app/providers/query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </SessionProvider>
  )
} 