'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ImagePlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser' // ← CHANGED

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discount_type: '' as '' | 'percentage' | 'fixed',
    discount_value: '',
    discount_label: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProduct() {
      try {
        const { data, error } = await supabase
          .from('gym_products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error) throw error
        if (!data) {
          setError('Product not found')
          return
        }

        setForm({
          name: data.name,
          description: data.description || '',
          price: String(data.price),
          discount_type: data.discount_type || '',
          discount_value: data.discount_value ? String(data.discount_value) : '',
          discount_label: data.discount_label || '',
        })
        setExistingImageUrl(data.image_url)
        setImagePreview(data.image_url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (productId) void loadProduct()
  }, [productId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      const price = Number(form.price)
      if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
        throw new Error('Enter a valid product name and price.')
      }

      let discountType: 'percentage' | 'fixed' | null = null
      let discountValue: number | null = null
      if (form.discount_type && form.discount_value) {
        const val = Number(form.discount_value)
        if (val > 0) {
          discountType = form.discount_type
          discountValue = val
          if (discountType === 'percentage' && val > 100) {
            throw new Error('Percentage discount cannot exceed 100%.')
          }
        }
      }

      let imageUrl = existingImageUrl
      if (imageFile) {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) throw new Error('Not authenticated')

        const { data: gym } = await supabase
          .from('gyms')
          .select('id')
          .eq('owner_id', userData.user.id)
          .maybeSingle()

        if (!gym) throw new Error('Gym not found')

        const ext = imageFile.name.split('.').pop()
        const path = `${gym.id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('gym-products')
          .upload(path, imageFile, { cacheControl: '3600' })
        if (uploadError) throw uploadError
        const { data: publicUrlData } = supabase.storage.from('gym-products').getPublicUrl(path)
        imageUrl = publicUrlData.publicUrl
      }

      const { error: updateError } = await supabase
        .from('gym_products')
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price,
          image_url: imageUrl,
          discount_type: discountType,
          discount_value: discountValue,
          discount_label: form.discount_label.trim() || null,
        })
        .eq('id', productId)

      if (updateError) throw updateError

      router.push('/gym-owner/shop')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <GymOwnerShell title="Edit Product">
        <p className="text-sm text-muted-foreground">Loading product...</p>
      </GymOwnerShell>
    )
  }

  if (error && !loading) {
    return (
      <GymOwnerShell title="Edit Product">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </GymOwnerShell>
    )
  }

  return (
    <GymOwnerShell title="Edit Product">
      <div className="max-w-lg mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
            <CardDescription>Update the product details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Product photo (optional)</Label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 hover:bg-muted/50"
                >
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                      <ImagePlus className="size-5" />
                      Tap to add a photo
                    </span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {existingImageUrl && !imageFile && (
                  <p className="text-xs text-muted-foreground mt-1">Current photo shown. Upload a new one to replace it.</p>
                )}
              </div>

              <div>
                <Label>Product name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Price (₹)</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount type</Label>
                  <Select
                    value={form.discount_type || 'none'}
                    onValueChange={(val) => {
                      setForm({
                        ...form,
                        discount_type: val === 'none' ? '' : val as '' | 'percentage' | 'fixed',
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount value</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 20 or 100"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    disabled={!form.discount_type}
                  />
                </div>
              </div>

              <div>
                <Label>Discount label (optional)</Label>
                <Input
                  placeholder="e.g. Summer Sale"
                  value={form.discount_label}
                  onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </GymOwnerShell>
  )
}
