'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

export default function SubscribePage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAWeberConnected, setIsAWeberConnected] = useState(false)

  // Check for OAuth callback results
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const connected = searchParams.get('connected')

    if (success === 'true' && connected === 'aweber') {
      toast({
        title: 'Conectat cu succes!',
        description: 'AWeber a fost conectat cu succes. Acum poți folosi newsletter-ul!',
      })
      setIsAWeberConnected(true)
    } else if (error) {
      toast({
        title: 'Eroare la conectare',
        description: `Nu s-a putut conecta la AWeber: ${error}`,
        variant: 'destructive',
      })
    }
  }, [searchParams, toast])

  const handleConnectAWeber = () => {
    window.location.href = '/api/auth/aweber?action=connect'
  }

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
      toast({ title: 'Gata!', description: 'Verifică mail-ul!' })
      setEmail('')
    } catch (err: any) {
      toast({ title: 'Eroare', description: err.message, variant: 'destructive' })
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

      <div className="relative z-10 flex items-center justify-center min-h-[inherit] w-full px-4 py-12">
        <div className="w-full max-w-xl bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Abonează-te la newsletter-ul nostru
          </h1>
          <p className="mt-2 text-gray-700">
            Primește actualizări despre produse, listări noi și oferte exclusive direct în inbox-ul tău.
          </p>

          {!isAWeberConnected && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                Pentru a folosi newsletter-ul, conectează-te mai întâi la AWeber:
              </p>
              <Button 
                onClick={handleConnectAWeber}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Conectează-te la AWeber
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="tu@companie.ro"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/95"
            />
            <Button type="submit" disabled={isLoading || !isAWeberConnected} className="shrink-0">
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
