import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, OrderResponse, CreateOrderRequest, PaginatedResponse } from '@/types/api'
import { ApiError, handleError, getCurrentUser, requireRole, CACHE_CONFIG } from '@/lib/api-utils'
import { OrderStatus, UserRole } from '@/types/api'
import type { Prisma } from '@prisma/client'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const token = await getCurrentUser(request)
    const isAdmin = token.role === UserRole.ADMIN

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)
    const status = searchParams.get('status') as OrderStatus | null

    const where = {
      ...(status && { status }),
      ...(!isAdmin && { userId: token.id })
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: {
        items: orders,
        total,
        page,
        totalPages,
        hasMore: page < totalPages
      },
      status: 200
    } as ApiResponse<PaginatedResponse<OrderResponse>>, {
      headers: CACHE_CONFIG.PRIVATE
    })

  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getCurrentUser(request)
    
    const json = await request.json()
    const { items }: CreateOrderRequest = json

    if (!items?.length) {
      throw new ApiError(400, 'Order must contain at least one item')
    }

    // Get products and validate stock
    const products = await Promise.all(
      items.map(item =>
        prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, price: true, stock: true }
        })
      )
    )

    // Validate all products exist and have sufficient stock
    items.forEach((item, index) => {
      const product = products[index]
      if (!product) {
        throw new ApiError(400, `Product ${item.productId} not found`)
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for product ${item.productId}`)
      }
    })

    // Calculate total
    const total = items.reduce((sum, item, index) => {
      const product = products[index]!
      return sum + product.price.mul(item.quantity)
    }, 0)

    // Create order and update stock in transaction
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId: token.id,
          status: OrderStatus.PENDING,
          total,
          items: {
            create: items.map((item, index) => ({
              quantity: item.quantity,
              price: products[index]!.price,
              productId: item.productId
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      })

      // Update stock
      await Promise.all(
        items.map((item, index) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        )
      )

      return order
    })

    return NextResponse.json({
      data: order,
      status: 201
    } as ApiResponse<OrderResponse>)

  } catch (error) {
    return handleError(error)
  }
} 