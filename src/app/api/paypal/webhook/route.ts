import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayPalWebhook } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Collect PayPal webhook headers
  const headers: Record<string, string> = {};
  for (const key of [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ]) {
    const val = req.headers.get(key);
    if (val) headers[key] = val;
  }

  // Verify webhook signature (skip in dev if no webhook ID)
  if (process.env.PAYPAL_WEBHOOK_ID) {
    const isValid = await verifyPayPalWebhook(body, headers);
    if (!isValid) {
      console.error("PayPal webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  const event = JSON.parse(body);
  const eventType = event.event_type;

  switch (eventType) {
    // Subscription activated (payment successful)
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const subscriptionId = event.resource?.id;
      if (subscriptionId) {
        // User already updated via /api/paypal/activate, but handle idempotently
        const user = await prisma.user.findUnique({
          where: { paypalSubscriptionId: subscriptionId },
        });
        if (user) {
          console.log(`Subscription ${subscriptionId} confirmed for user ${user.id}`);
        }
      }
      break;
    }

    // Subscription cancelled
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      const subscriptionId = event.resource?.id;
      if (subscriptionId) {
        await prisma.user.updateMany({
          where: { paypalSubscriptionId: subscriptionId },
          data: { plan: "free", paypalSubscriptionId: null },
        });
        console.log(`Subscription ${subscriptionId} cancelled/expired, reverted to free`);
      }
      break;
    }

    // Subscription suspended (payment failed)
    case "BILLING.SUBSCRIPTION.SUSPENDED": {
      const subscriptionId = event.resource?.id;
      if (subscriptionId) {
        await prisma.user.updateMany({
          where: { paypalSubscriptionId: subscriptionId },
          data: { plan: "free", paypalSubscriptionId: null },
        });
        console.warn(`Subscription ${subscriptionId} suspended, reverted to free`);
      }
      break;
    }

    // Payment failed
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
      const subscriptionId = event.resource?.id;
      console.warn(`Payment failed for subscription: ${subscriptionId}`);
      break;
    }

    default:
      console.log(`Unhandled PayPal event: ${eventType}`);
  }

  return NextResponse.json({ received: true });
}
