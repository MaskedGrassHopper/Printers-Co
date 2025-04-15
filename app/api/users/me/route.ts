import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, UserResponse, UpdateUserRequest } from '@/types/api'
import { ApiError, handleError, getCurrentUser, CACHE_CONFIG } from '@/lib/api-utils'
import bcrypt from 'bcryptjs'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const token = await getCurrentUser(request)

    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    return NextResponse.json({
      data: user,
      status: 200
    } as ApiResponse<UserResponse>, {
      headers: CACHE_CONFIG.PRIVATE
    })

  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getCurrentUser(request)
    
    const json = await request.json()
    const { name, password }: UpdateUserRequest = json

    const updateData: any = {
      ...(name !== undefined && { name }),
      ...(password && { password: await bcrypt.hash(password, 10) })
    }

    const user = await prisma.user.update({
      where: { id: token.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
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