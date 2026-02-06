"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { AIProvider, RankCheckResult } from "@/types";
import { generateId, getProviderName, getProviderBgClass } from "@/lib/utils";
import ProviderBadge from "@/components/ui/ProviderBadge";
import RankBadge from "@/components/ui/RankBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Search,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const providers: { id: AIProvider; name: string; description: string }[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "GPT-4o via RapidAPI",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Perplexity Sonar (real-time web search)",
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Google's Gemini model (optional)",
  },
];

export default function CheckerPage() {
  const [query, setQuery] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<AIProvider[]>([
    "chatgpt",
    "perplexity",
  ]);
  const [isChecking, setIsChecking] = useState(false);
  const [currentResults, setCurrentResults] = useState<RankCheckResult[]>([]);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addCheck, apiKeys } = useStore();

  const toggleProvider = (provider: AIProvider) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    );
  };

  const handleCheck = async () => {
    if (!query.trim() || !website.trim()) return;
    if (selectedProviders.length === 0) {
      setError("Please select at least one AI model.");
      return;
    }

    setIsChecking(true);
    setError(null);
    setCurrentResults([]);

    try {
      const response = await fetch("/api/check-ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          website: website.trim(),
          providers: selectedProviders,
          apiKeys,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to check rankings");
      }

      const data = await response.json();
      setCurrentResults(data.results);

      addCheck({
        id: generateId(),
        query: query.trim(),
        website: website.trim(),
        results: data.results,
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsChecking(false);
    }
  };

  const hasKeys =
    apiKeys.perplexity || apiKeys.rapidapi || apiKeys.google;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-50 rounded-lg">
            <Sparkles className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Check Your AI Rankings
            </h3>
            <p className="text-sm text-gray-500">
              See if your website is mentioned when AI models answer queries
            </p>
          </div>
        </div>

        {!hasKeys && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                API Keys Required
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                Configure your API keys in{" "}
                <a href="/settings" className="underline font-medium">
                  Settings
                </a>{" "}
                to check rankings. You can also set them as environment
                variables.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Search Query
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g., "best project management tools for startups"'
                className="input pl-11"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Enter the query you want to check your ranking for
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g., example.com"
                className="input pl-11"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Domain name to look for in AI responses
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              AI Models to Check
            </label>
            <div className="grid grid-cols-3 gap-3">
              {providers.map((p) => {
                const selected = selectedProviders.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProvider(p.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selected
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {p.name}
                      </span>
                      {selected && (
                        <CheckCircle2 className="w-4 h-4 text-brand-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleCheck}
            disabled={isChecking || !query.trim() || !website.trim()}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
          >
            {isChecking ? (
              <>
                <LoadingSpinner size="sm" />
                Checking Rankings...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Check Rankings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {currentResults.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Results for &ldquo;{query}&rdquo;
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Checking for <span className="font-medium">{website}</span>
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {currentResults.map((result) => (
              <div key={result.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ProviderBadge provider={result.provider} />
                    <span className="text-sm font-medium text-gray-700">
                      {getProviderName(result.provider)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RankBadge
                      isRanked={result.isRanked}
                      position={result.position}
                    />
                    <button
                      onClick={() =>
                        setExpandedResult(
                          expandedResult === result.id ? null : result.id
                        )
                      }
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {expandedResult === result.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {result.snippet && (
                  <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {result.snippet}
                  </p>
                )}

                {expandedResult === result.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Full AI Response
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {result.response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
