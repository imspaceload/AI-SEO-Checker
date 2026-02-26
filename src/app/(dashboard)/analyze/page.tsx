"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import {
  AIProvider,
  WebsiteAnalysis,
  KeywordGroup,
  KeywordRankResult,
  KeywordItem,
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
  X,
  Lightbulb,
  TrendingUp,
  FileText,
  Target,
  Zap,
  BookOpen,
  ShoppingCart,
  MousePointer,
  Compass,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
} from "lucide-react";

type Step = "input" | "analyzing" | "review" | "keywords" | "ranking" | "results";

interface UsageData {
  plan: string;
  promptCount: number;
  promptLimit: number;
  canCheck: boolean;
  remaining: number;
}

// Per-keyword detail: stores ranking info per provider
interface KeywordDetail {
  keyword: string;
  providers: Record<string, {
    isRanked: boolean;
    response: string;
    responseSnippet: string;
    competitorsFound: { name: string; url: string; position: number | null; snippet: string }[];
  }>;
}

interface ContentSuggestion {
  query: string;
  intent: string;
  contentType: string;
  title: string;
  why: string;
}

interface ContentSuggestionsData {
  contentQueries: ContentSuggestion[];
  quickWins: string[];
  contentGaps: string[];
}

function AnalyzeContent() {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [rankingProgress, setRankingProgress] = useState({ current: 0, total: 0, keyword: "" });
  const [keywordDetails, setKeywordDetails] = useState<Record<string, KeywordDetail>>({});
  const [modalKeyword, setModalKeyword] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<Record<string, string>>({});
  const [loadingGap, setLoadingGap] = useState(false);
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestionsData | null>(null);
  const [loadingContentSuggestions, setLoadingContentSuggestions] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKeys, analyses, addAnalysis, updateAnalysis } = useStore();

  // Load saved analysis from store when ?id= param is present
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && !analysis) {
      const saved = analyses.find((a) => a.id === id);
      if (saved) {
        setAnalysis(saved);
        setUrl(saved.url);
        if (saved.status === "complete" && saved.rankResults.length > 0) {
          const details: Record<string, KeywordDetail> = {};
          saved.rankResults.forEach((r) => {
            try {
              const providerMap = JSON.parse(r.response);
              if (typeof providerMap === "object" && providerMap.providerData) {
                // New format with response snippets
                details[r.keyword] = {
                  keyword: r.keyword,
                  providers: providerMap.providerData,
                };
              } else if (typeof providerMap === "object") {
                // Legacy format
                details[r.keyword] = {
                  keyword: r.keyword,
                  providers: Object.fromEntries(
                    Object.entries(providerMap).map(([prov, ranked]) => [
                      prov,
                      {
                        isRanked: !!ranked,
                        response: "",
                        responseSnippet: "",
                        competitorsFound: prov === r.provider ? (r.competitorsFound || []) : [],
                      },
                    ])
                  ),
                };
              }
            } catch {
              // legacy format
            }
          });
          setKeywordDetails(details);
          setStep("results");
        } else if (saved.keywords.length > 0) {
          setStep("ranking");
        } else if (saved.businessName) {
          setStep("review");
        }
      }
    }
  }, [searchParams, analyses, analysis]);

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

  const getVisibleLimit = () => {
    if (!isFree && planLimit === -1) return Infinity;
    return planLimit;
  };

  // Helper to normalize keyword items (support both old string[] and new KeywordItem[] format)
  const normalizeKeyword = (kw: string | KeywordItem): { keyword: string; intent: string } => {
    if (typeof kw === "string") return { keyword: kw, intent: "commercial" };
    return { keyword: kw.keyword, intent: kw.intent || "commercial" };
  };

  const getAllKeywordsFlat = () => {
    if (!analysis) return [];
    const flat: { keyword: string; category: string; intent: string }[] = [];
    analysis.keywords.forEach((group) => {
      group.keywords.forEach((kw) => {
        const { keyword, intent } = normalizeKeyword(kw);
        flat.push({ keyword, category: group.category, intent });
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

  // Step 3: Check Rankings - Actually queries each AI provider
  const handleCheckRankings = async () => {
    if (!analysis || analysis.keywords.length === 0) return;
    setError(null);

    const allFlat = getAllKeywordsFlat();
    const limit = getVisibleLimit();
    const visibleKeywords = allFlat.slice(0, limit);
    const providers: AIProvider[] = ["perplexity", "chatgpt", "gemini"];

    setRankingProgress({ current: 0, total: visibleKeywords.length, keyword: "" });

    const details: Record<string, KeywordDetail> = {};
    const results: KeywordRankResult[] = [];

    for (let i = 0; i < visibleKeywords.length; i++) {
      const { keyword } = visibleKeywords[i];
      setRankingProgress({ current: i + 1, total: visibleKeywords.length, keyword });

      const detail: KeywordDetail = { keyword, providers: {} };
      const providerData: Record<string, { isRanked: boolean; responseSnippet: string }> = {};

      for (const provider of providers) {
        try {
          const res = await fetch("/api/check-competitors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keyword,
              websiteUrl: analysis.url,
              businessName: analysis.businessName,
              competitors: analysis.competitors,
              provider,
              apiKeys,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            providerData[provider] = {
              isRanked: data.isYouRanked,
              responseSnippet: data.responseSnippet || "",
            };
            detail.providers[provider] = {
              isRanked: data.isYouRanked,
              response: data.response,
              responseSnippet: data.responseSnippet || "",
              competitorsFound: data.competitorsFound || [],
            };
          } else {
            providerData[provider] = { isRanked: false, responseSnippet: "" };
            detail.providers[provider] = { isRanked: false, response: "", responseSnippet: "", competitorsFound: [] };
          }
        } catch {
          providerData[provider] = { isRanked: false, responseSnippet: "" };
          detail.providers[provider] = { isRanked: false, response: "", responseSnippet: "", competitorsFound: [] };
        }
      }

      details[keyword] = detail;
      setKeywordDetails({ ...details });

      // Store with new format that preserves per-provider data
      results.push({
        keyword,
        provider: "perplexity",
        competitorsFound: [
          ...(detail.providers.perplexity?.competitorsFound || []),
          ...(detail.providers.chatgpt?.competitorsFound || []),
          ...(detail.providers.gemini?.competitorsFound || []),
        ],
        yourRank: null,
        isYouRanked: Object.values(providerData).some((p) => p.isRanked),
        response: JSON.stringify({
          providerData: Object.fromEntries(
            Object.entries(detail.providers).map(([prov, data]) => [
              prov,
              {
                isRanked: data.isRanked,
                responseSnippet: data.responseSnippet,
                response: "",
                competitorsFound: data.competitorsFound,
              },
            ])
          ),
        }),
        checkedAt: new Date().toISOString(),
      });

      const updated = { ...analysis, rankResults: [...results] };
      setAnalysis(updated);
    }

    const final = { ...analysis, rankResults: results, status: "complete" as const };
    setAnalysis(final);
    updateAnalysis(analysis.id, { rankResults: results, status: "complete" });
    setStep("results");
    fetchUsage();
  };

  // Get provider status from stored details or fallback to rankResults
  const getProviderStatus = (keyword: string, provider: string): "yes" | "no" | "pending" => {
    const detail = keywordDetails[keyword];
    if (detail?.providers[provider]) {
      return detail.providers[provider].isRanked ? "yes" : "no";
    }
    if (analysis) {
      const result = analysis.rankResults.find((r) => r.keyword === keyword);
      if (result) {
        try {
          const map = JSON.parse(result.response);
          if (map.providerData?.[provider]) {
            return map.providerData[provider].isRanked ? "yes" : "no";
          }
          // Legacy format
          if (typeof map === "object" && provider in map && !map.providerData) {
            return map[provider] ? "yes" : "no";
          }
        } catch {
          // not a JSON map
        }
      }
    }
    return "pending";
  };

  // Build a KeywordDetail from rankResults when keywordDetails is missing
  const getOrBuildDetail = (keyword: string): KeywordDetail | null => {
    if (keywordDetails[keyword]) return keywordDetails[keyword];
    if (!analysis) return null;
    const result = analysis.rankResults.find((r) => r.keyword === keyword);
    if (!result) return null;
    try {
      const parsed = JSON.parse(result.response);
      if (parsed.providerData) {
        return { keyword, providers: parsed.providerData };
      }
      // Legacy format
      if (typeof parsed === "object") {
        return {
          keyword,
          providers: Object.fromEntries(
            Object.entries(parsed).map(([prov, ranked]) => [
              prov,
              {
                isRanked: !!ranked,
                response: "",
                responseSnippet: "",
                competitorsFound: prov === result.provider ? (result.competitorsFound || []) : [],
              },
            ])
          ),
        };
      }
    } catch {
      // fallback
    }
    return null;
  };

  // Generate gap analysis for a keyword using server-side API
  const fetchGapAnalysis = async (keyword: string) => {
    if (gapAnalysis[keyword] || !analysis) return;
    setLoadingGap(true);

    const detail = keywordDetails[keyword] || getOrBuildDetail(keyword);
    if (!detail) { setLoadingGap(false); return; }

    const rankingSummary = Object.entries(detail.providers).map(([prov, data]) => {
      const provName = prov === "chatgpt" ? "ChatGPT" : prov === "perplexity" ? "Perplexity" : "Gemini";
      const topCompetitors = data.competitorsFound.slice(0, 5).map(c => c.name).join(", ");
      return `${provName}: ${data.isRanked ? "You ARE ranked" : "You are NOT ranked"}${topCompetitors ? `. Top competitors: ${topCompetitors}` : ""}`;
    }).join("\n");

    try {
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          websiteUrl: analysis.url,
          businessName: analysis.businessName,
          rankingSummary,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGapAnalysis(prev => ({ ...prev, [keyword]: data.analysis }));
      } else {
        setGapAnalysis(prev => ({ ...prev, [keyword]: "Could not generate gap analysis. Please try again." }));
      }
    } catch {
      setGapAnalysis(prev => ({ ...prev, [keyword]: "Could not generate gap analysis. Please try again." }));
    } finally {
      setLoadingGap(false);
    }
  };

  // Fetch content suggestions after rankings complete
  const fetchContentSuggestions = async () => {
    if (!analysis || contentSuggestions || loadingContentSuggestions) return;
    setLoadingContentSuggestions(true);

    try {
      const res = await fetch("/api/content-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: analysis.businessName,
          description: analysis.description,
          products: analysis.products,
          url: analysis.url,
          rankingResults: analysis.rankResults,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContentSuggestions(data);
      }
    } catch {
      // silent
    } finally {
      setLoadingContentSuggestions(false);
    }
  };

  // Open modal and trigger gap analysis
  const openModal = (keyword: string) => {
    setModalKeyword(keyword);
    setExpandedProvider(null);
    if (!keywordDetails[keyword]) {
      const built = getOrBuildDetail(keyword);
      if (built) {
        setKeywordDetails(prev => ({ ...prev, [keyword]: built }));
      }
    }
    fetchGapAnalysis(keyword);
  };

  const allFlat = getAllKeywordsFlat();
  const visibleLimit = getVisibleLimit();
  const hasLockedKeywords = allFlat.length > visibleLimit;
  const modalDetail = modalKeyword ? (keywordDetails[modalKeyword] || getOrBuildDetail(modalKeyword)) : null;

  const intentConfig: Record<string, { label: string; color: string; icon: typeof Target }> = {
    informational: { label: "Informational", color: "bg-blue-50 text-blue-700 border-blue-200", icon: BookOpen },
    commercial: { label: "Commercial", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Target },
    transactional: { label: "Transactional", color: "bg-green-50 text-green-700 border-green-200", icon: ShoppingCart },
    navigational: { label: "Navigational", color: "bg-orange-50 text-orange-700 border-orange-200", icon: Compass },
  };

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
                    isActive ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"
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
              <h3 className="text-lg font-semibold text-gray-900">Analyze Your Website</h3>
              <p className="text-sm text-gray-500">
                Enter your URL and our AI will identify your business, ICP, target market, and competitors
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website URL</label>
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
          <h3 className="text-lg font-semibold text-gray-900 mt-6">Analyzing {url}...</h3>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            AI is crawling your website, reading the content, and analyzing your business, ideal customer profile, target market, and competitors.
          </p>
        </div>
      )}

      {/* Step 2: Review Analysis */}
      {step === "review" && analysis && (
        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
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
            <InfoRow label="Products">{analysis.products.map((p, i) => <Tag key={i} color="brand">{p}</Tag>)}</InfoRow>
            <InfoRow label="ICP">
              <div className="text-sm text-gray-700">
                <p>{analysis.icp.persona}</p>
                {analysis.icp.demographics && <p className="text-xs text-gray-400 mt-1">{analysis.icp.demographics}</p>}
              </div>
            </InfoRow>
            <InfoRow label="Pain Points">{analysis.icp.painPoints.map((pp, i) => <Tag key={i} color="red">{pp}</Tag>)}</InfoRow>
            <InfoRow label="Market">
              {analysis.targetMarket.countries.map((c, i) => <Tag key={i} color="green">{c}</Tag>)}
              {analysis.targetMarket.industries.map((ind, i) => <Tag key={`i${i}`} color="purple">{ind}</Tag>)}
            </InfoRow>
            <InfoRow label="Competitors">{analysis.competitors.map((c, i) => <Tag key={i} color="gray">{c}</Tag>)}</InfoRow>
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
          <h3 className="text-lg font-semibold text-gray-900 mt-6">Generating Long-Tail Keywords...</h3>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            Creating AI-optimized prompts based on your business profile, ICP, and competitors.
          </p>
        </div>
      )}

      {/* Step 3: Keywords Table + Rankings */}
      {(step === "ranking" || step === "results") && analysis && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900">Long-Tail Keywords</h3>
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
              Each query is sent to Perplexity, ChatGPT &amp; Gemini to check if they cite your website.
              {step === "ranking" && rankingProgress.total === 0 && " Click below to start checking."}
            </p>

            {/* Ranking progress */}
            {rankingProgress.total > 0 && rankingProgress.current > 0 && analysis.status !== "complete" && (
              <div className="mb-6 p-4 bg-brand-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                  <span className="text-sm font-medium text-brand-700">
                    Querying AI models... ({rankingProgress.current}/{rankingProgress.total})
                  </span>
                </div>
                <p className="text-xs text-brand-600 mb-2 truncate">
                  Checking: &ldquo;{rankingProgress.keyword}&rdquo;
                </p>
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
              <div className="bg-gray-900 text-white">
                <div className="grid grid-cols-[40px_1fr_80px_90px_90px_90px] items-center px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                  <span>#</span>
                  <span>Prompt</span>
                  <span className="text-center">Intent</span>
                  <span className="text-center">Perplexity</span>
                  <span className="text-center">ChatGPT</span>
                  <span className="text-center">Gemini</span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {allFlat.map((item, idx) => {
                  const isLocked = idx >= visibleLimit;
                  const hasResult = !!keywordDetails[item.keyword] || !!analysis.rankResults.find((r) => r.keyword === item.keyword);
                  const intent = intentConfig[item.intent] || intentConfig.commercial;

                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-[40px_1fr_80px_90px_90px_90px] items-center px-4 py-3.5 text-sm transition-colors ${
                        isLocked
                          ? "blur-[3px] select-none pointer-events-none opacity-40"
                          : hasResult
                            ? "bg-white hover:bg-gray-50 cursor-pointer"
                            : "bg-white"
                      }`}
                      onClick={() => {
                        if (!isLocked && hasResult) openModal(item.keyword);
                      }}
                    >
                      <span className="text-gray-400 font-medium">{idx + 1}</span>
                      <div className="min-w-0 pr-3">
                        <p className="text-gray-800 leading-snug">{item.keyword}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                      </div>
                      <div className="flex justify-center">
                        <IntentBadge intent={item.intent} config={intent} />
                      </div>
                      <div className="flex justify-center">
                        <StatusBadge status={isLocked ? "locked" : getProviderStatus(item.keyword, "perplexity")} />
                      </div>
                      <div className="flex justify-center">
                        <StatusBadge status={isLocked ? "locked" : getProviderStatus(item.keyword, "chatgpt")} />
                      </div>
                      <div className="flex justify-center">
                        <StatusBadge status={isLocked ? "locked" : getProviderStatus(item.keyword, "gemini")} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upgrade overlay */}
            {hasLockedKeywords && (
              <div className="mt-4 p-5 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-lg text-center">
                <Lock className="w-5 h-5 text-brand-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {allFlat.length - (visibleLimit === Infinity ? allFlat.length : visibleLimit)} more keywords available
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Upgrade your plan to unlock all keywords and check rankings across all AI models.
                </p>
                <button onClick={() => router.push("/pricing")} className="btn-primary px-6 py-2 text-sm">
                  Upgrade to View More
                </button>
              </div>
            )}

            {/* Summary stats */}
            {step === "results" && analysis.rankResults.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {analysis.rankResults.filter((r) => r.isYouRanked).length}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">Keywords Ranking</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {analysis.rankResults.filter((r) => !r.isYouRanked).length}
                  </p>
                  <p className="text-xs text-red-700 mt-1">Not Ranking</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gray-900">{analysis.rankResults.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Checked</p>
                </div>
              </div>
            )}

            {/* Check Rankings button */}
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

          {/* Content Suggestions Section */}
          {step === "results" && analysis.rankResults.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Content Strategy</h3>
                    <p className="text-sm text-gray-500">AI-generated queries and content to help you get cited</p>
                  </div>
                </div>
                {!contentSuggestions && !loadingContentSuggestions && (
                  <button
                    onClick={fetchContentSuggestions}
                    className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Suggestions
                  </button>
                )}
              </div>

              {loadingContentSuggestions && (
                <div className="flex items-center gap-3 p-6 bg-amber-50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                  <span className="text-sm text-amber-700">Analyzing your rankings and generating content strategy...</span>
                </div>
              )}

              {contentSuggestions && (
                <div className="space-y-6">
                  {/* Quick Wins */}
                  {contentSuggestions.quickWins?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Quick Wins
                      </h4>
                      <div className="space-y-2">
                        {contentSuggestions.quickWins.map((win, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <span className="text-sm text-gray-700">{win}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Gaps */}
                  {contentSuggestions.contentGaps?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-red-500" />
                        Content Gaps
                      </h4>
                      <div className="space-y-2">
                        {contentSuggestions.contentGaps.map((gap, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <span className="text-sm text-gray-700">{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Content Queries */}
                  {contentSuggestions.contentQueries?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-600" />
                        Queries to Target ({contentSuggestions.contentQueries.length})
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 grid grid-cols-[1fr_80px_90px] px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span>Query &amp; Content</span>
                          <span className="text-center">Intent</span>
                          <span className="text-center">Type</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {contentSuggestions.contentQueries.map((sq, i) => {
                            const sqIntent = intentConfig[sq.intent] || intentConfig.commercial;
                            return (
                              <div key={i} className="px-4 py-3">
                                <div className="grid grid-cols-[1fr_80px_90px] items-start">
                                  <div className="pr-3">
                                    <p className="text-sm font-medium text-gray-900">{sq.query}</p>
                                    <p className="text-xs text-brand-600 mt-1">{sq.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{sq.why}</p>
                                  </div>
                                  <div className="flex justify-center pt-0.5">
                                    <IntentBadge intent={sq.intent} config={sqIntent} />
                                  </div>
                                  <div className="flex justify-center pt-0.5">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                                      {sq.contentType}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {modalKeyword && modalDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModalKeyword(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between rounded-t-xl">
              <div className="pr-4">
                <p className="text-base font-semibold text-gray-900 leading-snug">{modalKeyword}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-400">
                    {allFlat.find(f => f.keyword === modalKeyword)?.category}
                  </p>
                  {(() => {
                    const found = allFlat.find(f => f.keyword === modalKeyword);
                    if (found) {
                      const ic = intentConfig[found.intent] || intentConfig.commercial;
                      return <IntentBadge intent={found.intent} config={ic} />;
                    }
                    return null;
                  })()}
                </div>
              </div>
              <button onClick={() => setModalKeyword(null)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Per-provider ranking status with AI response proof */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  AI Verification Results
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  Each query was sent to the AI model. Below is whether your website was mentioned in their response.
                </p>
                <div className="space-y-3">
                  {(["perplexity", "chatgpt", "gemini"] as const).map((prov) => {
                    const data = modalDetail.providers[prov];
                    const label = prov === "chatgpt" ? "ChatGPT" : prov === "perplexity" ? "Perplexity" : "Gemini";
                    const isExpanded = expandedProvider === prov;

                    return (
                      <div
                        key={prov}
                        className={`rounded-lg border ${
                          data?.isRanked
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <button
                          className="w-full flex items-center justify-between p-3"
                          onClick={() => setExpandedProvider(isExpanded ? null : prov)}
                        >
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-semibold text-gray-600">{label}</p>
                            <div className="flex items-center gap-1">
                              {data?.isRanked ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span className="text-sm font-bold text-emerald-700">Cited</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-sm font-bold text-red-600">Not Cited</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <MessageSquareQuote className="w-3.5 h-3.5" />
                            <span className="text-[10px]">View Response</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </button>

                        {/* Expandable AI response proof */}
                        {isExpanded && data?.responseSnippet && (
                          <div className="px-3 pb-3">
                            <div className="p-3 bg-white/80 rounded border border-gray-200 text-xs text-gray-600 leading-relaxed">
                              <p className="font-medium text-gray-500 mb-1">AI Response Snippet:</p>
                              <p className="italic">&ldquo;{data.responseSnippet}&rdquo;</p>
                            </div>
                          </div>
                        )}
                        {isExpanded && !data?.responseSnippet && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-gray-400 italic">Response snippet not available for this check.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top competitors found across providers */}
              {(() => {
                const allComps = new Map<string, { name: string; url: string; position: number | null; snippet: string; providers: string[] }>();
                Object.entries(modalDetail.providers).forEach(([prov, data]) => {
                  data.competitorsFound.forEach(c => {
                    const key = c.name.toLowerCase();
                    if (allComps.has(key)) {
                      allComps.get(key)!.providers.push(prov);
                    } else {
                      allComps.set(key, { ...c, providers: [prov] });
                    }
                  });
                });
                const sorted = Array.from(allComps.values()).sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).slice(0, 10);

                if (sorted.length === 0) return null;

                return (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Search className="w-4 h-4 text-brand-600" />
                      Who&apos;s Showing Up ({sorted.length} competitors)
                    </h4>
                    <div className="space-y-2">
                      {sorted.map((comp, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="w-6 h-6 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {comp.position ?? i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{comp.name}</span>
                              <span className="text-xs text-gray-400">{comp.url}</span>
                            </div>
                            {comp.snippet && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{comp.snippet}</p>
                            )}
                            <div className="flex gap-1 mt-1.5">
                              {comp.providers.map(p => (
                                <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 font-medium">
                                  {p === "chatgpt" ? "ChatGPT" : p === "perplexity" ? "Perplexity" : "Gemini"}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Gap Analysis */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  How to Start Ranking
                </h4>
                {loadingGap && !gapAnalysis[modalKeyword] ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                    <span className="text-sm text-amber-700">Analyzing your ranking gap...</span>
                  </div>
                ) : gapAnalysis[modalKeyword] ? (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {gapAnalysis[modalKeyword]}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                    Gap analysis will appear after rankings are checked.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}

// Reusable components
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4 flex flex-wrap items-start gap-x-4 gap-y-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-24 shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: "brand" | "red" | "green" | "purple" | "gray" }) {
  const colors = {
    brand: "bg-brand-50 text-brand-700",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[color]}`}>{children}</span>;
}

function StatusBadge({ status }: { status: "yes" | "no" | "pending" | "locked" }) {
  if (status === "locked" || status === "pending") return <span className="text-gray-300 text-xs">-</span>;
  if (status === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />Yes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" />No
    </span>
  );
}

function IntentBadge({ intent, config }: { intent: string; config: { label: string; color: string; icon: React.ElementType } }) {
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${config.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {config.label.slice(0, 5)}
    </span>
  );
}
