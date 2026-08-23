'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock, Package, ShoppingBag, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { CartPanel } from '@/components/shop/cart-panel'
import { EmptyState } from '@/components/shop/empty-state'
import { OrderHistory } from '@/components/shop/order-history'
import { ProductGrid } from '@/components/shop/product-grid'
import { Product } from '@/components/shop/types'

export function ShopContent() {
  const { user } = useAuth()
  const [gymId, setGymId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<import('@/components/shop/types').Order[]>([])
  const [cart, setCart] = useState<import('@/components/shop/types').CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdersLoading, setIsOrdersLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async (profileId: string, currentGymId: string) => {
    setIsOrdersLoading(true)
    const { data, error: ordersError } = await supabase
      .from('gym_product_orders')
      .select('id, gym_id, product_id, member_id, profile_id, quantity, status, notes, created_at, updated_at, gym_products(name, price, discount_type, discount_value)')
      .eq('profile_id', profileId)
      .eq('gym_id', currentGymId)
      .order('created_at', { ascending: false })

    if (ordersError) {
      setError('Unable to load your order history.')
      setOrders([])
    } else {
      setOrders((data ?? []) as import('@/components/shop/types').Order[])
    }
    setIsOrdersLoading(false)
  }, [])

  const loadShop = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      setIsOrdersLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gym_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      setError('Unable to load your gym profile.')
      setIsLoading(false)
      return
    }

    if (!profile?.gym_id) {
      setGymId(null)
      setProducts([])
      setOrders([])
      setIsLoading(false)
      setIsOrdersLoading(false)
      return
    }

    const currentGymId = profile.gym_id as string
    setGymId(currentGymId)

    const [{ data: productsData, error: productsError }, { data: memberRow }] = await Promise.all([
      supabase
        .from('gym_products')
        .select('id, gym_id, name, description, price, image_url, is_active, created_at, updated_at, discount_type, discount_value, discount_label')
        .eq('gym_id', currentGymId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('gym_members')
        .select('id')
        .eq('linked_profile_id', user.id)
        .eq('gym_id', currentGymId)
        .is('deleted_at', null)
        .maybeSingle(),
    ])

    if (productsError) {
      setError('Unable to load shop products.')
    } else {
      setProducts((productsData ?? []) as Product[])
    }
    setMemberId(memberRow?.id ?? null)
    setIsLoading(false)
    await loadOrders(user.id, currentGymId)
  }, [loadOrders, user])

  useEffect(() => {
    void loadShop()
  }, [loadShop])

  const productCards = useMemo(() => products.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    imageUrl: product.image_url,
    discountType: product.discount_type,
    discountValue: product.discount_value ? Number(product.discount_value) : null,
  })), [products])

  function addToCart(productId: string) {
    const product = products.find((item) => item.id === productId)
    if (!product) return

    setCart((current) => {
      const existing = current.find((item) => item.product.id === productId)
      if (existing) {
        return current.map((item) => item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item)
      }
      return [...current, { product, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((current) => current.map((item) => item.product.id === productId
      ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) }
      : item))
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((item) => item.product.id !== productId))
  }

  async function placeOrder() {
    if (!user || !gymId || cart.length === 0) return
    setIsPlacingOrder(true)

    const rows = cart.map((item) => ({
      gym_id: gymId,
      product_id: item.product.id,
      member_id: memberId,
      profile_id: user.id,
      quantity: item.quantity,
      status: 'pending',
    }))

    const { error: insertError } = await supabase.from('gym_product_orders').insert(rows)
    if (insertError) {
      toast.error('Could not place your order. Please try again.')
      setIsPlacingOrder(false)
      return
    }

    setCart([])
    setIsCartOpen(false)
    setIsPlacingOrder(false)
    toast.success('Order placed successfully', { description: 'Your gym will confirm it shortly.' })
    await loadOrders(user.id, gymId)
  }

  if (isLoading) {
    return <div className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-muted-foreground">Loading shop...</div>
  }

  if (!gymId) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Supplement Shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">Get your fitness supplements delivered</p>
        </div>
        <EmptyState
          icon={<ShoppingBag className="size-12 text-primary" />}
          title="Coming Soon"
          description="Connect your profile to a gym to browse its products and place orders."
          action={<div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" />Stay tuned for exclusive deals.</div>}
        />
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Member shop</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Fuel your progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">Curated products from your gym.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setIsCartOpen(true)} aria-label="Open shopping cart" className="relative shrink-0">
          <ShoppingCart className="size-5" />
          {cart.length > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{cart.length}</span>}
        </Button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="mb-5 grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="orders">My Orders {orders.length > 0 && `(${orders.length})`}</TabsTrigger>
        </TabsList>
        <TabsContent value="shop" className="mt-0">
          {products.length === 0 ? (
            <EmptyState icon={<Package className="size-10 text-muted-foreground" />} title="No products available" description="Your gym hasn't added any products yet." />
          ) : <ProductGrid products={productCards} onAddToCart={addToCart} />}
        </TabsContent>
        <TabsContent value="orders" className="mt-0">
          <OrderHistory orders={orders} isLoading={isOrdersLoading} />
        </TabsContent>
      </Tabs>

      <CartPanel
        isOpen={isCartOpen}
        items={cart}
        onClose={() => setIsCartOpen(false)}
        onQuantityChange={updateQuantity}
        onRemoveItem={removeFromCart}
        onPlaceOrder={placeOrder}
        isPlacingOrder={isPlacingOrder}
      />
    </main>
  )
}

export default ShopContent

export { ShoppingBag }

