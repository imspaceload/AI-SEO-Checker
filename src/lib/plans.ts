export type PlanId = "free" | "starter" | "professional" | "enterprise";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // monthly price in USD
  promptLimit: number; // -1 for unlimited
  isMonthly: boolean; // whether limit resets monthly
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    promptLimit: 10,
    isMonthly: false, // 10 total lifetime
    features: [
      "10 prompt checks (lifetime)",
      "ChatGPT & Perplexity models",
      "Basic ranking results",
      "No prompt deletion",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 49,
    promptLimit: 100,
    isMonthly: true,
    features: [
      "100 prompt checks / month",
      "All 3 AI models (ChatGPT, Perplexity, Gemini)",
      "Website analysis",
      "Long-tail keyword generation",
      "Email support",
    ],
    popular: true,
  },
  professional: {
    id: "professional",
    name: "Professional",
    price: 99,
    promptLimit: 500,
    isMonthly: true,
    features: [
      "500 prompt checks / month",
      "All 3 AI models",
      "Competitor analysis & tracking",
      "Advanced keyword generation",
      "Priority email support",
      "Export results",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    promptLimit: -1, // unlimited
    isMonthly: true,
    features: [
      "Unlimited prompt checks",
      "All 3 AI models",
      "Full competitor intelligence",
      "Custom keyword strategies",
      "Dedicated account manager",
      "API access",
      "Team collaboration",
    ],
  },
};

export function getPlanLimit(plan: string): number {
  return PLANS[plan as PlanId]?.promptLimit ?? 10;
}

export function isPlanMonthly(plan: string): boolean {
  return PLANS[plan as PlanId]?.isMonthly ?? false;
}
