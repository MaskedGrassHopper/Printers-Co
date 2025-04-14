import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Create a new ratelimiter that allows 5 requests per 15 minutes
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15m'),
});

const resetSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const result = resetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Get user ID from Redis
    const userId = await redis.get(`password_reset:${token}`);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear any existing sessions
    await prisma.user.update({
      where: { id: userId as string },
      data: { 
        password: hashedPassword,
        sessions: {
          deleteMany: {} // Clear all sessions for security
        }
      },
    });

    // Delete the used token
    await redis.del(`password_reset:${token}`);

    return NextResponse.json({
      message: 'Password successfully reset'
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 