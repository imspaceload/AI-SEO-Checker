import { create } from "zustand";
import { RankCheck, APIKeyConfig } from "@/types";

interface AppState {
  checks: RankCheck[];
  apiKeys: APIKeyConfig;
  isLoading: boolean;

  addCheck: (check: RankCheck) => void;
  setApiKeys: (keys: Partial<APIKeyConfig>) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useStore = create<AppState>((set) => ({
  checks: [],
  apiKeys: {
    openai: "",
    anthropic: "",
    google: "",
  },
  isLoading: false,

  addCheck: (check) =>
    set((state) => ({ checks: [check, ...state.checks] })),

  setApiKeys: (keys) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, ...keys } })),

  setLoading: (loading) => set({ isLoading: loading }),

  clearHistory: () => set({ checks: [] }),
}));
