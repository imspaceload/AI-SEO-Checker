"use client";

import { useStore } from "@/store/useStore";
import { computeStats } from "@/lib/utils";
import StatCard from "@/components/ui/StatCard";
import RankingChart from "@/components/charts/RankingChart";
import EmptyState from "@/components/ui/EmptyState";
import ProviderBadge from "@/components/ui/ProviderBadge";
import RankBadge from "@/components/ui/RankBadge";
import { formatDate } from "@/lib/utils";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const checks = useStore((s) => s.checks);
  const stats = computeStats(checks);

  const recentResults = checks
    .flatMap((c) =>
      c.results.map((r) => ({
        ...r,
        query: c.query,
        website: c.website,
      }))
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
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
            href="/checker"
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            New Rank Check
          </Link>
        </div>
      </div>

      {/* Recent Results */}
      <div className="card">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Results
          </h3>
          {recentResults.length > 0 && (
            <Link
              href="/results"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {recentResults.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No checks yet"
            description="Run your first rank check to see how your website appears in AI model responses."
            action={{ label: "Run Rank Check", href: "/checker" }}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
