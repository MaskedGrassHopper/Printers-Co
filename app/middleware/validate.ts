import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod' // We'll need to install this

type ValidationSchema = z.ZodType<any, any>

export function validateRequest(schema: ValidationSchema) {
  return async (req: NextRequest) => {
    try {
      // Only parse the body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        const body = await req.json()
        schema.parse(body)
      } else if (req.method === 'GET') {
        // For GET requests, validate query parameters
        const url = new URL(req.url)
        const queryParams = Object.fromEntries(url.searchParams)
        schema.parse(queryParams)
      }
      
      return null // Validation passed
    } catch (error) {
      // Efficiently handle validation errors
      if (error instanceof z.ZodError) {
        return new NextResponse(JSON.stringify({
          error: 'Validation Error',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }
      
      // Handle unexpected errors
      return new NextResponse(JSON.stringify({
        error: 'Internal Server Error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
  }
} 