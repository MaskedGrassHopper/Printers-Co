import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, UserResponse, PaginatedResponse } from '@/types/api'
import { ApiError, handleError, requireRole, CACHE_CONFIG } from '@/lib/api-utils'
import { UserRole } from '@/types/api'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, [UserRole.ADMIN])

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)
    const role = searchParams.get('role') as UserRole | null
    const search = searchParams.get('search')

    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          isActive: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: {
        items: users,
        total,
        page,
        totalPages,
        hasMore: page < totalPages
      },
      status: 200
    } as ApiResponse<PaginatedResponse<UserResponse>>, {
      headers: CACHE_CONFIG.PRIVATE // Don't cache user data
    })

  } catch (error) {
    return handleError(error)
  }
} 