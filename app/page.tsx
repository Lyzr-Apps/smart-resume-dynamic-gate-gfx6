import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic'

const SmartResumeApp = dynamicImport(() => import('@/components/SmartResumeApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[hsl(230,25%,7%)] text-gray-200 font-sans flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="font-semibold text-lg text-white">Loading SmartResume AI...</p>
      </div>
    </div>
  ),
})

export default function Page() {
  return <SmartResumeApp />
}
