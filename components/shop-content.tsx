'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Clock, Package, Minus, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
}

type MyOrder = {
  id: string
  quantity: number
  status: string
  created_at: string
  gym_products: { name: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-transparent bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  confirmed: 'border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400',
  delivered: 'border-transparent bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'border-transparent bg-red-500/15 text-red-600 dark:text-red-400',
}

export function ShopContent() {
  const { user } = useAuth()
  const [gymId, setGymId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [orderingId, setOrderingId] = useState<string | null>(null)
  const [justOrderedId, setJustOrderedId] = useState<string | null>(null)

  async function load() {
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.gym_id) {
      setLoading(false)
      return
    }
    setGymId(profile.gym_id)

    const { data: memberRow } = await supabase
      .from('gym_members')
      .select('id')
      .eq('linked_profile_id', user.id)
      .eq('gym_id', profile.gym_id)
      .is('deleted_at', null)
      .maybeSingle()
    setMemberId(memberRow?.id ?? null)

    const [{ data: productsData }, { data: ordersData }] = await Promise.all([
      supabase
        .from('gym_products')
        .select('id, name, description, price, image_url')
        .eq('gym_id', profile.gym_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('gym_product_orders')
        .select('id, quantity, status, created_at, gym_products(name)')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    setProducts(productsData ?? [])
    setQuantities(Object.fromEntries((productsData ?? []).map((p) => [p.id, 1])))
    setOrders((ordersData as unknown as MyOrder[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [user])

  function adjustQty(productId: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] ?? 1) + delta),
    }))
  }

  async function placeOrder(product: Product) {
    if (!user || !gymId) return
    setOrderingId(product.id)

    await supabase.from('gym_product_orders').insert({
      gym_id: gymId,
      product_id: product.id,
      member_id: memberId,
      profile_id: user.id,
      quantity: quantities[product.id] ?? 1,
    })

    setOrderingId(null)
    setJustOrderedId(product.id)
    setTimeout(() => setJustOrderedId(null), 2000)
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }))
    await load()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-6 pb-24">
        <p className="text-sm text-muted-foreground">Loading shop...</p>
      </div>
    )
  }

  // Not connected to any gym — keep the exact original placeholder.
  if (!gymId) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-6 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Supplement Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Get your fitness supplements delivered</p>
        </div>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <ShoppingBag className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Coming Soon!</h2>
              <p className="text-muted-foreground max-w-sm">
                We're working on bringing you the best supplements for your fitness journey.
                Stay tuned for exclusive deals and premium products.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Launching in early 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Gym Shop</h1>
        <p className="text-sm text-muted-foreground mt-1">Products from your gym</p>
      </div>

      {products.length === 0 ? (
        <Card className="rounded-2xl border-border/50">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your gym hasn't added any products yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => {
            const qty = quantities[product.id] ?? 1
            const isOrdering = orderingId === product.id
            const justOrdered = justOrderedId === product.id

            return (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card"
              >
                <div className="aspect-square w-full bg-muted">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package className="size-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div>
                    <p className="text-sm font-semibold leading-tight text-foreground">{product.name}</p>
                    <p className="mt-0.5 text-sm font-medium text-primary">₹{product.price}</p>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 py-1">
                      <button
                        onClick={() => adjustQty(product.id, -1)}
                        className="flex size-6 items-center justify-center rounded-md hover:bg-muted"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-4 text-center text-sm font-medium">{qty}</span>
                      <button
                        onClick={() => adjustQty(product.id, 1)}
                        className="flex size-6 items-center justify-center rounded-md hover:bg-muted"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => placeOrder(product)}
                      disabled={isOrdering}
                      className="w-full rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00cc6a] py-2 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {isOrdering ? 'Ordering...' : justOrdered ? 'Added ✓' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">My Orders</h2>
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl border border-border/50 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{order.gym_products?.name ?? 'Product'}</p>
                  <p className="text-xs text-muted-foreground">Qty {order.quantity}</p>
                </div>
                <Badge className={STATUS_COLORS[order.status] ?? ''}>{order.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
