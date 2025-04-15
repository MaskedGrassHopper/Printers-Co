import { NextRequest } from 'next/server'
import { createApiResponse } from '../../lib/api-utils'
import { createHandler } from '../../lib/api-wrapper'
import { NotFoundError, ValidationError } from '../../lib/errors'

// Cache configuration
export const runtime = 'edge'
export const revalidate = 60 // Cache for 1 minute

// Mock data for demonstration
const products = [
  { id: 1, name: 'Laser Printer X1', description: 'High-speed laser printer', price: 299.99 },
  { id: 2, name: 'InkJet Pro', description: 'Professional inkjet printer', price: 199.99 },
]

// GET handler with pagination, filtering, and search
export const GET = createHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  // Filter by category if provided
  let filteredProducts = category 
    ? products.filter(p => p.name.toLowerCase().includes(category.toLowerCase()))
    : products

  if (filteredProducts.length === 0) {
    throw new NotFoundError('Products')
  }

  // Paginate results
  const start = (page - 1) * limit
  const paginatedProducts = filteredProducts.slice(start, start + limit)

  return createApiResponse({
    items: paginatedProducts,
    total: filteredProducts.length,
    page,
    limit,
    hasMore: (page * limit) < filteredProducts.length
  })
})

// POST handler for creating products
export const POST = createHandler(async (req: NextRequest) => {
  const body = await req.json()

  // Additional validation if needed (beyond middleware validation)
  if (body.price <= 0) {
    throw new ValidationError('Price must be greater than 0')
  }

  // Simulate adding a new product
  const newProduct = {
    id: products.length + 1,
    ...body
  }
  products.push(newProduct)

  return createApiResponse(newProduct, 201)
}) 