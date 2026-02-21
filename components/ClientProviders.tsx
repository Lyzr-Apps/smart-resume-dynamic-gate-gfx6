'use client'

import React, { useState, useEffect } from 'react'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  // Dynamically import providers only after mount (client-side only)
  return <MountedProviders>{children}</MountedProviders>
}

function MountedProviders({ children }: { children: React.ReactNode }) {
  const [Provider, setProvider] = useState<{
    ErrorBoundary: React.ComponentType<{ children: React.ReactNode }>
    AgentInterceptorProvider: React.ComponentType<{ children: React.ReactNode }>
  } | null>(null)

  useEffect(() => {
    Promise.all([
      import('@/components/ErrorBoundary'),
      import('@/components/AgentInterceptorProvider'),
    ]).then(([eb, aip]) => {
      setProvider({
        ErrorBoundary: eb.default,
        AgentInterceptorProvider: aip.AgentInterceptorProvider,
      })
    })
  }, [])

  if (!Provider) {
    return <>{children}</>
  }

  return (
    <Provider.ErrorBoundary>
      <Provider.AgentInterceptorProvider>
        {children}
      </Provider.AgentInterceptorProvider>
    </Provider.ErrorBoundary>
  )
}
