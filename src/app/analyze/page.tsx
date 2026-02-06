"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import {
  AIProvider,
  WebsiteAnalysis,
  KeywordGroup,
  KeywordRankResult,
} from "@/types";
import { generateId, getProviderName, getProviderBgClass } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProviderBadge from "@/components/ui/ProviderBadge";
import {
  Globe,
  Search,
  Sparkles,
  Building2,
  Users,
  MapPin,
  Target,
  Trophy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Swords,
} from "lucide-react";

type Step = "input" | "analyzing" | "review" | "keywords" | "ranking" | "results";

export default function AnalyzePage() {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rankingProgress, setRankingProgress] = useState({ current: 0, total: 0, keyword: "" });
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("perplexity");
  const [scrapedInfo, setScrapedInfo] = useState<{
    title: string;
    metaDescription: string;
    headingsCount: number;
    contentLength: number;
  } | null>(null);

  const { apiKeys, addAnalysis, updateAnalysis } = useStore();

  // Step 1: Analyze Website
  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setError(null);
    setStep("analyzing");

    try {
      // Create initial analysis
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

      // Call analyze API
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
      if (data.scraped) {
        setScrapedInfo(data.scraped);
      }
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

  // Step 3: Check Rankings for each keyword
  const handleCheckRankings = async () => {
    if (!analysis || analysis.keywords.length === 0) return;
    setError(null);

    const allKeywords = analysis.keywords.flatMap((g) => g.keywords);
    setRankingProgress({ current: 0, total: allKeywords.length, keyword: "" });

    const results: KeywordRankResult[] = [];

    for (let i = 0; i < allKeywords.length; i++) {
      const keyword = allKeywords[i];
      setRankingProgress({ current: i + 1, total: allKeywords.length, keyword });

      try {
        const res = await fetch("/api/check-competitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword,
            websiteUrl: analysis.url,
            competitors: analysis.competitors,
            provider: selectedProvider,
            apiKeys,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          results.push(data);
        } else {
          const errData = await res.json();
          results.push({
            keyword,
            provider: selectedProvider,
            competitorsFound: [],
            yourRank: null,
            isYouRanked: false,
            response: `Error: ${errData.error}`,
            checkedAt: new Date().toISOString(),
          });
        }
      } catch {
        results.push({
          keyword,
          provider: selectedProvider,
          competitorsFound: [],
          yourRank: null,
          isYouRanked: false,
          response: "Error: Network request failed",
          checkedAt: new Date().toISOString(),
        });
      }

      // Update progressively
      const updated = { ...analysis, rankResults: [...results] };
      setAnalysis(updated);
    }

    const final = { ...analysis, rankResults: results, status: "complete" as const };
    setAnalysis(final);
    updateAnalysis(analysis.id, { rankResults: results, status: "complete" });
    setStep("results");
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
            Scraping your website to read the actual page content, headings, meta tags,
            and structured data. Then feeding it to AI to extract your business info,
            ICP, and competitors.
          </p>
          <div className="mt-6 space-y-2 text-xs text-gray-400 text-left">
            <p>1. Fetching website HTML...</p>
            <p>2. Extracting title, meta, headings, page copy...</p>
            <p>3. AI analyzing real content for ICP and competitors...</p>
          </div>
        </div>
      )}

      {/* Step 2: Review Analysis */}
      {step === "review" && analysis && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Website Analysis Complete
                  </h3>
                  <p className="text-sm text-gray-500">
                    Review the information below, then generate keywords
                  </p>
                </div>
              </div>
            </div>

            {/* Scraped data indicator */}
            {scrapedInfo && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">Scraped from your website:</p>
                <p className="text-sm text-gray-700 font-medium">{scrapedInfo.title}</p>
                {scrapedInfo.metaDescription && (
                  <p className="text-xs text-gray-500 mt-0.5">{scrapedInfo.metaDescription}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {scrapedInfo.headingsCount} headings extracted &middot; {Math.round(scrapedInfo.contentLength / 100) / 10}k chars of content analyzed
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Business Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Business</h4>
                  </div>
                  <p className="text-base font-bold text-gray-900">{analysis.businessName}</p>
                  <p className="text-sm text-gray-600 mt-1">{analysis.description}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Products / Services</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.products.map((p, i) => (
                      <span key={i} className="badge bg-brand-50 text-brand-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Target Market</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Countries</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.targetMarket.countries.map((c, i) => (
                          <span key={i} className="badge bg-green-50 text-green-700">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Industries</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.targetMarket.industries.map((ind, i) => (
                          <span key={i} className="badge bg-purple-50 text-purple-700">{ind}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Ideal Customer Profile</h4>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{analysis.icp.persona}</p>
                  <p className="text-xs text-gray-500 mt-1">{analysis.icp.demographics}</p>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Pain Points</p>
                    <ul className="space-y-1">
                      {analysis.icp.painPoints.map((pp, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">&#x2022;</span>
                          {pp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Competitors Found</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.competitors.map((comp, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </span>
                        <span className="text-gray-700">{comp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateKeywords}
              className="btn-primary w-full py-3 mt-6 flex items-center justify-center gap-2 text-base"
            >
              Generate Long-Tail Keywords
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
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

      {/* Step 3: Keywords Ready - Choose Provider & Check */}
      {step === "ranking" && analysis && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Long-Tail Keywords Generated
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {analysis.keywords.reduce((acc, g) => acc + g.keywords.length, 0)} keywords across {analysis.keywords.length} categories.
              Choose which AI model to check rankings on.
            </p>

            {/* Keywords Preview */}
            <div className="space-y-4 mb-6">
              {analysis.keywords.map((group, gi) => (
                <div key={gi} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{group.category}</h4>
                  <div className="space-y-1">
                    {group.keywords.map((kw, ki) => (
                      <p key={ki} className="text-sm text-gray-600 flex items-start gap-2">
                        <Search className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        {kw}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Provider Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Check rankings on:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["perplexity", "chatgpt", "gemini"] as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedProvider(p)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedProvider === p
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-semibold text-gray-900">
                      {getProviderName(p)}
                    </span>
                    {selectedProvider === p && (
                      <CheckCircle2 className="w-4 h-4 text-brand-600 inline ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCheckRankings}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
            >
              <Trophy className="w-5 h-5" />
              Check Who&apos;s Ranking
            </button>
          </div>
        </div>
      )}

      {/* Ranking Progress + Live Results */}
      {(step === "results" || (step === "ranking" && rankingProgress.total > 0 && rankingProgress.current > 0)) && analysis && (
        <div className="space-y-6">
          {/* Progress Bar */}
          {analysis.status !== "complete" && rankingProgress.total > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                <h3 className="text-base font-semibold text-gray-900">
                  Checking Rankings... ({rankingProgress.current}/{rankingProgress.total})
                </h3>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                <div
                  className="bg-brand-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${(rankingProgress.current / rankingProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 truncate">
                Current: &ldquo;{rankingProgress.keyword}&rdquo;
              </p>
            </div>
          )}

          {/* Summary Stats */}
          {analysis.rankResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5">
                <p className="text-sm text-gray-500">Your Rankings</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {analysis.rankResults.filter((r) => r.isYouRanked).length}
                  <span className="text-sm text-gray-400 font-normal"> / {analysis.rankResults.length}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">keywords where you appear</p>
              </div>
              <div className="card p-5">
                <p className="text-sm text-gray-500">Top Competitor</p>
                {(() => {
                  const counts: Record<string, number> = {};
                  analysis.rankResults.forEach((r) =>
                    r.competitorsFound.forEach((c) => {
                      counts[c.name] = (counts[c.name] || 0) + 1;
                    })
                  );
                  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                  return top ? (
                    <>
                      <p className="text-2xl font-bold text-red-600 mt-1">{top[0]}</p>
                      <p className="text-xs text-gray-400 mt-1">appears in {top[1]} keywords</p>
                    </>
                  ) : (
                    <p className="text-lg text-gray-400 mt-1">-</p>
                  );
                })()}
              </div>
              <div className="card p-5">
                <p className="text-sm text-gray-500">Avg Competitors / Keyword</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {analysis.rankResults.length > 0
                    ? (
                        analysis.rankResults.reduce((acc, r) => acc + r.competitorsFound.length, 0) /
                        analysis.rankResults.length
                      ).toFixed(1)
                    : "0"}
                </p>
                <p className="text-xs text-gray-400 mt-1">competitors mentioned per query</p>
              </div>
            </div>
          )}

          {/* Detailed Results */}
          {analysis.rankResults.length > 0 && (
            <div className="card">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Keyword Rankings
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Checked on <ProviderBadge provider={selectedProvider} />
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {analysis.rankResults.map((result, idx) => (
                  <div key={idx}>
                    <button
                      onClick={() =>
                        setExpandedKeyword(
                          expandedKeyword === result.keyword ? null : result.keyword
                        )
                      }
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            result.isYouRanked
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {result.isYouRanked ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.keyword}
                          </p>
                          <p className="text-xs text-gray-500">
                            {result.competitorsFound.length} competitors found
                            {result.isYouRanked &&
                              ` · You: ${result.yourRank ? `#${result.yourRank}` : "Mentioned"}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {result.isYouRanked ? (
                          <span className="badge-success">
                            {result.yourRank ? `#${result.yourRank}` : "Ranked"}
                          </span>
                        ) : (
                          <span className="badge-error">Not Ranked</span>
                        )}
                        {expandedKeyword === result.keyword ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedKeyword === result.keyword && (
                      <div className="px-6 pb-4 space-y-3">
                        {/* Competitors table */}
                        {result.competitorsFound.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                              Competitors Ranking
                            </h5>
                            <div className="space-y-2">
                              {result.competitorsFound.map((comp, ci) => (
                                <div
                                  key={ci}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                                      {comp.position || "?"}
                                    </span>
                                    <span className="font-medium text-gray-800">{comp.name}</span>
                                    <span className="text-gray-400 text-xs">{comp.url}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Full response */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Full AI Response
                          </h5>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                            {result.response}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
