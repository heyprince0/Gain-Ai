'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Package, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
}

type Order = {
  id: string
  quantity: number
  status: string
  created_at: string
  gym_products: { name: string; price: number } | null
  gym_members: { name: string; phone: string } | null
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'delivered', 'cancelled']

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-transparent bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  confirmed: 'border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400',
  delivered: 'border-transparent bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'border-transparent bg-red-500/15 text-red-600 dark:text-red-400',
}

export default function ShopPage() {
  const [gymId, setGymId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [form, setForm] = useState({ name: '', description: '', price: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data: gym } = await supabase
      .from('gyms')
      .select('id')
      .eq('owner_id', userData.user.id)
      .maybeSingle()

    if (!gym) {
      setLoading(false)
      return
    }
    setGymId(gym.id)

    const [{ data: productsData }, { data: ordersData }] = await Promise.all([
      supabase
        .from('gym_products')
        .select('id, name, description, price, image_url, is_active')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('gym_product_orders')
        .select('id, quantity, status, created_at, gym_products(name, price), gym_members(name, phone)')
        .eq('gym_id', gym.id)
        .order('created_at', { ascending: false }),
    ])

    setProducts((productsData ?? []).filter((p) => p.is_active !== false))
    setOrders((ordersData as unknown as Order[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function addProduct(e: FormEvent) {
    e.preventDefault()
    if (!gymId) return
    const price = Number(form.price)
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
      setError('Enter a product name and a valid non-negative price.')
      return
    }
    setBusy(true)
    setError('')

    let imageUrl: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${gymId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('gym-products')
        .upload(path, imageFile, { cacheControl: '3600' })

      if (uploadError) {
        setError('Could not upload image. Please try again.')
        setBusy(false)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('gym-products').getPublicUrl(path)
      imageUrl = publicUrlData.publicUrl
    }

    const { error: insertError } = await supabase.from('gym_products').insert({
      gym_id: gymId,
      name: form.name,
      description: form.description || null,
      price,
      image_url: imageUrl,
    })

    if (insertError) {
      setError(insertError.message)
      setBusy(false)
      return
    }

    setForm({ name: '', description: '', price: '' })
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await load()
    setBusy(false)
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return
    await supabase.from('gym_products').update({ is_active: false }).eq('id', productToDelete.id)
    setProductToDelete(null)
    await load()
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await supabase.from('gym_product_orders').update({ status }).eq('id', orderId)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
  }

  if (loading) {
    return (
      <GymOwnerShell title="Shop">
        <p className="text-sm text-muted-foreground">Loading shop...</p>
      </GymOwnerShell>
    )
  }

  return (
    <GymOwnerShell title="Shop">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>Shown only to your connected members in the GainAi app.</CardDescription>
              </div>
              <Package className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              {products.map((p) => (
                <div className="flex items-center gap-3 rounded-xl border p-4" key={p.id}>
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                    ) : (
                      <Package className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">₹{p.price}</p>
                    {p.description && <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setProductToDelete(p)}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {products.length === 0 && (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No products yet. Add your first one below.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <form onSubmit={addProduct} className="flex flex-col gap-3 border-t pt-5">
              <div className="flex flex-col gap-2">
                <Label>Product photo (optional)</Label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 hover:bg-muted/50"
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
              </div>
              <div className="flex flex-col gap-2">
                <Label>Product name</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Price (₹)</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button disabled={busy}>
                {busy ? 'Adding...' : <><Plus className="mr-2 size-4" />Add product</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Members who've ordered from your shop.</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              <div className="flex flex-col divide-y">
                {orders.map((order) => (
                  <div key={order.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{order.gym_products?.name ?? 'Product removed'}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.gym_members?.name ?? 'Unknown member'} · {order.gym_members?.phone ?? '—'} · Qty {order.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[order.status] ?? ''}>{order.status}</Badge>
                      <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem value={s} key={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{productToDelete?.name}" will stop showing in your members' shop. Past orders for it are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProduct}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GymOwnerShell>
  )
}
