import { Suspense } from 'react'
import SubscribeContent from '@/components/subscribe/SubscribeContent'

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-[calc(100vh-64px)] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Se încarcă...</p>
        </div>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  )
}
