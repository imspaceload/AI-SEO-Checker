import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimit, isPlanMonthly } from "@/lib/plans";

// Save a prompt check to the database
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const plan = (session.user as { plan?: string }).plan || "free";

  // Check plan limits
  const limit = getPlanLimit(plan);
  const isMonthly = isPlanMonthly(plan);

  let promptCount: number;

  if (isMonthly) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    promptCount = await prisma.prompt.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });
  } else {
    promptCount = await prisma.prompt.count({
      where: { userId },
    });
  }

  if (limit !== -1 && promptCount >= limit) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message:
          plan === "free"
            ? "You've used all 10 free prompt checks. Upgrade to Starter ($49/mo) to continue."
            : `You've reached your ${limit} prompt limit for this month. Upgrade your plan for more.`,
        promptCount,
        promptLimit: limit,
      },
      { status: 403 }
    );
  }

  const { query, website, provider, isRanked, position } = await req.json();

  const prompt = await prisma.prompt.create({
    data: {
      userId,
      query,
      website,
      provider,
      isRanked: isRanked || false,
      position: position || null,
    },
  });

  return NextResponse.json({
    prompt,
    promptCount: promptCount + 1,
    promptLimit: limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - promptCount - 1),
  });
}

// Get user's prompts
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const prompts = await prisma.prompt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ prompts });
}
