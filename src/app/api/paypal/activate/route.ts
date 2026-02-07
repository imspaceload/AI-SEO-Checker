import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Called after PayPal subscription is approved on the frontend
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subscriptionId, plan } = await req.json();

  if (!subscriptionId || !plan) {
    return NextResponse.json(
      { error: "Missing subscriptionId or plan" },
      { status: 400 }
    );
  }

  const validPlans = ["starter", "professional", "enterprise"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;

  // Verify the subscription with PayPal API
  const baseUrl =
    process.env.PAYPAL_MODE === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  try {
    // Get access token
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();

    // Verify subscription status
    const subRes = await fetch(
      `${baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subData = await subRes.json();

    if (subData.status !== "ACTIVE" && subData.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 400 }
      );
    }

    // Update user plan
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        paypalSubscriptionId: subscriptionId,
      },
    });

    return NextResponse.json({
      success: true,
      plan,
      message: "Subscription activated successfully",
    });
  } catch (error) {
    console.error("PayPal activation error:", error);
    return NextResponse.json(
      { error: "Failed to verify subscription" },
      { status: 500 }
    );
  }
}
