import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

// Simple in-memory rate limiter (per IP, per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(ip: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(rateLimitMap.keys());
  keys.forEach((key) => {
    const value = rateLimitMap.get(key);
    if (value && now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}, 60000);
