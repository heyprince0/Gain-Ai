'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function BrandingCard({ gymId }: { gymId: string }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState('#00ff88')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('gyms')
      .select('logo_url, brand_color')
      .eq('id', gymId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLogoUrl(data.logo_url)
          setBrandColor(data.brand_color || '#00ff88')
        }
      })
  }, [gymId])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function save() {
    setBusy(true)
    let newLogoUrl = logoUrl

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${gymId}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('gym-logos')
        .upload(path, file, { upsert: true, cacheControl: '3600' })

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('gym-logos').getPublicUrl(path)
        // Cache-bust so browsers/PWA re-fetch the new logo instead of an old cached one.
        newLogoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`
      }
    }

    await supabase
      .from('gyms')
      .update({ logo_url: newLogoUrl, brand_color: brandColor })
      .eq('id', gymId)

    setLogoUrl(newLogoUrl)
    setFile(null)
    setPreview(null)
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>App branding</CardTitle>
        <CardDescription>
          Shown as your gym's own app name and icon when members install it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/30 hover:bg-muted/50"
          >
            {preview || logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview || logoUrl || ''} alt="Gym logo" className="size-full object-cover" />
            ) : (
              <ImagePlus className="size-5 text-muted-foreground" />
            )}
          </button>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Gym logo</p>
            <p className="text-xs text-muted-foreground">Square image works best, at least 512×512px.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Brand color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="size-10 rounded-lg border border-border/50"
            />
            <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="max-w-[140px]" />
          </div>
        </div>

        <Button onClick={save} disabled={busy} className="w-fit">
          {busy ? 'Saving...' : saved ? 'Saved ✓' : 'Save branding'}
        </Button>
      </CardContent>
    </Card>
  )
}
