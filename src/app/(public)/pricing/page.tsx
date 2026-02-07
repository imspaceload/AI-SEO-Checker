"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  Check,
  Zap,
  Crown,
  Building2,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { PLANS, PlanId } from "@/lib/plans";

const planIcons: Record<string, React.ElementType> = {
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
};

const planColors: Record<string, { border: string; bg: string; badge: string; btn: string }> = {
  starter: {
    border: "border-brand-500",
    bg: "bg-brand-50",
    badge: "bg-brand-700 text-white",
    btn: "btn-primary",
  },
  professional: {
    border: "border-purple-500",
    bg: "bg-purple-50",
    badge: "bg-purple-700 text-white",
    btn: "bg-purple-700 text-white hover:bg-purple-800",
  },
  enterprise: {
    border: "border-gray-800",
    bg: "bg-gray-50",
    badge: "bg-gray-800 text-white",
    btn: "bg-gray-800 text-white hover:bg-gray-900",
  },
};

export default function PricingPage() {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const currentPlan = (session?.user as { plan?: string })?.plan || "free";

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      window.location.href = "/signup";
      return;
    }

    setLoadingPlan(planId);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session. Please ensure Stripe is configured.");
        setLoadingPlan(null);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoadingPlan(null);
    }
  };

  const paidPlans = (["starter", "professional", "enterprise"] as PlanId[]).map(
    (id) => PLANS[id]
  );

  return (
    <div className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Simple, Transparent Pricing
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
            Choose the plan that fits your needs
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start free with 10 prompt checks. Upgrade anytime to unlock more
            checks and advanced features.
          </p>
        </div>

        {/* Free Tier Banner */}
        <div className="max-w-3xl mx-auto mb-12 bg-gray-50 border border-gray-200 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Free Plan</h3>
            <p className="text-sm text-gray-600 mt-1">
              10 prompt checks for free. No credit card required. Perfect for trying out the platform.
            </p>
          </div>
          <div className="shrink-0 ml-6">
            {currentPlan === "free" ? (
              <span className="badge bg-gray-200 text-gray-700 text-sm px-3 py-1">Current Plan</span>
            ) : (
              <Link href="/signup" className="btn-ghost text-sm border border-gray-300">
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {paidPlans.map((plan) => {
            const Icon = planIcons[plan.id];
            const colors = planColors[plan.id];
            const isCurrent = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 ${
                  plan.popular ? colors.border : "border-gray-200"
                } p-8 flex flex-col`}
              >
                {plan.popular && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 ${colors.badge} text-xs font-semibold px-4 py-1 rounded-full`}
                  >
                    Most Popular
                  </span>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.promptLimit === -1
                      ? "Unlimited prompt checks"
                      : `${plan.promptLimit} prompt checks / month`}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-500 cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${colors.btn} disabled:opacity-50`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        Get {plan.name}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ / Extra Info */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "What counts as a prompt check?",
                a: "Each time you check a search query against an AI model (ChatGPT, Perplexity, or Gemini), it counts as one prompt check. For example, checking one query across 3 models uses 3 prompt checks.",
              },
              {
                q: "Can I delete prompts to get more free checks?",
                a: "No. Free plan prompts cannot be deleted. This ensures fair usage. Upgrade to a paid plan for more monthly checks.",
              },
              {
                q: "What happens when I reach my limit?",
                a: "You'll see a notification to upgrade your plan. Your existing results are always accessible. Upgrade anytime to continue checking.",
              },
              {
                q: "Can I upgrade or downgrade at any time?",
                a: "Yes! You can upgrade your plan at any time. Changes take effect immediately. Contact support for downgrades.",
              },
              {
                q: "Is there a free trial for paid plans?",
                a: "The free plan with 10 prompt checks serves as your trial. Once you see the value, upgrade to any paid plan.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600">
            Not sure which plan is right for you?{" "}
            <Link href="/signup" className="text-brand-700 font-semibold hover:text-brand-800">
              Start free and upgrade later
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
