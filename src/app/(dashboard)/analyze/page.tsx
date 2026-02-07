"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import {
  AIProvider,
  WebsiteAnalysis,
  KeywordGroup,
  KeywordRankResult,
} from "@/types";
import { generateId } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Globe,
  Search,
  Sparkles,
  Building2,
  ArrowRight,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Step = "input" | "analyzing" | "review" | "keywords" | "ranking" | "results";

interface UsageData {
  plan: string;
  promptCount: number;
  promptLimit: number;
  canCheck: boolean;
  remaining: number;
}

export default function AnalyzePage() {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [rankingProgress, setRankingProgress] = useState({ current: 0, total: 0, keyword: "" });
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const { apiKeys, addAnalysis, updateAnalysis } = useStore();

  // Fetch user's plan/usage
  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchUsage();
  }, [session, fetchUsage]);

  const planLimit = usage?.promptLimit ?? 10;
  const isFree = (usage?.plan || "free") === "free";

  // How many keywords this user can see
  const getVisibleLimit = () => {
    if (!isFree && planLimit === -1) return Infinity; // unlimited
    return planLimit;
  };

  // Flatten all keywords with their categories
  const getAllKeywordsFlat = () => {
    if (!analysis) return [];
    const flat: { keyword: string; category: string }[] = [];
    analysis.keywords.forEach((group) => {
      group.keywords.forEach((kw) => {
        flat.push({ keyword: kw, category: group.category });
      });
    });
    return flat;
  };

  // Step 1: Analyze Website
  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setError(null);
    setStep("analyzing");

    try {
      const id = generateId();
      const newAnalysis: WebsiteAnalysis = {
        id,
        url: url.trim(),
        businessName: "",
        description: "",
        products: [],
        icp: { persona: "", painPoints: [], demographics: "" },
        targetMarket: { countries: [], industries: [] },
        competitors: [],
        keywords: [],
        rankResults: [],
        createdAt: new Date().toISOString(),
        status: "analyzing",
      };

      const res = await fetch("/api/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), apiKeys }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze website");
      }

      const data = await res.json();
      const updated: WebsiteAnalysis = {
        ...newAnalysis,
        ...data.analysis,
        status: "keywords",
      };

      setAnalysis(updated);
      addAnalysis(updated);
      setStep("review");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setStep("input");
    }
  };

  // Step 2: Generate Keywords
  const handleGenerateKeywords = async () => {
    if (!analysis) return;
    setError(null);
    setStep("keywords");

    try {
      const res = await fetch("/api/generate-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: analysis.businessName,
          description: analysis.description,
          products: analysis.products,
          icp: analysis.icp,
          targetMarket: analysis.targetMarket,
          competitors: analysis.competitors,
          apiKeys,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate keywords");
      }

      const data = await res.json();
      const keywords: KeywordGroup[] = data.keywords || [];
      const updated = { ...analysis, keywords, status: "ranking" as const };
      setAnalysis(updated);
      updateAnalysis(analysis.id, { keywords, status: "ranking" });
      setStep("ranking");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Keyword generation failed";
      setError(message);
      setStep("review");
    }
  };

  // Step 3: Check Rankings for visible keywords only
  const handleCheckRankings = async () => {
    if (!analysis || analysis.keywords.length === 0) return;
    setError(null);

    const allFlat = getAllKeywordsFlat();
    const limit = getVisibleLimit();
    const visibleKeywords = allFlat.slice(0, limit).map((k) => k.keyword);

    setRankingProgress({ current: 0, total: visibleKeywords.length, keyword: "" });

    const results: KeywordRankResult[] = [];
    const providers: AIProvider[] = ["perplexity", "chatgpt", "gemini"];

    for (let i = 0; i < visibleKeywords.length; i++) {
      const keyword = visibleKeywords[i];
      setRankingProgress({ current: i + 1, total: visibleKeywords.length, keyword });

      // Check on all 3 providers
      const providerResults: Record<string, boolean> = {};
      for (const provider of providers) {
        try {
          const res = await fetch("/api/check-competitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keyword,
              websiteUrl: analysis.url,
              competitors: analysis.competitors,
              provider,
              apiKeys,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            providerResults[provider] = data.isYouRanked;
            // Store result for the last provider checked
            if (provider === providers[providers.length - 1]) {
              results.push(data);
            }
          } else {
            providerResults[provider] = false;
            if (provider === providers[providers.length - 1]) {
              results.push({
                keyword,
                provider,
                competitorsFound: [],
                yourRank: null,
                isYouRanked: false,
                response: "Error checking ranking",
                checkedAt: new Date().toISOString(),
              });
            }
          }
        } catch {
          providerResults[provider] = false;
          if (provider === providers[providers.length - 1]) {
            results.push({
              keyword,
              provider,
              competitorsFound: [],
              yourRank: null,
              isYouRanked: false,
              response: "Network error",
              checkedAt: new Date().toISOString(),
            });
          }
        }
      }

      // Store per-provider results in a map we can access
      results[results.length - 1] = {
        ...results[results.length - 1],
        // Encode provider results in response field for display
        response: JSON.stringify(providerResults),
      };

      const updated = { ...analysis, rankResults: [...results] };
      setAnalysis(updated);
    }

    const final = { ...analysis, rankResults: results, status: "complete" as const };
    setAnalysis(final);
    updateAnalysis(analysis.id, { rankResults: results, status: "complete" });
    setStep("results");
    fetchUsage(); // refresh usage after checking
  };

  // Helper to get ranking status per provider from result
  const getProviderStatus = (result: KeywordRankResult | undefined, provider: string): "yes" | "no" | "pending" => {
    if (!result) return "pending";
    try {
      const map = JSON.parse(result.response);
      if (typeof map === "object" && map !== null && provider in map) {
        return map[provider] ? "yes" : "no";
      }
    } catch {
      // Fallback for old results
    }
    if (result.provider === provider) {
      return result.isYouRanked ? "yes" : "no";
    }
    return "pending";
  };

  const allFlat = getAllKeywordsFlat();
  const visibleLimit = getVisibleLimit();
  const hasLockedKeywords = allFlat.length > visibleLimit;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[
          { key: "input", label: "Enter URL" },
          { key: "review", label: "Review Info" },
          { key: "ranking", label: "Keywords" },
          { key: "results", label: "Rankings" },
        ].map((s, i) => {
          const stepOrder = ["input", "analyzing", "review", "keywords", "ranking", "results"];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(s.key);
          const isActive = currentIdx >= thisIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`w-12 h-0.5 ${isActive ? "bg-brand-500" : "bg-gray-200"}`} />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs ${isActive ? "text-brand-700 font-medium" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Input URL */}
      {step === "input" && (
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Analyze Your Website
              </h3>
              <p className="text-sm text-gray-500">
                Enter your URL and our AI will identify your business, ICP, target market, and competitors
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g., notion.so or https://example.com"
                  className="input pl-11"
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!url.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
            >
              <Search className="w-5 h-5" />
              Analyze Website
            </button>
          </div>
        </div>
      )}

      {/* Analyzing Loader */}
      {step === "analyzing" && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <h3 className="text-lg font-semibold text-gray-900 mt-6">
            Analyzing {url}...
          </h3>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            AI is crawling your website, reading the content, and analyzing your
            business, ideal customer profile, target market, and competitors.
          </p>
        </div>
      )}

      {/* Step 2: Review Analysis */}
      {step === "review" && analysis && (
        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 bg-brand-50 rounded-lg shrink-0">
              <Building2 className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{analysis.businessName}</h3>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{analysis.description}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 divide-y divide-gray-100">
            <div className="py-4 flex flex-wrap items-start gap-x-4 gap-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">Products</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.products.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">{p}</span>
                ))}
              </div>
            </div>

            <div className="py-4 flex flex-wrap items-start gap-x-4 gap-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">ICP</span>
              <div className="text-sm text-gray-700">
                <p>{analysis.icp.persona}</p>
                {analysis.icp.demographics && (
                  <p className="text-xs text-gray-400 mt-1">{analysis.icp.demographics}</p>
                )}
              </div>
            </div>

            <div className="py-4 flex flex-wrap items-start gap-x-4 gap-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">Pain Points</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.icp.painPoints.map((pp, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">{pp}</span>
                ))}
              </div>
            </div>

            <div className="py-4 flex flex-wrap items-start gap-x-4 gap-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">Market</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.targetMarket.countries.map((c, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{c}</span>
                ))}
                {analysis.targetMarket.industries.map((ind, i) => (
                  <span key={`ind-${i}`} className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">{ind}</span>
                ))}
              </div>
            </div>

            <div className="py-4 flex flex-wrap items-start gap-x-4 gap-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">Competitors</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.competitors.map((comp, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">{comp}</span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateKeywords}
            className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2 text-base"
          >
            Generate Long-Tail Keywords
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Keywords Loading */}
      {step === "keywords" && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <h3 className="text-lg font-semibold text-gray-900 mt-6">
            Generating Long-Tail Keywords...
          </h3>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            Creating AI-optimized prompts based on your business profile, ICP, and competitors.
          </p>
        </div>
      )}

      {/* Step 3: Keywords Table + Rankings */}
      {(step === "ranking" || step === "results") && analysis && (
        <div className="space-y-6">
          {/* Header with total and plan info */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Long-Tail Keywords
              </h3>
              <span className="text-sm text-gray-500">
                Total prompts: {Math.min(allFlat.length, visibleLimit === Infinity ? allFlat.length : visibleLimit)} / {allFlat.length}
                {usage && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)} plan)
                  </span>
                )}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              {allFlat.length} keywords across {analysis.keywords.length} categories.
              {step === "ranking" && " Click below to check rankings on all AI models."}
            </p>

            {/* Ranking progress */}
            {rankingProgress.total > 0 && rankingProgress.current > 0 && analysis.status !== "complete" && (
              <div className="mb-6 p-4 bg-brand-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                  <span className="text-sm font-medium text-brand-700">
                    Checking Rankings... ({rankingProgress.current}/{rankingProgress.total})
                  </span>
                </div>
                <div className="w-full bg-brand-100 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all"
                    style={{ width: `${(rankingProgress.current / rankingProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Keywords Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-900 text-white">
                <div className="grid grid-cols-[50px_1fr_150px_90px_90px_90px] items-center px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  <span>#</span>
                  <span>Prompt</span>
                  <span>Category</span>
                  <span className="text-center">Perplexity</span>
                  <span className="text-center">ChatGPT</span>
                  <span className="text-center">Gemini</span>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100 relative">
                {allFlat.map((item, idx) => {
                  const isLocked = idx >= visibleLimit;
                  const result = analysis.rankResults.find((r) => r.keyword === item.keyword);
                  const isChecking = rankingProgress.total > 0 && analysis.status !== "complete";

                  return (
                    <div key={idx}>
                      <div
                        className={`grid grid-cols-[50px_1fr_150px_90px_90px_90px] items-center px-4 py-3 text-sm transition-colors ${
                          isLocked
                            ? "blur-[3px] select-none pointer-events-none opacity-40"
                            : result
                              ? "bg-white hover:bg-gray-50 cursor-pointer"
                              : "bg-white"
                        }`}
                        onClick={() => {
                          if (!isLocked && result) {
                            setExpandedKeyword(expandedKeyword === item.keyword ? null : item.keyword);
                          }
                        }}
                      >
                        <span className="text-gray-400 font-medium">{idx + 1}</span>
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="text-gray-800 truncate">{item.keyword}</span>
                          {result && (
                            expandedKeyword === item.keyword
                              ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 truncate">{item.category}</span>

                        {/* Perplexity */}
                        <div className="flex justify-center">
                          {isLocked ? (
                            <span className="text-gray-300">-</span>
                          ) : isChecking && !result ? (
                            <span className="text-gray-300 text-xs">-</span>
                          ) : result ? (
                            <RankBadge status={getProviderStatus(result, "perplexity")} />
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </div>

                        {/* ChatGPT */}
                        <div className="flex justify-center">
                          {isLocked ? (
                            <span className="text-gray-300">-</span>
                          ) : isChecking && !result ? (
                            <span className="text-gray-300 text-xs">-</span>
                          ) : result ? (
                            <RankBadge status={getProviderStatus(result, "chatgpt")} />
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </div>

                        {/* Gemini */}
                        <div className="flex justify-center">
                          {isLocked ? (
                            <span className="text-gray-300">-</span>
                          ) : isChecking && !result ? (
                            <span className="text-gray-300 text-xs">-</span>
                          ) : result ? (
                            <RankBadge status={getProviderStatus(result, "gemini")} />
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </div>
                      </div>

                      {/* Expanded detail row */}
                      {!isLocked && expandedKeyword === item.keyword && result && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                          {result.competitorsFound.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Competitors Found</h5>
                              <div className="space-y-1.5">
                                {result.competitorsFound.map((comp, ci) => (
                                  <div key={ci} className="flex items-center gap-2 text-sm">
                                    <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                      {comp.position || "?"}
                                    </span>
                                    <span className="font-medium text-gray-800">{comp.name}</span>
                                    {comp.url && <span className="text-gray-400 text-xs">{comp.url}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upgrade overlay for locked keywords */}
            {hasLockedKeywords && (
              <div className="mt-4 p-5 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-lg text-center">
                <Lock className="w-5 h-5 text-brand-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {allFlat.length - (visibleLimit === Infinity ? allFlat.length : visibleLimit)} more keywords available
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Upgrade your plan to unlock all keywords and check rankings across all AI models.
                </p>
                <button
                  onClick={() => router.push("/pricing")}
                  className="btn-primary px-6 py-2 text-sm"
                >
                  Upgrade to View More
                </button>
              </div>
            )}

            {/* Summary stats (after rankings complete) */}
            {step === "results" && analysis.rankResults.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {analysis.rankResults.filter((r) => {
                      try {
                        const map = JSON.parse(r.response);
                        return map.perplexity || map.chatgpt || map.gemini;
                      } catch {
                        return r.isYouRanked;
                      }
                    }).length}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">Keywords Ranking</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {analysis.rankResults.filter((r) => {
                      try {
                        const map = JSON.parse(r.response);
                        return !map.perplexity && !map.chatgpt && !map.gemini;
                      } catch {
                        return !r.isYouRanked;
                      }
                    }).length}
                  </p>
                  <p className="text-xs text-red-700 mt-1">Not Ranking</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {analysis.rankResults.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total Checked</p>
                </div>
              </div>
            )}

            {/* Check Rankings button (only before checking) */}
            {step === "ranking" && rankingProgress.total === 0 && (
              <button
                onClick={handleCheckRankings}
                className="btn-primary w-full py-3 mt-6 flex items-center justify-center gap-2 text-base"
              >
                <Search className="w-5 h-5" />
                Check Who&apos;s Ranking
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Small component for Yes/No ranking badge
function RankBadge({ status }: { status: "yes" | "no" | "pending" }) {
  if (status === "pending") {
    return <span className="text-gray-300 text-xs">-</span>;
  }
  if (status === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Yes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" />
      No
    </span>
  );
}
