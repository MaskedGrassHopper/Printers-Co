import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, CategoryResponse, CreateCategoryRequest } from '@/types/api'
import { ApiError, handleError, requireRole, slugify, CACHE_CONFIG } from '@/lib/api-utils'
import { UserRole } from '@/types/api'

export const runtime = 'edge'
export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      data: categories,
      status: 200
    } as ApiResponse<CategoryResponse[]>, {
      headers: CACHE_CONFIG.LONG
    })

  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, [UserRole.ADMIN])
    
    const json = await request.json()
    const { name, description, parentId }: CreateCategoryRequest = json

    if (!name) {
      throw new ApiError(400, 'Name is required')
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: slugify(name),
        description,
        parentId
      }
    })

    return NextResponse.json({
      data: category,
      status: 201
    } as ApiResponse<CategoryResponse>)

  } catch (error) {
    return handleError(error)
  }
} 