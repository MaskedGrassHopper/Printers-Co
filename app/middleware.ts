import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './middleware/rateLimit'
import { validateRequest } from './middleware/validate'
import { cache, setCacheResponse } from './middleware/cache'
import { z } from 'zod'

interface RouteConfig {
  cache?: {
    duration: number;
    varyByQuery?: string[];
  };
  rateLimit?: boolean;
  validate?: {
    [key: string]: z.ZodType<any, any>;
  };
}

interface Routes {
  [path: string]: RouteConfig;
}

// Define route-specific configurations
const routes: Routes = {
  '/api/products': {
    cache: {
      duration: 300, // 5 minutes
      varyByQuery: ['category', 'page', 'limit'],
    },
    rateLimit: true,
    validate: {
      GET: z.object({
        category: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
      POST: z.object({
        name: z.string().min(1),
        description: z.string(),
        price: z.number().positive(),
      }),
    },
  },
  '/api/users': {
    rateLimit: true,
    validate: {
      GET: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
      POST: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    },
  },
  '/api/orders': {
    rateLimit: true,
    validate: {
      GET: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        status: z.string().optional(),
      }),
      POST: z.object({
        productId: z.number(),
        quantity: z.number().positive(),
        shippingAddress: z.string(),
      }),
    },
  },
  // Default configuration for any API route not explicitly configured
  'default': {
    rateLimit: true,
    cache: {
      duration: 60, // 1 minute default cache
      varyByQuery: ['page', 'limit'],
    },
  }
}

// Helper to get route configuration
function getRouteConfig(pathname: string): RouteConfig {
  return routes[pathname] || routes['default']
}

// Middleware configuration
export async function middleware(req: NextRequest) {
  const pathname = new URL(req.url).pathname
  
  // Only apply middleware to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const routeConfig = getRouteConfig(pathname)

  try {
    // 1. Rate limiting check (always first)
    if (routeConfig.rateLimit) {
      const rateLimitResult = await rateLimit(req)
      if (rateLimitResult) return rateLimitResult
    }

    // 2. Request validation
    if (routeConfig.validate && routeConfig.validate[req.method || '']) {
      const validateResult = await validateRequest(routeConfig.validate[req.method || ''])(req)
      if (validateResult) return validateResult
    }

    // 3. Cache check (for GET requests)
    if (routeConfig.cache && req.method === 'GET') {
      const cacheResult = await cache(routeConfig.cache)(req)
      if (cacheResult) return cacheResult
    }

    // Add security headers
    const response = await NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Cache the response if applicable
    if (routeConfig.cache && req.method === 'GET') {
      return setCacheResponse(req, response as NextResponse, routeConfig.cache)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
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

// Configure middleware to run on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 