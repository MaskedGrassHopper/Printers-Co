import { NextRequest } from 'next/server'
import { createApiResponse } from '../../lib/api-utils'
import { createHandler } from '../../lib/api-wrapper'
import { NotFoundError, ValidationError, ForbiddenError } from '../../lib/errors'

// Mock data for demonstration
const categories = [
  { id: 1, name: 'Laser Printers', slug: 'laser-printers' },
  { id: 2, name: 'Inkjet Printers', slug: 'inkjet-printers' },
  { id: 3, name: '3D Printers', slug: '3d-printers' },
]

export const GET = createHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  // Paginate results
  const start = (page - 1) * limit
  const paginatedCategories = categories.slice(start, start + limit)

  if (paginatedCategories.length === 0) {
    throw new NotFoundError('Categories')
  }

  return createApiResponse({
    items: paginatedCategories,
    total: categories.length,
    page,
    limit,
    hasMore: (page * limit) < categories.length
  })
})

export const POST = createHandler(async (req: NextRequest) => {
  const body = await req.json()

  // Check if user is admin
  if (req.headers.get('x-user-role') !== 'admin') {
    throw new ForbiddenError('Only admins can create categories')
  }

  // Validate name
  if (!body.name || body.name.trim().length < 2) {
    throw new ValidationError('Category name must be at least 2 characters')
  }

  // Create slug from name
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  // Check for duplicate slug
  if (categories.some(cat => cat.slug === slug)) {
    throw new ValidationError('Category already exists')
  }

  const newCategory = {
    id: categories.length + 1,
    name: body.name,
    slug
  }
  categories.push(newCategory)

  return createApiResponse(newCategory, 201)
}) 