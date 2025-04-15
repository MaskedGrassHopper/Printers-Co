import { NextRequest } from 'next/server'
import { createApiResponse } from '../../lib/api-utils'
import { createHandler } from '../../lib/api-wrapper'
import { NotFoundError, ValidationError, AuthorizationError, ForbiddenError } from '../../lib/errors'

// Mock data for demonstration
const orders = [
  { 
    id: 1, 
    userId: 1, 
    productId: 1, 
    quantity: 2, 
    status: 'pending',
    shippingAddress: '123 Main St'
  },
  { 
    id: 2, 
    userId: 2, 
    productId: 2, 
    quantity: 1, 
    status: 'completed',
    shippingAddress: '456 Oak Ave'
  },
]

export const GET = createHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const status = searchParams.get('status')
  const userId = parseInt(searchParams.get('userId') || '0')

  // Check authentication
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    throw new AuthorizationError('Authentication required')
  }

  // Filter orders
  let filteredOrders = orders
  
  // Filter by status if provided
  if (status) {
    filteredOrders = filteredOrders.filter(o => o.status === status)
  }

  // Users can only see their own orders unless they're admin
  const isAdmin = req.headers.get('x-user-role') === 'admin'
  if (!isAdmin && userId) {
    if (userId !== parseInt(req.headers.get('x-user-id') || '0')) {
      throw new ForbiddenError('Cannot access other users orders')
    }
    filteredOrders = filteredOrders.filter(o => o.userId === userId)
  }

  if (filteredOrders.length === 0) {
    throw new NotFoundError('Orders')
  }

  // Paginate results
  const start = (page - 1) * limit
  const paginatedOrders = filteredOrders.slice(start, start + limit)

  return createApiResponse({
    items: paginatedOrders,
    total: filteredOrders.length,
    page,
    limit,
    hasMore: (page * limit) < filteredOrders.length
  })
})

export const POST = createHandler(async (req: NextRequest) => {
  const body = await req.json()
  const userId = parseInt(req.headers.get('x-user-id') || '0')

  // Check authentication
  if (!req.headers.get('authorization')) {
    throw new AuthorizationError('Authentication required')
  }

  // Validate user ID
  if (!userId) {
    throw new ValidationError('User ID is required')
  }

  // Additional validation
  if (body.quantity <= 0) {
    throw new ValidationError('Quantity must be greater than 0')
  }

  if (!body.shippingAddress) {
    throw new ValidationError('Shipping address is required')
  }

  const newOrder = {
    id: orders.length + 1,
    userId,
    status: 'pending',
    ...body
  }
  orders.push(newOrder)

  return createApiResponse(newOrder, 201)
}) 