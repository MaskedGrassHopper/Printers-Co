import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    tokens: number;
    lastRefill: number;
  }
}

// In-memory store - consider using Redis for production
const store: RateLimitStore = {}

// Configurable rate limiting parameters
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_TOKENS = 60 // Maximum requests per window
const REFILL_RATE = MAX_TOKENS / RATE_LIMIT_WINDOW // Tokens per ms

export function rateLimit(req: NextRequest) {
  // Extract IP or user identifier - prefer user token if authenticated
  const identifier = req.ip || 'anonymous'
  
  const now = Date.now()
  
  // Initialize or get bucket
  if (!store[identifier]) {
    store[identifier] = {
      tokens: MAX_TOKENS,
      lastRefill: now,
    }
  }

  const bucket = store[identifier]
  const timePassed = now - bucket.lastRefill
  
  // Refill tokens based on time passed
  bucket.tokens = Math.min(
    MAX_TOKENS,
    bucket.tokens + timePassed * REFILL_RATE
  )
  bucket.lastRefill = now

  // Check if request can be processed
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return null // Allow request
  }

  // Clean up old entries periodically
  if (Math.random() < 0.001) { // 0.1% chance to run cleanup
    const expiryTime = now - RATE_LIMIT_WINDOW * 2
    for (const key in store) {
      if (store[key].lastRefill < expiryTime) {
        delete store[key]
      }
    }
  }

  return new NextResponse(JSON.stringify({
    error: 'Too Many Requests',
    retryAfter: Math.ceil((1 - bucket.tokens) / REFILL_RATE)
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': Math.ceil((1 - bucket.tokens) / REFILL_RATE).toString()
    }
  })
} 