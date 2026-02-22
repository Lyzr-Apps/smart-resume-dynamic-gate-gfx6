'use client'

import React, { useState, useEffect, lazy, Suspense } from 'react'

// Lazy load all client-only providers
const ErrorBoundary = lazy(() => import('@/components/ErrorBoundary'))
const AgentInterceptorProvider = lazy(() =>
  import('@/components/AgentInterceptorProvider').then((mod) => ({
    default: mod.AgentInterceptorProvider,
  }))
)

function IframeLoggerLoader() {
  useEffect(() => {
    import('@/lib/iframeLogger').then(({ initIframeLogger }) => {
      initIframeLogger()
    })
  }, [])
  return null
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR/prerendering, just render children without any providers
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <ErrorBoundary>
        <AgentInterceptorProvider>
          <IframeLoggerLoader />
          {children}
        </AgentInterceptorProvider>
      </ErrorBoundary>
    </Suspense>
  )
}
