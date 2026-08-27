'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Copy, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GymInstallQr({ slug, gymName }: { slug: string; gymName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [copied, setCopied] = useState(false)
  const installUrl = `https://app.gainai.space/g/${encodeURIComponent(slug)}`

  useEffect(() => {
    if (!canvasRef.current) return
    setStatus('loading')
    QRCode.toCanvas(canvasRef.current, installUrl, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#101828', light: '#ffffff' } })
      .then(() => setStatus('ready'))
      .catch(() => setStatus('error'))
  }, [installUrl])

  async function copy() {
    await navigator.clipboard.writeText(installUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  function download() {
    if (!canvasRef.current || status !== 'ready') return
    const link = document.createElement('a')
    link.download = `${gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'gym'}-install-qr.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return <div className="flex flex-col items-center gap-5 text-center">
    <div className="rounded-2xl border-4 border-foreground bg-white p-3 shadow-sm">
      {status === 'error' ? <p className="flex size-52 items-center justify-center p-4 text-sm text-destructive">QR code unavailable. Use the link below.</p> : <canvas ref={canvasRef} aria-label={`Install QR code for ${gymName}`} className="size-52 max-w-full" />}
    </div>
    <p className="max-w-sm text-sm text-muted-foreground">Scan this QR to open the branded <strong>{gymName}</strong> app.</p>
    <p className="max-w-full break-all font-mono text-xs text-muted-foreground">{installUrl}</p>
    <div className="flex flex-wrap justify-center gap-2">
      <Button onClick={copy} variant="outline" disabled={status !== 'ready'}>{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}{copied ? 'Copied' : 'Copy link'}</Button>
      <Button onClick={download} disabled={status !== 'ready'}><Download data-icon="inline-start" />Download PNG</Button>
      <Button asChild variant="ghost"><a href={`/g/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer"><ExternalLink data-icon="inline-start" />Preview</a></Button>
    </div>
  </div>
}
