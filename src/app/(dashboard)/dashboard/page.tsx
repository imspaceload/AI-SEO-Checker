"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/store/useStore";
import { computeStats, formatDate } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import RankingChart from "@/components/charts/RankingChart";
import ProviderBadge from "@/components/ui/ProviderBadge";
import RankBadge from "@/components/ui/RankBadge";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  ArrowRight,
  Sparkles,
  Globe,
  Swords,
  Zap,
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
  const checks = useStore((s) => s.checks);
  const analyses = useStore((s) => s.analyses);
  const stats = computeStats(checks);
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
      // Refresh session to pick up new plan
      update();
      // Remove query param from URL
      window.history.replaceState({}, "", "/dashboard");
      // Refresh usage data
      setTimeout(() => {
        fetch("/api/user/usage")
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data) setUsage(data); })
          .catch(() => {});
      }, 1000);
    }
  }, [searchParams, update]);

  const recentResults = checks
    .flatMap((c) =>
      c.results.map((r) => ({
        ...r,
        query: c.query,
        website: c.website,
      }))
    )
    .slice(0, 5);

  const hasData = checks.length > 0 || analyses.length > 0;

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

      {/* Hero CTA - Show when no data */}
      {!hasData && (
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

      {/* Latest Analysis Summary */}
      {analyses.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Latest Analysis</h3>
            <Link
              href="/analyze"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              New Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {analyses.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.businessName}</p>
                  <p className="text-xs text-gray-500">{a.url}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      {a.rankResults.filter((r) => r.isYouRanked).length}/{a.rankResults.length}
                    </p>
                    <p className="text-xs text-gray-400">keywords ranked</p>
                  </div>
                  <span
                    className={`badge ${
                      a.status === "complete" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.status === "complete" ? "Complete" : "In Progress"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {hasData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Checks"
              value={stats.totalChecks}
              icon={BarChart3}
              iconColor="text-brand-600"
              iconBg="bg-brand-50"
            />
            <StatCard
              title="Ranked"
              value={stats.rankedCount}
              subtitle={
                stats.totalChecks > 0
                  ? `${Math.round((stats.rankedCount / stats.totalChecks) * 100)}% of checks`
                  : undefined
              }
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <StatCard
              title="Not Ranked"
              value={stats.notRankedCount}
              icon={XCircle}
              iconColor="text-red-600"
              iconBg="bg-red-50"
            />
            <StatCard
              title="Avg Position"
              value={stats.avgPosition !== null ? `#${stats.avgPosition}` : "N/A"}
              subtitle="When mentioned"
              icon={TrendingUp}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
          </div>

          {/* Chart + Provider breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ranking Overview by AI Model
              </h3>
              <RankingChart checks={checks} />
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Provider Breakdown
              </h3>
              <div className="space-y-4">
                {stats.byProvider.map((p) => (
                  <div key={p.provider} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <ProviderBadge provider={p.provider} />
                      <span className="text-sm text-gray-500">
                        {p.ranked}/{p.total} ranked
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all bg-brand-500"
                        style={{
                          width: p.total > 0 ? `${(p.ranked / p.total) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/analyze"
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Website
              </Link>
            </div>
          </div>

          {/* Recent Results */}
          {recentResults.length > 0 && (
            <div className="card">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Quick Checks
                </h3>
                <Link
                  href="/results"
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          &ldquo;{result.query}&rdquo;
                        </p>
                        <ProviderBadge provider={result.provider} />
                      </div>
                      <p className="text-xs text-gray-500">{result.website}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <RankBadge
                        isRanked={result.isRanked}
                        position={result.position}
                      />
                      <span className="text-xs text-gray-400">
                        {formatDate(result.checkedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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
