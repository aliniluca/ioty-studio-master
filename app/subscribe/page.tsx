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
      if (!res.ok) throw new Error(data.error || 'Abonarea a eșuat')
      // Original: 'Gata!', 'Verifica mail-ul!'
      toast({ title: 'Gata!', description: 'Verifică mail-ul!' })
      setEmail('')
    } catch (err: any) {
      // Original: ' Eroare'
      toast({ title: 'Eroare', description: err.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full">
      <Image
        src="/images/newsletter/background.jpeg"
        alt="Imagine de fundal newsletter"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        onError={(e) => {
          // Fallback to gradient background if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }
        }}
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* Adjusted classes: Removed h-full and added 'min-h-[calc(100vh-64px)]' to the parent div
          to ensure the flex container stretches to the full viewport height (minus the header/nav height) */}
      <div className="relative z-10 flex items-center justify-center min-h-[inherit] w-full px-4">
        <div className="w-full max-w-xl bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Abonează-te la newsletter-ul nostru
          </h1>
          <p className="mt-2 text-gray-700">
            Primește actualizări despre produse, listări noi și oferte exclusive direct în inbox-ul tău.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="tu@companie.ro"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/95"
            />
            <Button type="submit" disabled={isLoading} className="shrink-0">
              {/* Translated: 'Subscribing…' -> 'Se abonează…', 'Subscribe' -> 'Abonează-te' */}
              {isLoading ? 'Se abonează…' : 'Abonează-te'}
            </Button>
          </form>

          <p className="mt-3 text-xs text-gray-600">
            Ne pasă de datele tale conform politicii noastre de confidențialitate. Te poți dezabona oricând.
          </p>
        </div>
      </div>
    </div>
  )
}
