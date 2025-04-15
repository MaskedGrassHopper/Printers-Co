import { NextRequest, NextResponse } from 'next/server'
import { handleError } from './errors'

type ApiHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args)
    } catch (error) {
      const { error: errorDetails, status } = handleError(error)
      return NextResponse.json({ error: errorDetails }, { status })
    }
  }
}

// Performance monitoring wrapper (optional)
export function withPerformanceMonitoring(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, ...args: any[]) => {
    const start = performance.now()
    try {
      const response = await handler(req, ...args)
      const duration = performance.now() - start
      
      // Add timing header for monitoring
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`)
      return response
    } catch (error) {
      const duration = performance.now() - start
      console.error(`Error after ${duration.toFixed(2)}ms:`, error)
      throw error // Let withErrorHandler deal with it
    }
  }
}

// Combine multiple wrappers
export function createHandler(handler: ApiHandler): ApiHandler {
  return withErrorHandler(
    withPerformanceMonitoring(
      handler
    )
  )
} 