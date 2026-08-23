'use client'

import { ProductCard, ProductCardProps } from './product-card'

export interface ProductGridProps {
  products: Array<ProductCardProps & { id: string }>
  loadingProductId?: string | null
  onAddToCart: (productId: string) => void
}

export function ProductGrid({ products, loadingProductId, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No products available in your gym shop yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          isLoading={loadingProductId === product.id}
          onAddToCart={() => onAddToCart(product.id)}
        />
      ))}
    </div>
  )
}
