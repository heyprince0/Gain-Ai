'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Package, ImagePlus, X } from 'lucide-react'
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  discount_type: 'percentage' | 'fixed' | null
  discount_value: number | null
  discount_label: string | null
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
  pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  delivered: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ShopPage() {
  const [gymId, setGymId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Form state
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  async function loadData() {
    try {
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
          .select('*')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('gym_product_orders')
          .select('id, quantity, status, created_at, gym_products(name, price), gym_members(name, phone)')
          .eq('gym_id', gym.id)
          .order('created_at', { ascending: false }),
      ])

      setProducts(productsData?.filter(p => p.is_active !== false) ?? [])
      setOrders((ordersData as unknown as Order[]) ?? [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function addProduct(e: FormEvent) {
    e.preventDefault()
    if (!gymId) {
      setError('Gym not found. Please refresh.')
      return
    }
    const price = Number(form.price)
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
      setError('Enter a product name and a valid non-negative price.')
      return
    }

    // Validate discount
    let discountType: 'percentage' | 'fixed' | null = null
    let discountValue: number | null = null
    if (form.discount_type && form.discount_value) {
      const val = Number(form.discount_value)
      if (val > 0) {
        discountType = form.discount_type as 'percentage' | 'fixed'
        discountValue = val
        if (discountType === 'percentage' && val > 100) {
          setError('Percentage discount cannot exceed 100%.')
          return
        }
      }
    }

    setBusy(true)
    setError('')

    let imageUrl: string | null = null
    try {
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
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        image_url: imageUrl,
        discount_type: discountType,
        discount_value: discountValue,
        discount_label: form.discount_label.trim() || null,
      })

      if (insertError) throw insertError

      // Reset form and close dialog
      setForm({ name: '', description: '', price: '', discount_type: '', discount_value: '', discount_label: '' })
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setError('')
      setIsAddDialogOpen(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDeleteProduct() {
    if (!productToDelete) return
    try {
      await supabase.from('gym_products').update({ is_active: false }).eq('id', productToDelete.id)
      setProductToDelete(null)
      await loadData()
    } catch (err) {
      console.error('Error deleting product:', err)
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      await supabase.from('gym_product_orders').update({ status }).eq('id', orderId)
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)))
    } catch (err) {
      console.error('Error updating order status:', err)
    }
  }

  function getDiscountedPrice(product: Product) {
    if (product.discount_type === 'percentage' && product.discount_value) {
      return product.price * (1 - product.discount_value / 100)
    } else if (product.discount_type === 'fixed' && product.discount_value) {
      return Math.max(0, product.price - product.discount_value)
    }
    return null
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
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Your Products</h3>
              <p className="text-sm text-muted-foreground">Manage items available to your members</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Fill in the details below to add a new product to your shop.</DialogDescription>
                </DialogHeader>
                <form onSubmit={addProduct}>
                  <div className="grid gap-4 py-4">
                    {/* Image upload */}
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

                    {/* Discount fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Discount type</Label>
                        <Select
                          value={form.discount_type}
                          onValueChange={(val) => setForm({ ...form, discount_type: val as '' | 'percentage' | 'fixed' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
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
                      <Label>Discount label (optional, e.g. "Summer Sale")</Label>
                      <Input
                        placeholder="e.g. Summer Sale"
                        value={form.discount_label}
                        onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
                      />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={busy}>
                      {busy ? 'Adding...' : 'Add Product'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <Package className="mx-auto size-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">No products yet.</p>
              <p className="text-xs text-muted-foreground">Click "Add Product" to start listing items.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const discountedPrice = getDiscountedPrice(product)
                return (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square relative bg-muted/20">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Package className="size-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {product.discount_type && product.discount_value && (
                        <Badge className="absolute top-2 right-2 bg-red-500/90 text-white border-0">
                          {product.discount_type === 'percentage'
                            ? `${product.discount_value}% OFF`
                            : `₹${product.discount_value} OFF`}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{product.name}</h4>
                          {product.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                          )}
                          <div className="mt-2 flex items-baseline gap-2">
                            {discountedPrice !== null ? (
                              <>
                                <span className="text-lg font-bold text-primary">₹{discountedPrice.toFixed(2)}</span>
                                <span className="text-sm text-muted-foreground line-through">₹{product.price}</span>
                              </>
                            ) : (
                              <span className="text-lg font-bold">₹{product.price}</span>
                            )}
                          </div>
                          {product.discount_label && (
                            <p className="mt-1 text-xs text-muted-foreground">{product.discount_label}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setProductToDelete(product)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Member Orders</h3>
            <p className="text-sm text-muted-foreground">View and update order statuses</p>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <Package className="mx-auto size-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
              <p className="text-xs text-muted-foreground">Orders from members will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{order.gym_products?.name ?? 'Product removed'}</span>
                          <Badge variant="outline" className={STATUS_COLORS[order.status] || ''}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span>
                            <span className="font-medium text-foreground">{order.gym_members?.name ?? 'Unknown'}</span>
                          </span>
                          <span>•</span>
                          <span>{order.gym_members?.phone ?? '—'}</span>
                          <span>•</span>
                          <span>Qty: {order.quantity}</span>
                          <span>•</span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(v) => updateOrderStatus(order.id, v)}
                        >
                          <SelectTrigger className="w-36 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{productToDelete?.name}" will be hidden from your members' shop. Past orders are kept.
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
