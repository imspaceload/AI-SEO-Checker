import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// Map plan IDs to Stripe price IDs (set in Vercel env vars)
export function getStripePriceId(plan: string): string | null {
  switch (plan) {
    case "starter":
      return process.env.STRIPE_STARTER_PRICE_ID || null;
    case "professional":
      return process.env.STRIPE_PROFESSIONAL_PRICE_ID || null;
    case "enterprise":
      return process.env.STRIPE_ENTERPRISE_PRICE_ID || null;
    default:
      return null;
  }
}
