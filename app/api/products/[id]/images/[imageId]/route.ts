import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types/api'
import { ApiError, handleError, requireRole } from '@/lib/api-utils'
import { UserRole } from '@/types/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN, UserRole.VENDOR])

    await prisma.productImage.delete({
      where: {
        id: params.imageId,
        productId: params.id
      }
    })

    // TODO: Delete from Azure Blob Storage

    return NextResponse.json({
      status: 204
    } as ApiResponse<void>)

  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    await requireRole(request, [UserRole.ADMIN, UserRole.VENDOR])

    // Set all other images as not main
    await prisma.productImage.updateMany({
      where: {
        productId: params.id,
        isMain: true
      },
      data: {
        isMain: false
      }
    })

    // Set this image as main
    const image = await prisma.productImage.update({
      where: {
        id: params.imageId,
        productId: params.id
      },
      data: {
        isMain: true
      }
    })

    return NextResponse.json({
      data: image,
      status: 200
    } as ApiResponse<typeof image>)

  } catch (error) {
    return handleError(error)
  }
} 