import { NextResponse } from 'next/server'

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
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