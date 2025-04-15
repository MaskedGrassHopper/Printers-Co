import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface CacheConfig {
  duration: number; // Cache duration in seconds
  varyByHeaders?: string[]; // Headers to vary cache by
  varyByQuery?: string[]; // Query params to vary cache by
}

interface CacheEntry {
  response: Response;
  timestamp: number;
}

// In-memory cache store - consider using Redis for production
const cacheStore = new Map<string, CacheEntry>()

// Efficient cache key generation
function generateCacheKey(req: NextRequest, config: CacheConfig): string {
  const url = new URL(req.url)
  const parts = [url.pathname]
  
  // Add relevant query parameters
  if (config.varyByQuery?.length) {
    const queryParams = new URLSearchParams(url.search)
    const relevantParams = config.varyByQuery
      .map(param => `${param}=${queryParams.get(param) || ''}`)
      .sort()
      .join('&')
    if (relevantParams) parts.push(relevantParams)
  }
  
  // Add relevant headers
  if (config.varyByHeaders?.length) {
    const headerValues = config.varyByHeaders
      .map(header => `${header}=${req.headers.get(header) || ''}`)
      .sort()
      .join('&')
    if (headerValues) parts.push(headerValues)
  }
  
  return parts.join('|')
}

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of cacheStore.entries()) {
    if (now - entry.timestamp > 24 * 60 * 60 * 1000) { // Remove entries older than 24h
      cacheStore.delete(key)
    }
  }
}, 60 * 60 * 1000) // Run every hour

export function cache(config: CacheConfig) {
  return async (req: NextRequest) => {
    // Only cache GET requests
    if (req.method !== 'GET') return null
    
    const cacheKey = generateCacheKey(req, config)
    const now = Date.now()
    
    // Check cache
    const cached = cacheStore.get(cacheKey)
    if (cached && (now - cached.timestamp) / 1000 < config.duration) {
      // Clone the cached response
      const response = new NextResponse(cached.response.body, cached.response)
      response.headers.set('X-Cache', 'HIT')
      return response
    }
    
    // If not in cache, return null to let the request proceed
    return null
  }
}

export function setCacheResponse(req: NextRequest, response: NextResponse, config: CacheConfig) {
  if (req.method === 'GET') {
    const cacheKey = generateCacheKey(req, config)
    cacheStore.set(cacheKey, {
      response: response.clone(),
      timestamp: Date.now()
    })
    response.headers.set('X-Cache', 'MISS')
  }
  return response
} 