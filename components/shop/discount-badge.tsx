'use client'

import { Badge } from '@/components/ui/badge'

export interface DiscountBadgeProps {
  discountType?: 'percentage' | 'fixed' | null
  discountValue?: number | null
  price: number
}

export function DiscountBadge({ discountType, discountValue, price }: DiscountBadgeProps) {
  if (!discountValue || discountValue <= 0) {
    return null
  }

  if (discountType === 'percentage') {
    return (
      <Badge className="absolute right-2 top-2 bg-[#00ff88] text-black font-bold">
        {discountValue}% OFF
      </Badge>
    )
  }

  if (discountType === 'fixed') {
    return (
      <Badge className="absolute right-2 top-2 bg-[#00ff88] text-black font-bold">
        ₹{discountValue} OFF
      </Badge>
    )
  }

  return null
}

export function calculateDiscountedPrice(
  price: number,
  discountType?: 'percentage' | 'fixed' | null,
  discountValue?: number | null
): number {
  if (!discountValue || discountValue <= 0) {
    return price
  }

  if (discountType === 'percentage') {
    return price - (price * discountValue) / 100
  }

  if (discountType === 'fixed') {
    return Math.max(0, price - discountValue)
  }

  return price
}
