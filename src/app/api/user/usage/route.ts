import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimit, isPlanMonthly } from "@/lib/plans";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const plan = (session.user as { plan?: string }).plan || "free";

  const limit = getPlanLimit(plan);
  const isMonthly = isPlanMonthly(plan);

  let promptCount: number;

  if (isMonthly) {
    // Count prompts from start of current month
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
    // Count all prompts ever (free plan)
    promptCount = await prisma.prompt.count({
      where: { userId },
    });
  }

  return NextResponse.json({
    plan,
    promptCount,
    promptLimit: limit,
    isMonthly,
    canCheck: limit === -1 || promptCount < limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - promptCount),
  });
}
