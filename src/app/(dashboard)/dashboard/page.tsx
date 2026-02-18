"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/store/useStore";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Globe,
  Swords,
  TrendingUp,
  Zap,
  Search,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface UsageInfo {
  plan: string;
  promptCount: number;
  promptLimit: number;
  isMonthly: boolean;
  canCheck: boolean;
  remaining: number;
}

function DashboardContent() {
  const analyses = useStore((s) => s.analyses);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const searchParams = useSearchParams();
  const { update } = useSession();

  useEffect(() => {
    fetch("/api/user/usage")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setUsage(data); })
      .catch(() => {});
  }, []);

  // Handle payment success redirect
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true);
      update();
      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => {
        fetch("/api/user/usage")
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data) setUsage(data); })
          .catch(() => {});
      }, 1000);
    }
  }, [searchParams, update]);

  const hasAnalyses = analyses.length > 0;

  // Get ranking stats from result response (provider map JSON)
  const getRankingCount = (analysis: typeof analyses[0]) => {
    let ranked = 0;
    let total = analysis.rankResults.length;
    analysis.rankResults.forEach((r) => {
      try {
        const map = JSON.parse(r.response);
        if (map.perplexity || map.chatgpt || map.gemini) ranked++;
      } catch {
        if (r.isYouRanked) ranked++;
      }
    });
    return { ranked, total };
  };

  return (
    <div className="space-y-8">
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="card p-4 bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Payment successful! Your plan has been upgraded.
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              You now have access to more prompt checks and features.
            </p>
          </div>
          <button
            onClick={() => setPaymentSuccess(false)}
            className="ml-auto text-emerald-600 hover:text-emerald-800 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Usage & Plan Widget */}
      {usage && (
        <div className="card p-6 bg-gradient-to-r from-brand-50 to-purple-50 border-brand-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-brand-600" />
                <h3 className="font-semibold text-gray-900 capitalize">
                  {usage.plan === "free" ? "Free Plan" : `${usage.plan} Plan`}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {usage.promptLimit === -1
                  ? "Unlimited prompt checks"
                  : `${usage.promptCount} of ${usage.promptLimit} prompt checks used${usage.isMonthly ? " this month" : ""}`}
              </p>
              {usage.promptLimit !== -1 && (
                <div className="mt-3 w-64">
                  <div className="w-full bg-white/60 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        !usage.canCheck
                          ? "bg-red-500"
                          : usage.promptCount / usage.promptLimit > 0.8
                          ? "bg-amber-500"
                          : "bg-brand-600"
                      }`}
                      style={{
                        width: `${Math.min(100, (usage.promptCount / usage.promptLimit) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {usage.remaining === 0
                      ? "No checks remaining"
                      : `${usage.remaining} check${usage.remaining !== 1 ? "s" : ""} remaining`}
                  </p>
                </div>
              )}
            </div>
            {usage.plan === "free" ? (
              <Link
                href="/pricing"
                className="btn-primary flex items-center gap-2 px-5 py-2.5"
              >
                Upgrade Plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="badge bg-brand-200 text-brand-800 text-sm capitalize px-3 py-1">
                Active
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hero CTA - Show when no analyses */}
      {!hasAnalyses && (
        <div className="card p-8 bg-gradient-to-br from-brand-50 to-purple-50 border-brand-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Check your AI Search Rankings
              </h2>
              <p className="text-gray-600 mt-2 max-w-lg">
                Enter your website URL and our AI will automatically analyze your business,
                find your competitors, and check where you rank across ChatGPT, Perplexity, and Gemini.
              </p>
              <div className="flex gap-3 mt-6">
                <Link
                  href="/analyze"
                  className="btn-primary flex items-center gap-2 py-2.5 px-5"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze My Website
                </Link>
                <Link
                  href="/checker"
                  className="btn-secondary flex items-center gap-2 py-2.5 px-5"
                >
                  <Search className="w-4 h-4" />
                  Quick Check
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3 bg-white/80 rounded-lg px-4 py-3">
                <Globe className="w-5 h-5 text-brand-600" />
                <span className="text-gray-700">Enter your website URL</span>
              </div>
              <div className="flex items-center gap-3 bg-white/80 rounded-lg px-4 py-3">
                <Swords className="w-5 h-5 text-red-500" />
                <span className="text-gray-700">AI finds your competitors</span>
              </div>
              <div className="flex items-center gap-3 bg-white/80 rounded-lg px-4 py-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-gray-700">See who ranks for your keywords</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Website Analysis History */}
      {hasAnalyses && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Websites</h3>
            <Link
              href="/analyze"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Analysis
            </Link>
          </div>

          <div className="space-y-3">
            {analyses.map((a) => {
              const { ranked, total } = getRankingCount(a);
              const keywordCount = a.keywords.reduce((acc, g) => acc + g.keywords.length, 0);

              return (
                <Link
                  key={a.id}
                  href={`/analyze?id=${a.id}`}
                  className="card p-5 hover:shadow-md transition-shadow block"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-gray-900 truncate">
                          {a.businessName || "Untitled Website"}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            a.status === "complete"
                              ? "bg-emerald-50 text-emerald-700"
                              : a.status === "error"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {a.status === "complete" ? "Complete" : a.status === "error" ? "Error" : "In Progress"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{a.url}</span>
                      </div>
                      {a.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{a.description}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      {keywordCount > 0 && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{keywordCount}</p>
                          <p className="text-xs text-gray-400">Keywords</p>
                        </div>
                      )}
                      {total > 0 && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-emerald-600">
                            {ranked}<span className="text-sm text-gray-400 font-normal">/{total}</span>
                          </p>
                          <p className="text-xs text-gray-400">Ranking</p>
                        </div>
                      )}
                      {total > 0 && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-500">
                            {total - ranked}
                          </p>
                          <p className="text-xs text-gray-400">Not Ranking</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Competitors + Products tags */}
                  {(a.competitors.length > 0 || a.products.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {a.products.slice(0, 3).map((p, i) => (
                        <span key={`p-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                          {p}
                        </span>
                      ))}
                      {a.competitors.slice(0, 4).map((c, i) => (
                        <span key={`c-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {c}
                        </span>
                      ))}
                      {(a.products.length > 3 || a.competitors.length > 4) && (
                        <span className="text-xs text-gray-400 px-1">
                          +{Math.max(0, a.products.length - 3) + Math.max(0, a.competitors.length - 4)} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Per-provider ranking breakdown (if results exist) */}
                  {total > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3">
                      {(["perplexity", "chatgpt", "gemini"] as const).map((provider) => {
                        let providerRanked = 0;
                        let providerTotal = 0;
                        a.rankResults.forEach((r) => {
                          try {
                            const map = JSON.parse(r.response);
                            if (provider in map) {
                              providerTotal++;
                              if (map[provider]) providerRanked++;
                            }
                          } catch {
                            if (r.provider === provider) {
                              providerTotal++;
                              if (r.isYouRanked) providerRanked++;
                            }
                          }
                        });
                        const label = provider === "chatgpt" ? "ChatGPT" : provider === "perplexity" ? "Perplexity" : "Gemini";

                        return (
                          <div key={provider} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{label}</span>
                            {providerTotal > 0 ? (
                              <span className={`font-semibold ${providerRanked > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {providerRanked}/{providerTotal}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
