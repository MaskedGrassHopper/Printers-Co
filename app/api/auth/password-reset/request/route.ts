import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email'; // You'll need to implement this

const prisma = new PrismaClient();

// Initialize Redis for rate limiting and token storage
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Create a new ratelimiter that allows 3 requests per hour
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1h'),
});

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }, // Optimize query
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists, you will receive a reset email.'
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token in Redis with expiration
    await redis.set(
      `password_reset:${token}`,
      user.id,
      { ex: 3600 } // 1 hour expiration
    );

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

    // Send email asynchronously to improve response time
    sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Click the following link to reset your password: ${resetUrl}`,
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    }).catch(console.error); // Log errors but don't wait for email to send

    return NextResponse.json({
      message: 'If an account exists, you will receive a reset email.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 