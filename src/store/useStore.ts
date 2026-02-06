import { create } from "zustand";
import { RankCheck, APIKeyConfig, WebsiteAnalysis } from "@/types";

interface AppState {
  checks: RankCheck[];
  analyses: WebsiteAnalysis[];
  currentAnalysis: WebsiteAnalysis | null;
  apiKeys: APIKeyConfig;
  isLoading: boolean;

  addCheck: (check: RankCheck) => void;
  addAnalysis: (analysis: WebsiteAnalysis) => void;
  updateAnalysis: (id: string, updates: Partial<WebsiteAnalysis>) => void;
  setCurrentAnalysis: (analysis: WebsiteAnalysis | null) => void;
  setApiKeys: (keys: Partial<APIKeyConfig>) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useStore = create<AppState>((set) => ({
  checks: [],
  analyses: [],
  currentAnalysis: null,
  apiKeys: {
    perplexity: "",
    rapidapi: "",
    google: "",
  },
  isLoading: false,

  addCheck: (check) =>
    set((state) => ({ checks: [check, ...state.checks] })),

  addAnalysis: (analysis) =>
    set((state) => ({
      analyses: [analysis, ...state.analyses],
      currentAnalysis: analysis,
    })),

  updateAnalysis: (id, updates) =>
    set((state) => ({
      analyses: state.analyses.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
      currentAnalysis:
        state.currentAnalysis?.id === id
          ? { ...state.currentAnalysis, ...updates }
          : state.currentAnalysis,
    })),

  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

  setApiKeys: (keys) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, ...keys } })),

  setLoading: (loading) => set({ isLoading: loading }),

  clearHistory: () => set({ checks: [], analyses: [], currentAnalysis: null }),
}));
