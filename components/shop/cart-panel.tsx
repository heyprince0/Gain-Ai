'use client'

import { useEffect } from 'react'   // <--- add useEffect
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { calculateDiscountedPrice } from './discount-badge'
import { CartItem } from './types'
import { EmptyState } from './empty-state'
import { useBottomNav } from '@/contexts/bottom-nav-context'   // <--- new import

export interface CartPanelProps {
  isOpen: boolean
  items: CartItem[]
  onClose: () => void
  onQuantityChange: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onPlaceOrder: () => void
  isPlacingOrder?: boolean
}

export function CartPanel({
  isOpen,
  items,
  onClose,
  onQuantityChange,
  onRemoveItem,
  onPlaceOrder,
  isPlacingOrder = false,
}: CartPanelProps) {
  const { setShowBottomNav } = useBottomNav()

  // Hide bottom nav when cart is open
  useEffect(() => {
    setShowBottomNav(!isOpen)
    return () => setShowBottomNav(true)  // reset when unmounted
  }, [isOpen, setShowBottomNav])

  const subtotal = items.reduce((sum, item) => {
    const discountedPrice = calculateDiscountedPrice(
      item.product.price,
      item.product.discount_type,
      item.product.discount_value
    )
    return sum + discountedPrice * item.quantity
  }, 0)

  const isEmpty = items.length === 0

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Your Cart {items.length > 0 && `(${items.length})`}
          </SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<ShoppingCart className="size-12 text-primary" />}
              title="Cart is Empty"
              description="Add products to your cart to get started"
              action={
                <Button onClick={onClose} variant="outline" className="mt-4">
                  Continue Shopping
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => {
                  const discountedPrice = calculateDiscountedPrice(
                    item.product.price,
                    item.product.discount_type,
                    item.product.discount_value
                  )
                  const itemTotal = discountedPrice * item.quantity
                  const hasDiscount = discountedPrice < item.product.price

                  return (
                    <div key={item.product.id} className="space-y-2 pb-4 border-b border-border/50 last:border-0">
                      {/* Product Info */}
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="size-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          {item.product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={item.product.image_url} 
                              alt={item.product.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <ShoppingCart className="size-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {item.product.name}
                          </h4>
                          <div className="mt-1 flex items-baseline gap-1">
                            <p className="text-sm font-bold text-foreground">
                              ₹{discountedPrice.toFixed(0)}
                            </p>
                            {hasDiscount && (
                              <p className="text-xs text-muted-foreground line-through">
                                ₹{item.product.price}
                              </p>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Total: ₹{itemTotal.toFixed(0)}
                          </p>
                        </div>
                      </div>

                      {/* Quantity & Remove */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onQuantityChange(
                                item.product.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="size-7 p-0"
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onQuantityChange(item.product.id, item.quantity + 1)
                            }
                            className="size-7 p-0"
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 size-auto"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <SheetFooter className="border-t border-border/50 gap-3 pt-4">
              <div className="w-full space-y-3">
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-semibold text-foreground">₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-base font-bold bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">
                    ₹{subtotal.toFixed(0)}
                  </span>
                </div>

                <Button
                  onClick={onPlaceOrder}
                  disabled={isEmpty || isPlacingOrder}
                  className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold hover:from-[#00dd77] hover:to-[#00bb5a] text-sm py-2 h-10"
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </Button>

                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full text-sm py-2 h-10"
                >
                  Continue Shopping
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
