'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SubscribePage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')
      toast({ title: 'Subscribed!', description: 'Check your inbox for a confirmation.' })
      setEmail('')
    } catch (err: any) {
      toast({ title: 'Subscription failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full">
      <Image
        src="/images/newsletter/background.jpeg"
        alt="Newsletter background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="w-full max-w-xl bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Subscribe to our newsletter</h1>
          <p className="mt-2 text-gray-700">Get product updates, new listings, and exclusive offers in your inbox.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/95"
            />
            <Button type="submit" disabled={isLoading} className="shrink-0">
              {isLoading ? 'Subscribing…' : 'Subscribe'}
            </Button>
          </form>

          <p className="mt-3 text-xs text-gray-600">
            We care about your data in our privacy policy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  )
}


