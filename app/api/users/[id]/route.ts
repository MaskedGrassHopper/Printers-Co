import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, UserResponse, UpdateUserRequest } from '@/types/api'
import { ApiError, handleError, requireRole } from '@/lib/api-utils'
import { UserRole } from '@/types/api'
import bcrypt from 'bcryptjs'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN])

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isActive: true,
        _count: {
          select: {
            orders: true,
            products: true
          }
        }
      }
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    return NextResponse.json({
      data: user,
      status: 200
    } as ApiResponse<UserResponse & { _count: { orders: number; products: number } }>)

  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN])
    
    const json = await request.json()
    const { name, password, role, isActive }: UpdateUserRequest & {
      role?: UserRole;
      isActive?: boolean;
    } = json

    const updateData: any = {
      ...(name !== undefined && { name }),
      ...(password && { password: await bcrypt.hash(password, 10) }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    })

    return NextResponse.json({
      data: user,
      status: 200
    } as ApiResponse<UserResponse>)

  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN])

    // Check if user has any orders or products
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        _count: {
          select: {
            orders: true,
            products: true
          }
        }
      }
    })

    if ((user?._count.orders ?? 0) > 0 || (user?._count.products ?? 0) > 0) {
      // Instead of deleting, just deactivate the user
      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false }
      })

      return NextResponse.json({
        status: 200,
        data: { message: 'User deactivated' }
      } as ApiResponse<{ message: string }>)
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      status: 204
    } as ApiResponse<void>)

  } catch (error) {
    return handleError(error)
  }
} 