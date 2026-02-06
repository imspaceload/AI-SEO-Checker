import { AIProvider, RankCheck, DashboardStats } from "@/types";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function getProviderName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
  };
  return names[provider];
}

export function getProviderColor(provider: AIProvider): string {
  const colors: Record<AIProvider, string> = {
    chatgpt: "#10a37f",
    claude: "#d97706",
    gemini: "#4285f4",
  };
  return colors[provider];
}

export function getProviderBgClass(provider: AIProvider): string {
  const classes: Record<AIProvider, string> = {
    chatgpt: "bg-emerald-100 text-emerald-700",
    claude: "bg-amber-100 text-amber-700",
    gemini: "bg-blue-100 text-blue-700",
  };
  return classes[provider];
}

export function computeStats(checks: RankCheck[]): DashboardStats {
  const allResults = checks.flatMap((c) => c.results);
  const rankedResults = allResults.filter((r) => r.isRanked);
  const positions = rankedResults
    .map((r) => r.position)
    .filter((p): p is number => p !== null);

  const providers: AIProvider[] = ["chatgpt", "claude", "gemini"];
  const byProvider = providers.map((provider) => {
    const providerResults = allResults.filter((r) => r.provider === provider);
    return {
      provider,
      total: providerResults.length,
      ranked: providerResults.filter((r) => r.isRanked).length,
    };
  });

  return {
    totalChecks: allResults.length,
    rankedCount: rankedResults.length,
    notRankedCount: allResults.length - rankedResults.length,
    avgPosition: positions.length > 0
      ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
      : null,
    byProvider,
  };
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
