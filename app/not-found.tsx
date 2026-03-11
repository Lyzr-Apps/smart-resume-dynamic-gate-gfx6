export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d0f17',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem 0' }}>
          404
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#9ca3af', margin: '0 0 1.5rem 0' }}>
          Page not found
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #6C63FF, #00C2FF)',
            color: '#ffffff',
            borderRadius: '0.5rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
