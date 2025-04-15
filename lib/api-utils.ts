import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ApiResponse } from '@/types/api'
import { UserRole } from '@/types/api'

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function getCurrentUser(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) {
    throw new ApiError(401, 'Unauthorized')
  }
  return token
}

export async function requireRole(req: NextRequest, roles: UserRole[]) {
  const token = await getCurrentUser(req)
  if (!roles.includes(token.role as UserRole)) {
    throw new ApiError(403, 'Forbidden')
  }
  return token
}

export function handleError(error: unknown) {
  console.error(error)
  
  if (error instanceof ApiError) {
    return NextResponse.json({
      error: error.message,
      status: error.statusCode
    } as ApiResponse<never>, { status: error.statusCode })
  }

  return NextResponse.json({
    error: 'Internal Server Error',
    status: 500
  } as ApiResponse<never>, { status: 500 })
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const CACHE_CONFIG = {
  DEFAULT: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  LONG: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  PRIVATE: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' }
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function createApiResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    data,
    status,
  }, { status })
}

export function createApiError(
  error: string,
  status: number = 500
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({
    error,
    status,
  }, { status })
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  }
} 