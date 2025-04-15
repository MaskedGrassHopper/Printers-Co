import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, PaginatedResponse, CreateProductRequest } from '@/types/api'
import type { Prisma } from '@prisma/client'
import { headers } from 'next/headers'

// Cache configuration
export const runtime = 'edge'
export const revalidate = 60 // Cache for 1 minute

// GET handler with pagination, filtering, and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50) // Cap at 50 items
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const search = searchParams.get('search') ?? undefined
    const sortBy = (searchParams.get('sortBy') as 'price' | 'name' | 'createdAt') ?? 'createdAt'
    const order = (searchParams.get('order') as 'asc' | 'desc') ?? 'desc'

    // Build where clause
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(minPrice && { price: { gte: minPrice } }),
      ...(maxPrice && { price: { lte: maxPrice } }),
    }

    // Execute count and find in parallel for performance
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        // Select only needed fields for performance
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: {
        items,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
      status: 200,
    } as ApiResponse<PaginatedResponse<typeof items[0]>>, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[Products API Error]:', error)
    return NextResponse.json({
      error: 'Failed to fetch products',
      status: 500,
    } as ApiResponse<never>, { status: 500 })
  }
}

// POST handler for creating products
export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const { name, description, price }: CreateProductRequest = json

    if (!name || !description || !price) {
      return NextResponse.json({
        error: 'Missing required fields',
        status: 400,
      } as ApiResponse<never>, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
      },
    })

    // Note: Cache invalidation handled by Next.js revalidation

    return NextResponse.json({
      data: product,
      status: 201,
    } as ApiResponse<typeof product>, { status: 201 })
  } catch (error) {
    console.error('[Products API Error]:', error)
    return NextResponse.json({
      error: 'Failed to create product',
      status: 500,
    } as ApiResponse<never>, { status: 500 })
  }
} 