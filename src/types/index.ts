export type AIProvider = "chatgpt" | "claude" | "gemini";

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
  openai: string;
  anthropic: string;
  google: string;
}
