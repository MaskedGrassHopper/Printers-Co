import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, OrderResponse } from '@/types/api'
import { ApiError, handleError, getCurrentUser } from '@/lib/api-utils'
import { UserRole } from '@/types/api'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getCurrentUser(request)
    const isAdmin = token.role === UserRole.ADMIN

    const order = await prisma.order.findUnique({
      where: {
        id: params.id,
        ...(isAdmin ? {} : { userId: token.id })
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
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!order) {
      throw new ApiError(404, 'Order not found')
    }

    return NextResponse.json({
      data: order,
      status: 200
    } as ApiResponse<OrderResponse>)

  } catch (error) {
    return handleError(error)
  }
} 