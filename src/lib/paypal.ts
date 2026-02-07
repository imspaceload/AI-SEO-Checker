// PayPal plan ID mapping (set in Vercel env vars)
export function getPayPalPlanId(plan: string): string | null {
  switch (plan) {
    case "starter":
      return process.env.NEXT_PUBLIC_PAYPAL_STARTER_PLAN_ID || null;
    case "professional":
      return process.env.NEXT_PUBLIC_PAYPAL_PROFESSIONAL_PLAN_ID || null;
    case "enterprise":
      return process.env.NEXT_PUBLIC_PAYPAL_ENTERPRISE_PLAN_ID || null;
    default:
      return null;
  }
}

// Verify PayPal webhook signature
export async function verifyPayPalWebhook(
  body: string,
  headers: Record<string, string>
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const baseUrl = process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

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

  const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  const verifyData = await verifyRes.json();
  return verifyData.verification_status === "SUCCESS";
}
