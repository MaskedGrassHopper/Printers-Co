import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types/api'
import { ApiError, handleError, requireRole } from '@/lib/api-utils'
import { UserRole } from '@/types/api'

export const runtime = 'edge'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN, UserRole.VENDOR])

    const formData = await request.formData()
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string | null

    if (!file) {
      throw new ApiError(400, 'No file provided')
    }

    // TODO: Implement Azure Blob Storage upload
    const url = 'temporary-url' // Replace with actual upload logic

    const image = await prisma.productImage.create({
      data: {
        url,
        alt: alt || undefined,
        productId: params.id,
        sortOrder: await prisma.productImage.count({
          where: { productId: params.id }
        })
      }
    })

    return NextResponse.json({
      data: image,
      status: 201
    } as ApiResponse<typeof image>)

  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN, UserRole.VENDOR])
    
    const { imageIds } = await request.json()

    if (!Array.isArray(imageIds)) {
      throw new ApiError(400, 'Invalid image order data')
    }

    // Update sort order for each image
    await Promise.all(
      imageIds.map((id, index) =>
        prisma.productImage.update({
          where: { id },
          data: { sortOrder: index }
        })
      )
    )

    return NextResponse.json({
      status: 200
    } as ApiResponse<void>)

  } catch (error) {
    return handleError(error)
  }
} 