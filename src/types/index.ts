export type AIProvider = "chatgpt" | "perplexity" | "gemini";

// Website Analysis
export interface WebsiteAnalysis {
  id: string;
  url: string;
  businessName: string;
  description: string;
  products: string[];
  icp: {
    persona: string;
    painPoints: string[];
    demographics: string;
  };
  targetMarket: {
    countries: string[];
    industries: string[];
  };
  competitors: string[];
  keywords: KeywordGroup[];
  rankResults: KeywordRankResult[];
  createdAt: string;
  status: "analyzing" | "keywords" | "ranking" | "complete" | "error";
}

export interface KeywordGroup {
  category: string;
  keywords: string[];
}

export interface KeywordRankResult {
  keyword: string;
  provider: AIProvider;
  competitorsFound: CompetitorMention[];
  yourRank: number | null;
  isYouRanked: boolean;
  response: string;
  checkedAt: string;
}

export interface CompetitorMention {
  name: string;
  url: string;
  position: number | null;
  snippet: string;
}

// Legacy rank check types (kept for backward compat)
export interface RankCheckResult {
  id: string;
  query: string;
  website: string;
  provider: AIProvider;
  isRanked: boolean;
  position: number | null;
  snippet: string;
  response: string;
  checkedAt: string;
}

export interface RankCheck {
  id: string;
  query: string;
  website: string;
  results: RankCheckResult[];
  createdAt: string;
}

export interface DashboardStats {
  totalChecks: number;
  rankedCount: number;
  notRankedCount: number;
  avgPosition: number | null;
  byProvider: {
    provider: AIProvider;
    total: number;
    ranked: number;
  }[];
}

export interface APIKeyConfig {
  perplexity: string;
  rapidapi: string;
  google: string;
}
