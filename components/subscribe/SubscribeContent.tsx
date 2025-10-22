'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'

export default function SubscribeContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<'seller' | 'buyer' | null>(null)

  // Check for OAuth callback results (keep for compatibility but not needed)
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'true') {
      toast({
        title: 'Abonare reușită!',
        description: 'Te-ai abonat cu succes la newsletter!',
      })
    } else if (error) {
      toast({
        title: 'Eroare la abonare',
        description: `Nu s-a putut finaliza abonarea: ${error}`,
        variant: 'destructive',
      })
    }
  }, [searchParams, toast])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !userType) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          userType,
          tags: [userType, 'newsletter', 'direct-subscription']
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Abonarea a eșuat')
      toast({ title: 'Gata!', description: 'Verifică mail-ul!' })
      setEmail('')
      setUserType(null)
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

          {!userType && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600">Ce tip de utilizator ești?</p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setUserType('seller')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Vânzător
                </Button>
                <Button
                  type="button"
                  onClick={() => setUserType('buyer')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Cumpărător
                </Button>
              </div>
            </div>
          )}

          {userType && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Tip utilizator:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  userType === 'seller' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {userType === 'seller' ? 'Vânzător' : 'Cumpărător'}
                </span>
                <Button
                  type="button"
                  onClick={() => setUserType(null)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Schimbă
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="tu@companie.ro"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/95"
                />
                <Button type="submit" disabled={isLoading} className="shrink-0">
                  {isLoading ? 'Se abonează…' : 'Abonează-te'}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-3 text-xs text-gray-600">
            Ne pasă de datele tale conform politicii noastre de confidențialitate. Te poți dezabona oricând.
          </p>
        </div>
      </div>
    </div>
  )
}
