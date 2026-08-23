export interface Product {
  id: string
  gym_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  discount_type?: 'percentage' | 'fixed' | null
  discount_value?: number | null
  discount_label?: string | null
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  gym_id: string
  product_id: string
  member_id: string | null
  profile_id: string
  quantity: number
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  notes: string | null
  created_at?: string
  updated_at?: string
  gym_products?: {
    name: string
    price: number
    discount_type?: 'percentage' | 'fixed' | null
    discount_value?: number | null
  } | null
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'border-transparent bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  confirmed: 'border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400',
  delivered: 'border-transparent bg-green-500/15 text-green-600 dark:text-green-400',
  cancelled: 'border-transparent bg-red-500/15 text-red-600 dark:text-red-400',
}
