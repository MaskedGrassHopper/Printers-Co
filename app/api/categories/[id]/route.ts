import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, CategoryResponse, UpdateCategoryRequest } from '@/types/api'
import { ApiError, handleError, requireRole, slugify, CACHE_CONFIG } from '@/lib/api-utils'
import { UserRole } from '@/types/api'

export const runtime = 'edge'
export const revalidate = 3600

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true }
        }
      }
    })

    if (!category) {
      throw new ApiError(404, 'Category not found')
    }

    return NextResponse.json({
      data: category,
      status: 200
    } as ApiResponse<CategoryResponse>, {
      headers: CACHE_CONFIG.LONG
    })

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
    const { name, description, parentId }: UpdateCategoryRequest = json

    const updateData: any = {
      ...(name && { name, slug: slugify(name) }),
      ...(description !== undefined && { description }),
      ...(parentId !== undefined && { parentId })
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      data: category,
      status: 200
    } as ApiResponse<CategoryResponse>)

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

    // Check if category has products
    const count = await prisma.category.findUnique({
      where: { id: params.id },
      select: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (count?._count.products ?? 0 > 0) {
      throw new ApiError(400, 'Cannot delete category with products')
    }

    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      status: 204
    } as ApiResponse<void>)

  } catch (error) {
    return handleError(error)
  }
} 