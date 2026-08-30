'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

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
      .select('logo_url, primary_color')   // Changed from brand_color
      .eq('id', gymId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLogoUrl(data.logo_url)
          setBrandColor(data.primary_color || '#00ff88')  // Changed from brand_color
        }
      })
  }, [gymId])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(selected.type) || selected.size > 5 * 1024 * 1024) {
      window.alert('Choose a PNG, JPG, or SVG image up to 5MB.')
      e.target.value = ''
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  async function save() {
    const normalizedColor = /^#[0-9a-f]{6}$/i.test(brandColor) ? brandColor : null
    if (!normalizedColor) {
      window.alert('Enter a valid six-digit hex color.')
      return
    }

    setBusy(true)
    let newLogoUrl = logoUrl
    try {
      if (file) {
        const ext = file.type === 'image/svg+xml' ? 'svg' : file.type === 'image/png' ? 'png' : 'jpg'
        const path = `${gymId}/logo-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('gym-logos')
          .upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type })
        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from('gym-logos').getPublicUrl(path)
        newLogoUrl = publicUrlData.publicUrl
      }

      const { error: updateError } = await supabase
        .from('gyms')
        .update({ logo_url: newLogoUrl, primary_color: normalizedColor })   // Changed from brand_color
        .eq('id', gymId)
      if (updateError) throw updateError

      setLogoUrl(newLogoUrl)
      setBrandColor(normalizedColor)
      setFile(null)
      setPreview(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('[v0] Branding save failed:', error)
      window.alert('Could not save branding. Please try again.')
    } finally {
      setBusy(false)
    }
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
