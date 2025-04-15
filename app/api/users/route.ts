import { NextRequest } from 'next/server'
import { createApiResponse } from '../../lib/api-utils'
import { createHandler } from '../../lib/api-wrapper'
import { NotFoundError, ValidationError, AuthorizationError } from '../../lib/errors'

// Mock data for demonstration
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
]

export const GET = createHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  // Check if user is authenticated (mock check)
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    throw new AuthorizationError('Authentication required')
  }

  // Paginate results
  const start = (page - 1) * limit
  const paginatedUsers = users.slice(start, start + limit)

  if (paginatedUsers.length === 0) {
    throw new NotFoundError('Users')
  }

  return createApiResponse({
    items: paginatedUsers,
    total: users.length,
    page,
    limit,
    hasMore: (page * limit) < users.length
  })
})

export const POST = createHandler(async (req: NextRequest) => {
  const body = await req.json()

  // Additional validation
  if (!body.email?.includes('@')) {
    throw new ValidationError('Invalid email format')
  }

  // Check for duplicate email
  if (users.some(user => user.email === body.email)) {
    throw new ValidationError('Email already exists')
  }

  const newUser = {
    id: users.length + 1,
    ...body
  }
  users.push(newUser)

  return createApiResponse(newUser, 201)
}) 