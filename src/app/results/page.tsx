"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { AIProvider } from "@/types";
import { formatDate, getProviderName } from "@/lib/utils";
import ProviderBadge from "@/components/ui/ProviderBadge";
import RankBadge from "@/components/ui/RankBadge";
import EmptyState from "@/components/ui/EmptyState";
import {
  History,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

export default function ResultsPage() {
  const { checks, clearHistory } = useStore();
  const [filterProvider, setFilterProvider] = useState<AIProvider | "all">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ranked" | "not_ranked"
  >("all");
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  const filteredChecks = checks
    .map((check) => ({
      ...check,
      results: check.results.filter((r) => {
        const matchProvider =
          filterProvider === "all" || r.provider === filterProvider;
        const matchStatus =
          filterStatus === "all" ||
          (filterStatus === "ranked" && r.isRanked) ||
          (filterStatus === "not_ranked" && !r.isRanked);
        return matchProvider && matchStatus;
      }),
    }))
    .filter((check) => check.results.length > 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterProvider}
            onChange={(e) =>
              setFilterProvider(e.target.value as AIProvider | "all")
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Models</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as "all" | "ranked" | "not_ranked"
              )
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Status</option>
            <option value="ranked">Ranked</option>
            <option value="not_ranked">Not Ranked</option>
          </select>
        </div>

        {checks.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Results */}
      {filteredChecks.length === 0 ? (
        <EmptyState
          icon={History}
          title="No results found"
          description={
            checks.length === 0
              ? "Run your first rank check to see results here."
              : "No results match the current filters."
          }
          action={
            checks.length === 0
              ? { label: "Run Rank Check", href: "/checker" }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredChecks.map((check) => (
            <div key={check.id} className="card">
              <button
                onClick={() =>
                  setExpandedCheck(
                    expandedCheck === check.id ? null : check.id
                  )
                }
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-gray-900">
                      &ldquo;{check.query}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      {check.website}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(check.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {check.results.map((r) => (
                      <ProviderBadge key={r.id} provider={r.provider} />
                    ))}
                  </div>
                  {expandedCheck === check.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedCheck === check.id && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {check.results.map((result) => (
                    <div key={result.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ProviderBadge provider={result.provider} />
                          <span className="text-sm text-gray-600">
                            {getProviderName(result.provider)}
                          </span>
                        </div>
                        <RankBadge
                          isRanked={result.isRanked}
                          position={result.position}
                        />
                      </div>
                      {result.snippet && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-2">
                          {result.snippet}
                        </p>
                      )}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Full Response
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {result.response}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
