import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, OrderResponse, UpdateOrderStatusRequest } from '@/types/api'
import { ApiError, handleError, requireRole } from '@/lib/api-utils'
import { UserRole } from '@/types/api'

export const runtime = 'edge'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN])
    
    const json = await request.json()
    const { status }: UpdateOrderStatusRequest = json

    if (!status) {
      throw new ApiError(400, 'Status is required')
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
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

    return NextResponse.json({
      data: order,
      status: 200
    } as ApiResponse<OrderResponse>)

  } catch (error) {
    return handleError(error)
  }
} 