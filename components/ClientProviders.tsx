'use client'

import React, { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  mounted: boolean
  hasError: boolean
  Providers: React.ComponentType<{ children: ReactNode }> | null
}

/**
 * ClientProviders wraps children with ErrorBoundary, AgentInterceptorProvider,
 * and IframeLogger ONLY on the client side after mount.
 *
 * Uses a class component to avoid useContext/useState hook issues during
 * Next.js static page generation (prerendering).
 */
export default class ClientProviders extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      mounted: false,
      hasError: false,
      Providers: null,
    }
  }

  componentDidMount() {
    this.setState({ mounted: true })

    // Dynamically load providers only on the client
    Promise.all([
      import('@/components/ErrorBoundary'),
      import('@/components/AgentInterceptorProvider'),
      import('@/lib/iframeLogger'),
    ])
      .then(([ebModule, aipModule, loggerModule]) => {
        const EB = ebModule.default
        const AIP = aipModule.AgentInterceptorProvider

        // Initialize iframe logger
        if (loggerModule.initIframeLogger) {
          loggerModule.initIframeLogger()
        }

        // Create a combined provider component
        const Combined = ({ children }: { children: ReactNode }) => (
          <EB>
            <AIP>{children}</AIP>
          </EB>
        )

        this.setState({ Providers: Combined })
      })
      .catch((err) => {
        console.warn('[ClientProviders] Failed to load providers:', err)
      })
  }

  componentDidCatch(error: Error) {
    console.error('[ClientProviders] Error caught:', error)
    this.setState({ hasError: true })
  }

  render() {
    const { children } = this.props
    const { mounted, Providers } = this.state

    // During SSR or before mount, render children directly
    if (!mounted || !Providers) {
      return <>{children}</>
    }

    return <Providers>{children}</Providers>
  }
}
