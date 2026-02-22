import dynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const SmartResumeApp = dynamic(() => import('@/components/SmartResumeApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-foreground border-t-transparent animate-spin mx-auto mb-4" />
        <p className="font-bold text-lg">Loading SmartResume AI...</p>
      </div>
    </div>
  ),
})

export default function Page() {
  return <SmartResumeApp />
}
