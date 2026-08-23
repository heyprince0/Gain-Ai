'use client'

import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiscountBadge, calculateDiscountedPrice } from './discount-badge'

export interface ProductCardProps {
  id: string
  name: string
  price: number
  imageUrl?: string | null
  discountType?: 'percentage' | 'fixed' | null
  discountValue?: number | null
  onAddToCart: () => void
  isLoading?: boolean
}

export function ProductCard({
  id,
  name,
  price,
  imageUrl,
  discountType,
  discountValue,
  onAddToCart,
  isLoading = false,
}: ProductCardProps) {
  const discountedPrice = calculateDiscountedPrice(price, discountType, discountValue)
  const hasDiscount = discountedPrice < price

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card hover:border-border/80 transition-all duration-200 h-full">
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={imageUrl} 
            alt={name} 
            className="size-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Discount Badge */}
        {hasDiscount && (
          <DiscountBadge 
            discountType={discountType} 
            discountValue={discountValue} 
            price={price}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-h-[2.5rem] flex flex-col gap-1">
          <p className="text-sm font-semibold leading-tight text-foreground line-clamp-2">{name}</p>
        </div>

        {/* Price Section */}
        <div className="flex items-baseline gap-2">
          <p className="text-base font-bold text-foreground">₹{discountedPrice.toFixed(0)}</p>
          {hasDiscount && (
            <p className="text-xs text-muted-foreground line-through">₹{price}</p>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="mt-auto pt-2">
          <Button
            onClick={onAddToCart}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold hover:from-[#00dd77] hover:to-[#00bb5a] text-sm py-2 h-auto"
          >
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}
