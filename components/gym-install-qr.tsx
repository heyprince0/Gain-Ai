'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GymInstallQr({ gymId, gymName }: { gymId: string; gymName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/install?gym=${encodeURIComponent(gymId)}`

  useEffect(() => {
    if (!canvasRef.current || !url) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#101828', light: '#ffffff' },
    })
      .then(() => setReady(true))
      .catch(() => setReady(false))
  }, [url])

  function download() {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `${gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'gym'}-install-qr.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="rounded-2xl border-4 border-foreground bg-white p-3 shadow-sm">
        <canvas ref={canvasRef} aria-label={`Install QR code for ${gymName}`} className="size-52 max-w-full" />
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        Print this and put it up at your gym. Scanning it takes new members straight to installing the
        GainAi app under your gym's name.
      </p>
      <Button onClick={download} disabled={!ready}>
        <Download data-icon="inline-start" />
        Download PNG
      </Button>
    </div>
  )
}
