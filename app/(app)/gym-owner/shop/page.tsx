'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Package, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser' // ← CHANGED

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
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
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

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      await supabase.from('gym_product_orders').update({ status }).eq('id', orderId)
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)))
    } catch (err) {
      console.error('Error updating order status:', err)
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
            <Link href="/gym-owner/shop/add">
              <Button>
                <Plus className="mr-2 size-4" />
                Add Product
              </Button>
            </Link>
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
                const discountedPrice = product.discount_type && product.discount_value
                  ? product.discount_type === 'percentage'
                    ? product.price * (1 - product.discount_value / 100)
                    : Math.max(0, product.price - product.discount_value)
                  : null

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
                        <div className="flex flex-col gap-1">
                          <Link href={`/gym-owner/shop/edit/${product.id}`}>
                            <Button variant="ghost" size="icon" className="size-8">
                              <Edit className="size-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setProductToDelete(product)}
                            className="text-muted-foreground hover:text-destructive size-8"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
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

      {/* Delete Confirmation Dialog */}
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
