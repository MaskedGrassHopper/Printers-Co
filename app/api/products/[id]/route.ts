import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, ProductResponse, UpdateProductRequest } from '@/types/api'
import { ApiError, handleError, requireRole, slugify } from '@/lib/api-utils'
import { UserRole } from '@/types/api'

export const runtime = 'edge'
export const revalidate = 60

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            isMain: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    if (!product) {
      throw new ApiError(404, 'Product not found')
    }

    return NextResponse.json({
      data: product,
      status: 200
    } as ApiResponse<ProductResponse>)

  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN, UserRole.VENDOR])
    
    const json = await request.json()
    const { name, description, price, stock, isPublished, specifications, categoryIds }: UpdateProductRequest = json

    const updateData: any = {
      ...(name && { name, slug: slugify(name) }),
      ...(description && { description }),
      ...(price && { price }),
      ...(stock !== undefined && { stock }),
      ...(isPublished !== undefined && { isPublished }),
      ...(specifications && { specifications })
    }

    if (categoryIds) {
      updateData.categories = {
        set: categoryIds.map(id => ({ id }))
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            isMain: true
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    return NextResponse.json({
      data: product,
      status: 200
    } as ApiResponse<ProductResponse>)

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

    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      status: 204
    } as ApiResponse<void>)

  } catch (error) {
    return handleError(error)
  }
} 