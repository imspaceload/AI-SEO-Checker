"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
  Check,
  Zap,
  Crown,
  Building2,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { PLANS, PlanId } from "@/lib/plans";

const planIcons: Record<string, React.ElementType> = {
  starter: Zap,
  professional: Crown,
  enterprise: Building2,
};

const planColors: Record<
  string,
  { border: string; bg: string; badge: string; btn: string }
> = {
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

// PayPal plan IDs (NEXT_PUBLIC_ for client access)
function getPayPalPlanId(plan: string): string | null {
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

function PayPalSubscribeButton({
  planId,
  paypalPlanId,
}: {
  planId: string;
  paypalPlanId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <PayPalButtons
        style={{
          shape: "rect",
          color: "blue",
          layout: "vertical",
          label: "subscribe",
        }}
        createSubscription={(_data, actions) => {
          return actions.subscription.create({
            plan_id: paypalPlanId,
          });
        }}
        onApprove={async (data) => {
          try {
            const res = await fetch("/api/paypal/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscriptionId: data.subscriptionID,
                plan: planId,
              }),
            });

            const result = await res.json();

            if (result.success) {
              router.push("/dashboard?payment=success&plan=" + planId);
            } else {
              setError(result.error || "Failed to activate subscription");
            }
          } catch {
            setError("Something went wrong. Please contact support.");
          }
        }}
        onError={() => {
          setError("PayPal encountered an error. Please try again.");
        }}
      />
      {error && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const { data: session } = useSession();
  const currentPlan = (session?.user as { plan?: string })?.plan || "free";
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);

  useEffect(() => {
    setPaypalClientId(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || null);
  }, []);

  const paidPlans = (["starter", "professional", "enterprise"] as PlanId[]).map(
    (id) => PLANS[id]
  );

  const hasPayPal = !!paypalClientId;

  const content = (
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
              10 prompt checks for free. No credit card required. Perfect for
              trying out the platform.
            </p>
          </div>
          <div className="shrink-0 ml-6">
            {currentPlan === "free" ? (
              <span className="badge bg-gray-200 text-gray-700 text-sm px-3 py-1">
                Current Plan
              </span>
            ) : (
              <Link
                href="/signup"
                className="btn-ghost text-sm border border-gray-300"
              >
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
            const paypalPlanId = getPayPalPlanId(plan.id);

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
                  <div
                    className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}
                  >
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
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA / PayPal Button */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-500 cursor-default"
                  >
                    Current Plan
                  </button>
                ) : !session ? (
                  <Link
                    href="/signup"
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${colors.btn}`}
                  >
                    Sign Up to Subscribe
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : hasPayPal && paypalPlanId ? (
                  <PayPalSubscribeButton
                    planId={plan.id}
                    paypalPlanId={paypalPlanId}
                  />
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <p className="text-xs text-amber-700">
                      Payment not configured yet. Contact admin.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ */}
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
                a: "Yes! You can upgrade your plan at any time. Changes take effect immediately. Cancel anytime from your PayPal account.",
              },
              {
                q: "How does payment work?",
                a: "We use PayPal for secure payments. You can pay with your PayPal balance, linked bank account, or credit/debit card through PayPal.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600">
            Not sure which plan is right for you?{" "}
            <Link
              href="/signup"
              className="text-brand-700 font-semibold hover:text-brand-800"
            >
              Start free and upgrade later
            </Link>
          </p>
        </div>
      </div>
    </div>
  );

  if (hasPayPal) {
    return (
      <PayPalScriptProvider
        options={{
          clientId: paypalClientId!,
          vault: true,
          intent: "subscription",
        }}
      >
        {content}
      </PayPalScriptProvider>
    );
  }

  return content;
}
