import { PrismaClient } from './generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Redis } from '@upstash/redis'

// Initialize Redis client for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
})

// Prisma error types for better error handling
export type PrismaError = {
  code: string
  message: string
  meta?: Record<string, any>
}

// Cache configuration
const CACHE_TTL = 60 * 5 // 5 minutes
const CACHE_ENABLED = process.env.NODE_ENV === 'production'

// Create Prisma Client with connection pooling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'minimal',
  }).$extends(withAccelerate())
}

// Ensure only one instance is created (connection pooling)
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

// Utility function to generate cache key
const getCacheKey = (model: string, operation: string, params: any): string => {
  return `${model}:${operation}:${JSON.stringify(params)}`
}

// Generic query wrapper with caching
export async function queryWithCache<T>(
  model: string,
  operation: string,
  queryFn: () => Promise<T>,
  params: any = {},
  ttl: number = CACHE_TTL
): Promise<T> {
  if (!CACHE_ENABLED) {
    return queryFn()
  }

  const cacheKey = getCacheKey(model, operation, params)
  
  try {
    // Try to get from cache first
    const cached = await redis.get<T>(cacheKey)
    if (cached) {
      return cached
    }

    // If not in cache, execute query
    const result = await queryFn()
    
    // Store in cache
    await redis.set(cacheKey, result, {
      ex: ttl
    })
    
    return result
  } catch (error) {
    console.error('Cache operation failed:', error)
    // Fallback to direct query if cache fails
    return queryFn()
  }
}

// Utility to invalidate cache for a model
export async function invalidateCache(model: string, operation?: string): Promise<void> {
  if (!CACHE_ENABLED) return

  try {
    const pattern = operation 
      ? `${model}:${operation}:*`
      : `${model}:*`
    
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache invalidation failed:', error)
  }
}

// Example optimized query functions
export const queries = {
  // Products
  async getProducts(params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    sort?: 'price_asc' | 'price_desc' | 'newest'
  }) {
    const { page = 1, limit = 20, category, search, sort } = params
    const skip = (page - 1) * limit

    return queryWithCache('products', 'list', async () => {
      const where = {
        isPublished: true,
        ...(category && {
          categories: {
            some: {
              slug: category
            }
          }
        }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } }
          ]
        })
      }

      const orderBy = sort === 'price_asc' 
        ? { price: 'asc' as const }
        : sort === 'price_desc'
        ? { price: 'desc' as const }
        : { createdAt: 'desc' as const }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            images: {
              where: { isMain: true },
              take: 1
            },
            categories: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }),
        prisma.product.count({ where })
      ])

      return {
        products,
        total,
        pages: Math.ceil(total / limit)
      }
    }, params)
  },

  // Orders
  async getUserOrders(userId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = params
    const skip = (page - 1) * limit

    return queryWithCache('orders', 'userList', async () => {
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    slug: true,
                    images: {
                      where: { isMain: true },
                      take: 1,
                      select: { url: true }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.order.count({ where: { userId } })
      ])

      return {
        orders,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { userId, ...params })
  },

  // Categories
  async getCategories() {
    return queryWithCache('categories', 'list', () => 
      prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              _count: {
                select: { products: true }
              }
            }
          },
          _count: {
            select: { products: true }
          }
        }
      })
    )
  },
} 