import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// Generic API Response type
export type ApiResponse<T> = {
  data?: T
  error?: string
  status: number
}

// Pagination types
export type PaginationParams = {
  page?: number
  limit?: number
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

// User API types
export type CreateUserRequest = {
  email: string
  name?: string | null
  password: string
}

export type UpdateUserRequest = Partial<CreateUserRequest>

export type UserResponse = {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
}

// Product API types
export type CreateProductRequest = {
  name: string
  description: string
  price: Decimal | number
  stock: number
  isPublished?: boolean
  specifications?: Record<string, any>
  categoryIds?: string[]
}

export type UpdateProductRequest = Partial<CreateProductRequest>

export type ProductResponse = {
  id: string
  name: string
  slug: string
  description: string
  price: Decimal
  stock: number
  isPublished: boolean
  specifications: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  categories: { id: string; name: string }[]
  images: { id: string; url: string; isMain: boolean }[]
}

// Category API types
export type CreateCategoryRequest = {
  name: string
  description?: string
  parentId?: string
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>

export type CategoryResponse = {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}

// Order API types
export type CreateOrderRequest = {
  items: {
    productId: string
    quantity: number
  }[]
}

export type UpdateOrderStatusRequest = {
  status: OrderStatus
}

export type OrderItemResponse = {
  id: string
  quantity: number
  price: Decimal
  product: {
    id: string
    name: string
    slug: string
  }
}

export type OrderResponse = {
  id: string
  status: OrderStatus
  total: Decimal
  items: OrderItemResponse[]
  createdAt: Date
  updatedAt: Date
}

// Product Image types
export type UploadImageRequest = {
  file: File
  alt?: string
}

export type ReorderImagesRequest = {
  imageIds: string[]
}

// Search and filter types
export type ProductFilters = {
  minPrice?: number
  maxPrice?: number
  search?: string
  categoryId?: string
  sortBy?: 'price' | 'name' | 'createdAt'
  order?: 'asc' | 'desc'
} & PaginationParams 